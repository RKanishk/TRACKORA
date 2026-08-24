import { pgTable, uuid, text, jsonb, timestamp, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { users } from "./users";

/**
 * Append-only. Never updated or deleted by application code — write
 * once via `logAuditEvent()` (see services/audit-log.service.ts),
 * read via the audit-logs module. `userId` is nullable so
 * system-initiated actions (e.g. a webhook retry) can still log.
 */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    /** e.g. "shipment.status_changed", "user.invited", "driver.deleted" */
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id"),

    metadata: jsonb("metadata").$type<Record<string, unknown>>().default({}),
    ipAddress: text("ip_address"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("audit_logs_tenant_id_idx").on(table.tenantId),
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
  ],
);

export type AuditLog = typeof auditLogs.$inferSelect;
export type NewAuditLog = typeof auditLogs.$inferInsert;
