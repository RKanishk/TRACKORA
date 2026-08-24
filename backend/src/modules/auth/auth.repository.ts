import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "../../db/client";
import { tenants, users, verificationCodes, refreshTokens } from "../../db/schema";
import type { NewTenant, NewUser } from "../../db/schema";

export const authRepository = {
  findTenantBySlug(slug: string) {
    return db.query.tenants.findFirst({ where: eq(tenants.slug, slug) });
  },

  findUserByTenantAndEmail(tenantId: string, email: string) {
    return db.query.users.findFirst({
      where: and(eq(users.tenantId, tenantId), eq(users.email, email)),
    });
  },

  findUserById(userId: string) {
    return db.query.users.findFirst({ where: eq(users.id, userId) });
  },

  /** Creates the tenant and its owner user in a single transaction. */
  async createTenantWithOwner(
    tenant: Pick<NewTenant, "name" | "slug">,
    owner: Pick<NewUser, "name" | "email" | "passwordHash">,
  ) {
    return db.transaction(async (tx) => {
      const [createdTenant] = await tx.insert(tenants).values(tenant).returning();
      if (!createdTenant) throw new Error("Failed to create tenant");

      const [createdOwner] = await tx
        .insert(users)
        .values({ ...owner, tenantId: createdTenant.id, role: "owner", status: "invited" })
        .returning();
      if (!createdOwner) throw new Error("Failed to create owner user");

      return { tenant: createdTenant, owner: createdOwner };
    });
  },

  markEmailVerified(userId: string) {
    return db
      .update(users)
      .set({ emailVerifiedAt: new Date(), status: "active" })
      .where(eq(users.id, userId));
  },

  updateLastLogin(userId: string) {
    return db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, userId));
  },

  updatePassword(userId: string, passwordHash: string) {
    return db.update(users).set({ passwordHash }).where(eq(users.id, userId));
  },

  createVerificationCode(record: {
    userId: string;
    purpose: "email_verification" | "password_reset";
    codeHash: string;
    expiresAt: Date;
  }) {
    return db.insert(verificationCodes).values(record).returning();
  },

  findActiveCode(userId: string, purpose: string) {
    return db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.userId, userId),
        eq(verificationCodes.purpose, purpose),
        isNull(verificationCodes.consumedAt),
        gt(verificationCodes.expiresAt, new Date()),
      ),
      orderBy: (table, { desc }) => [desc(table.createdAt)],
    });
  },

  /** Looks up an unconsumed, unexpired reset token by its hash directly (token, not userId, is the lookup key). */
  findActiveCodeByHash(codeHash: string, purpose: string) {
    return db.query.verificationCodes.findFirst({
      where: and(
        eq(verificationCodes.codeHash, codeHash),
        eq(verificationCodes.purpose, purpose),
        isNull(verificationCodes.consumedAt),
        gt(verificationCodes.expiresAt, new Date()),
      ),
    });
  },

  incrementCodeAttempts(codeId: string, attempts: number) {
    return db.update(verificationCodes).set({ attempts }).where(eq(verificationCodes.id, codeId));
  },

  consumeCode(codeId: string) {
    return db
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(eq(verificationCodes.id, codeId));
  },

  invalidateActiveCodesForUser(userId: string, purpose: string) {
    return db
      .update(verificationCodes)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(verificationCodes.userId, userId),
          eq(verificationCodes.purpose, purpose),
          isNull(verificationCodes.consumedAt),
        ),
      );
  },

  createRefreshToken(record: {
    userId: string;
    tenantId: string;
    tokenHash: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }) {
    return db.insert(refreshTokens).values(record).returning();
  },

  findRefreshTokenByHash(tokenHash: string) {
    return db.query.refreshTokens.findFirst({
      where: eq(refreshTokens.tokenHash, tokenHash),
    });
  },

  revokeRefreshToken(id: string, replacedByTokenId?: string) {
    return db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), replacedByTokenId })
      .where(eq(refreshTokens.id, id));
  },

  revokeAllRefreshTokensForUser(userId: string) {
    return db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.userId, userId), isNull(refreshTokens.revokedAt)));
  },
};
