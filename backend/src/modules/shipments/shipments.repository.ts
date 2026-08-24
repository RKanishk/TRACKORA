import { and, count, desc, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { shipments } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import type { NewShipment, ShipmentStatus } from "../../db/schema";

export const shipmentsRepository = {
  async list(
    tenantId: string,
    filters: { status?: ShipmentStatus; driverId?: string },
    offset: number,
    limit: number,
  ) {
    const extra = [
      filters.status ? eq(shipments.status, filters.status) : undefined,
      filters.driverId ? eq(shipments.driverId, filters.driverId) : undefined,
    ].filter((c): c is NonNullable<typeof c> => c !== undefined);

    const condition = withTenant(shipments.tenantId, tenantId, ...extra);

    const [items, [totalRow]] = await Promise.all([
      db.query.shipments.findMany({
        where: condition,
        limit,
        offset,
        orderBy: (table) => [desc(table.createdAt)],
      }),
      db.select({ value: count() }).from(shipments).where(condition),
    ]);
    return { items, total: totalRow?.value ?? 0 };
  },

  findByIdInTenant(tenantId: string, id: string) {
    return db.query.shipments.findFirst({
      where: withTenant(shipments.tenantId, tenantId, eq(shipments.id, id)),
    });
  },

  countByTenantAndCode(tenantId: string, trackingCode: string) {
    return db
      .select({ value: count() })
      .from(shipments)
      .where(and(eq(shipments.tenantId, tenantId), eq(shipments.trackingCode, trackingCode)));
  },

  async create(record: Omit<NewShipment, "id">) {
    const [created] = await db.insert(shipments).values(record).returning();
    return created;
  },

  async update(tenantId: string, id: string, patch: Partial<NewShipment>) {
    const [updated] = await db
      .update(shipments)
      .set({ ...patch, updatedAt: new Date() })
      .where(withTenant(shipments.tenantId, tenantId, eq(shipments.id, id)))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const [deleted] = await db
      .delete(shipments)
      .where(withTenant(shipments.tenantId, tenantId, eq(shipments.id, id)))
      .returning();
    return deleted;
  },

  /** Overview counts for the analytics module — grouped by status, tenant-scoped. */
  countsByStatus(tenantId: string) {
    return db
      .select({ status: shipments.status, value: count() })
      .from(shipments)
      .where(eq(shipments.tenantId, tenantId))
      .groupBy(shipments.status);
  },
};
