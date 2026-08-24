import { count, eq } from "drizzle-orm";

import { db } from "../../db/client";
import { drivers } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import type { NewDriver, DriverStatus } from "../../db/schema";

export const driversRepository = {
  async list(tenantId: string, filters: { status?: DriverStatus }, offset: number, limit: number) {
    const condition = filters.status
      ? withTenant(drivers.tenantId, tenantId, eq(drivers.status, filters.status))
      : withTenant(drivers.tenantId, tenantId);

    const [items, [totalRow]] = await Promise.all([
      db.query.drivers.findMany({
        where: condition,
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
      db.select({ value: count() }).from(drivers).where(condition),
    ]);
    return { items, total: totalRow?.value ?? 0 };
  },

  findByIdInTenant(tenantId: string, id: string) {
    return db.query.drivers.findFirst({ where: withTenant(drivers.tenantId, tenantId, eq(drivers.id, id)) });
  },

  async create(record: Omit<NewDriver, "id">) {
    const [created] = await db.insert(drivers).values(record).returning();
    return created;
  },

  async update(tenantId: string, id: string, patch: Partial<NewDriver>) {
    const [updated] = await db
      .update(drivers)
      .set({ ...patch, updatedAt: new Date() })
      .where(withTenant(drivers.tenantId, tenantId, eq(drivers.id, id)))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const [deleted] = await db
      .delete(drivers)
      .where(withTenant(drivers.tenantId, tenantId, eq(drivers.id, id)))
      .returning();
    return deleted;
  },
};
