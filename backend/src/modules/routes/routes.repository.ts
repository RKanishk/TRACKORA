import { count, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { routes as routesTable, routeStops, shipments } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import type { NewRoute, RouteStatus } from "../../db/schema";

export const routesRepository = {
  async list(tenantId: string, filters: { status?: RouteStatus }, offset: number, limit: number) {
    const condition = filters.status
      ? withTenant(routesTable.tenantId, tenantId, eq(routesTable.status, filters.status))
      : withTenant(routesTable.tenantId, tenantId);

    const [items, [totalRow]] = await Promise.all([
      db.query.routes.findMany({
        where: condition,
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.plannedDate)],
        with: { stops: true },
      }),
      db.select({ value: count() }).from(routesTable).where(condition),
    ]);
    return { items, total: totalRow?.value ?? 0 };
  },

  findByIdInTenant(tenantId: string, id: string) {
    return db.query.routes.findFirst({
      where: withTenant(routesTable.tenantId, tenantId, eq(routesTable.id, id)),
      with: { stops: true },
    });
  },

  async create(record: Omit<NewRoute, "id">) {
    const [created] = await db.insert(routesTable).values(record).returning();
    return created;
  },

  async update(tenantId: string, id: string, patch: Partial<NewRoute>) {
    const [updated] = await db
      .update(routesTable)
      .set({ ...patch, updatedAt: new Date() })
      .where(withTenant(routesTable.tenantId, tenantId, eq(routesTable.id, id)))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const [deleted] = await db
      .delete(routesTable)
      .where(withTenant(routesTable.tenantId, tenantId, eq(routesTable.id, id)))
      .returning();
    return deleted;
  },

  /** Replaces the full stop list for a route in one transaction, in the given sequence. */
  async setStops(tenantId: string, routeId: string, shipmentIds: string[]) {
    return db.transaction(async (tx) => {
      await tx.delete(routeStops).where(withTenant(routeStops.tenantId, tenantId, eq(routeStops.routeId, routeId)));

      const rows = shipmentIds.map((shipmentId, index) => ({
        tenantId,
        routeId,
        shipmentId,
        sequence: index + 1,
      }));
      const inserted = rows.length > 0 ? await tx.insert(routeStops).values(rows).returning() : [];

      // Keep each shipment's `routeId` pointer in sync with the stop list.
      for (const shipmentId of shipmentIds) {
        await tx
          .update(shipments)
          .set({ routeId })
          .where(withTenant(shipments.tenantId, tenantId, eq(shipments.id, shipmentId)));
      }

      return inserted;
    });
  },
};
