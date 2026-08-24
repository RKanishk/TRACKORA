import { pgTable, uuid, text, timestamp, uniqueIndex, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { userRoleEnum, userStatusEnum } from "./enums";

/**
 * Email is unique per-tenant, not globally — matching the "workspace
 * login" model in the frontend (a person can be an owner at one
 * company and a viewer at another, each with the same email). Login
 * always resolves (tenantId, email) together, never email alone.
 */
export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    email: text("email").notNull(),
    passwordHash: text("password_hash").notNull(),
    role: userRoleEnum("role").notNull().default("viewer"),
    status: userStatusEnum("status").notNull().default("invited"),

    phone: text("phone"),
    avatarUrl: text("avatar_url"),

    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("users_tenant_email_unique").on(table.tenantId, table.email),
    index("users_tenant_id_idx").on(table.tenantId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

/** Never send `passwordHash` (or anything derived from it) to a client. */
export type PublicUser = Omit<User, "passwordHash">;
