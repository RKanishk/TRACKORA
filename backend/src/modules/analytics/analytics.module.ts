import { Router, type Request, type Response } from "express";
import { eq, gte, and, count, avg, sql } from "drizzle-orm";

import { db } from "../../db/client";
import { shipments } from "../../db/schema";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { asyncHandler } from "../../lib/async-handler";
import type { ShipmentStatus } from "../../db/schema";

export const analyticsRouter = Router();
analyticsRouter.use(authenticate);

/**
 * Backs the dashboard KPI cards (active shipments, on-time rate,
 * average delivery time) shown in the frontend's hero/dashboard mock.
 * All aggregates are computed with a single tenant-scoped GROUP BY —
 * no N+1 queries across shipment rows.
 */
analyticsRouter.get(
  "/analytics/overview",
  requirePermission("analytics:read"),
  asyncHandler(async (req: Request, res: Response) => {
    const tenantId = req.auth!.tenantId;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const statusCounts = await db
      .select({ status: shipments.status, value: count() })
      .from(shipments)
      .where(eq(shipments.tenantId, tenantId))
      .groupBy(shipments.status);

    const counts = statusCounts.reduce<Record<ShipmentStatus, number>>(
      (acc, row) => ({ ...acc, [row.status]: row.value }),
      { queued: 0, in_transit: 0, delivered: 0, delayed: 0, failed: 0 },
    );

    const [avgDeliverySeconds] = await db
      .select({
        value: avg(
          sql<number>`extract(epoch from (${shipments.deliveredAt} - ${shipments.createdAt}))`,
        ),
      })
      .from(shipments)
      .where(
        and(
          eq(shipments.tenantId, tenantId),
          eq(shipments.status, "delivered"),
          gte(shipments.deliveredAt, thirtyDaysAgo),
        ),
      );

    const totalRecent = counts.delivered + counts.delayed + counts.failed;
    const onTimeRate = totalRecent > 0 ? counts.delivered / totalRecent : null;

    res.status(200).json({
      data: {
        activeShipments: counts.queued + counts.in_transit + counts.delayed,
        shipmentsByStatus: counts,
        onTimeRate,
        averageDeliverySeconds: avgDeliverySeconds?.value ? Number(avgDeliverySeconds.value) : null,
      },
    });
  }),
);
