import { pgTable, uuid, text, boolean, timestamp, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";

export const webhookEndpoints = pgTable(
  "webhook_endpoints",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    url: text("url").notNull(),
    /** HMAC signing secret — stored encrypted at rest, never returned by the API. */
    secret: text("secret").notNull(),
    /** e.g. ["shipment.status_changed", "route.completed"] */
    events: text("events").array().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("webhook_endpoints_tenant_id_idx").on(table.tenantId)],
);

export type WebhookEndpoint = typeof webhookEndpoints.$inferSelect;
export type NewWebhookEndpoint = typeof webhookEndpoints.$inferInsert;

export const apiKeys = pgTable(
  "api_keys",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    /** Short, non-secret prefix shown in the UI, e.g. "trk_live_8f2a". */
    keyPrefix: text("key_prefix").notNull(),
    /** SHA-256 hash of the full key — the raw key is shown once, at creation. */
    keyHash: text("key_hash").notNull(),

    lastUsedAt: timestamp("last_used_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("api_keys_tenant_id_idx").on(table.tenantId)],
);

export type ApiKey = typeof apiKeys.$inferSelect;
export type NewApiKey = typeof apiKeys.$inferInsert;
