import { pgTable, uuid, text, integer, timestamp, date, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { drivers, vehicles } from "./fleet";
import { routeStatusEnum } from "./enums";

export const routes = pgTable(
  "routes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    name: text("name").notNull(),
    plannedDate: date("planned_date").notNull(),
    status: routeStatusEnum("status").notNull().default("planned"),

    driverId: uuid("driver_id").references(() => drivers.id, { onDelete: "set null" }),
    vehicleId: uuid("vehicle_id").references(() => vehicles.id, { onDelete: "set null" }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("routes_tenant_id_idx").on(table.tenantId),
    index("routes_planned_date_idx").on(table.plannedDate),
  ],
);

export type Route = typeof routes.$inferSelect;
export type NewRoute = typeof routes.$inferInsert;

/**
 * A stop links a route to a shipment with an explicit sequence
 * number. `shipmentId` is declared here but the FK itself is added in
 * `shipments.ts` to avoid a circular import between the two files —
 * see the migration for the actual constraint.
 */
export const routeStops = pgTable(
  "route_stops",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    routeId: uuid("route_id")
      .notNull()
      .references(() => routes.id, { onDelete: "cascade" }),
    shipmentId: uuid("shipment_id").notNull(),

    sequence: integer("sequence").notNull(),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("route_stops_route_id_idx").on(table.routeId),
    index("route_stops_shipment_id_idx").on(table.shipmentId),
  ],
);

export type RouteStop = typeof routeStops.$inferSelect;
export type NewRouteStop = typeof routeStops.$inferInsert;
