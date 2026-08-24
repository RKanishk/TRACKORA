import { and, count, eq, gt, isNull } from "drizzle-orm";

import { db } from "../../db/client";
import { users, verificationCodes } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import type { UserRole } from "../../db/schema/enums";

export const usersRepository = {
  async list(tenantId: string, filters: { role?: UserRole }, offset: number, limit: number) {
    const condition = filters.role
      ? withTenant(users.tenantId, tenantId, eq(users.role, filters.role))
      : withTenant(users.tenantId, tenantId);

    const [items, [totalRow]] = await Promise.all([
      db.query.users.findMany({
        where: condition,
        limit,
        offset,
        orderBy: (table, { desc }) => [desc(table.createdAt)],
      }),
      db.select({ value: count() }).from(users).where(condition),
    ]);

    return { items, total: totalRow?.value ?? 0 };
  },

  findByIdInTenant(tenantId: string, id: string) {
    return db.query.users.findFirst({ where: withTenant(users.tenantId, tenantId, eq(users.id, id)) });
  },

  findByTenantAndEmail(tenantId: string, email: string) {
    return db.query.users.findFirst({
      where: withTenant(users.tenantId, tenantId, eq(users.email, email)),
    });
  },

  async create(record: {
    tenantId: string;
    name: string;
    email: string;
    passwordHash: string;
    role: UserRole;
  }) {
    const [created] = await db
      .insert(users)
      .values({ ...record, status: "invited" })
      .returning();
    return created;
  },

  async updateRole(tenantId: string, id: string, role: UserRole) {
    const [updated] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(withTenant(users.tenantId, tenantId, eq(users.id, id)))
      .returning();
    return updated;
  },

  async suspend(tenantId: string, id: string) {
    const [updated] = await db
      .update(users)
      .set({ status: "suspended", updatedAt: new Date() })
      .where(withTenant(users.tenantId, tenantId, eq(users.id, id)))
      .returning();
    return updated;
  },

  async remove(tenantId: string, id: string) {
    const [deleted] = await db
      .delete(users)
      .where(withTenant(users.tenantId, tenantId, eq(users.id, id)))
      .returning();
    return deleted;
  },

  countOwners(tenantId: string) {
    return db
      .select({ value: count() })
      .from(users)
      .where(and(eq(users.tenantId, tenantId), eq(users.role, "owner")));
  },

  createInviteCode(record: { userId: string; codeHash: string; expiresAt: Date }) {
    return db.insert(verificationCodes).values({ ...record, purpose: "invite" }).returning();
  },

  findActiveInviteByHash(codeHash: string) {
    return db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.codeHash, codeHash),
        eq(verificationCodes.purpose, "invite"),
        isNull(verificationCodes.consumedAt),
        gt(verificationCodes.expiresAt, new Date()),
      ),
    });
  },

  consumeInviteCode(id: string) {
    return db
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(eq(verificationCodes.id, id));
  },

  activateInvitedUser(id: string, passwordHash: string) {
    return db
      .update(users)
      .set({ status: "active", passwordHash, emailVerifiedAt: new Date() })
      .where(eq(users.id, id));
  },
};
