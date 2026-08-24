import { count, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { vehicles } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import type { NewVehicle, VehicleStatus } from "../../db/schema";

export const vehiclesRepository = {
  async list(tenantId: string, filters: { status?: VehicleStatus }, offset: number, limit: number) {
    const condition = filters.status
      ? withTenant(vehicles.tenantId, tenantId, eq(vehicles.status, filters.status))
      : withTenant(vehicles.tenantId, tenantId);

    const [items, [totalRow]] = await Promise.all([
      db.query.vehicles.findMany({
        where: condition,
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
      db.select({ value: count() }).from(vehicles).where(condition),
    ]);
    return { items, total: totalRow?.value ?? 0 };
  },

  findByIdInTenant(tenantId: string, id: string) {
    return db.query.vehicles.findFirst({ where: withTenant(vehicles.tenantId, tenantId, eq(vehicles.id, id)) });
  },

  async create(record: Omit<NewVehicle, "id">) {
    const [created] = await db.insert(vehicles).values(record).returning();
    return created;
  },

  async update(tenantId: string, id: string, patch: Partial<NewVehicle>) {
    const [updated] = await db
      .update(vehicles)
      .set({ ...patch, updatedAt: new Date() })
      .where(withTenant(vehicles.tenantId, tenantId, eq(vehicles.id, id)))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const [deleted] = await db
      .delete(vehicles)
      .where(withTenant(vehicles.tenantId, tenantId, eq(vehicles.id, id)))
      .returning();
    return deleted;
  },
};
