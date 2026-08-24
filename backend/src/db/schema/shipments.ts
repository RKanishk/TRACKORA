import { pgTable, uuid, text, timestamp, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { drivers, vehicles } from "./fleet";
import { routes } from "./routes";
import { shipmentPriorityEnum, shipmentStatusEnum } from "./enums";

export const shipments = pgTable(
  "shipments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Human-facing identifier, e.g. "TRK-48213" — unique per tenant. */
    trackingCode: text("tracking_code").notNull(),

    originAddress: text("origin_address").notNull(),
    destinationAddress: text("destination_address").notNull(),

    status: shipmentStatusEnum("status").notNull().default("queued"),
    priority: shipmentPriorityEnum("priority").notNull().default("standard"),

    driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),
    routeId: uuid("route_id").references(() => routes.id, { onDelete: "set null" }),

    windowStart: timestamp("window_start", { withTimezone: true }),
    windowEnd: timestamp("window_end", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("shipments_tenant_id_idx").on(table.tenantId),
    index("shipments_tenant_tracking_code_idx").on(table.tenantId, table.trackingCode),
    index("shipments_status_idx").on(table.status),
  ],
);

export type Shipment = typeof shipments.$inferSelect;
export type NewShipment = typeof shipments.$inferInsert;

/**
 * Valid status transitions — the service layer (not the database)
 * enforces this state machine. Kept next to the table it governs.
 */
export const SHIPMENT_STATUS_TRANSITIONS: Record<
  Shipment["status"],
  Array<Shipment["status"]>
> = {
  queued: ["in_transit", "failed"],
  in_transit: ["delivered", "delayed", "failed"],
  delayed: ["in_transit", "delivered", "failed"],
  delivered: [],
  failed: ["queued"],
};
