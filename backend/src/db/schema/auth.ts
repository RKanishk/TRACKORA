import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Refresh tokens are stored hashed (never the raw token) and rotated
 * on every use — `replacedByTokenId` links the chain so a reused
 * (already-rotated) token can be detected and the whole chain revoked,
 * the standard defense against stolen refresh tokens.
 */
export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    tokenHash: text("token_hash").notNull(),
    userAgent: text("user_agent"),
    ipAddress: text("ip_address"),

    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    replacedByTokenId: uuid("replaced_by_token_id"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("refresh_tokens_user_id_idx").on(table.userId),
    index("refresh_tokens_token_hash_idx").on(table.tokenHash),
  ],
);

export type RefreshToken = typeof refreshTokens.$inferSelect;
export type NewRefreshToken = typeof refreshTokens.$inferInsert;

/** Email verification (registration) and password-reset use the same shape. */
export const verificationCodes = pgTable(
  "verification_codes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),

    /** "email_verification" | "password_reset" */
    purpose: text("purpose").notNull(),

    /** Hashed OTP (email verification) or hashed reset token. */
    codeHash: text("code_hash").notNull(),

    attempts: integer("attempts").notNull().default(0),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("verification_codes_user_id_idx").on(table.userId),
    index("verification_codes_purpose_idx").on(table.purpose),
  ],
);

export type VerificationCode = typeof verificationCodes.$inferSelect;
export type NewVerificationCode = typeof verificationCodes.$inferInsert;
