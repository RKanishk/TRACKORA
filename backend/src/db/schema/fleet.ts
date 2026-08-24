import { pgTable, uuid, text, integer, timestamp, index } from "drizzle-orm/pg-core";

import { tenants } from "./tenants";
import { users } from "./users";
import { driverStatusEnum, vehicleStatusEnum } from "./enums";

export const vehicles = pgTable(
  "vehicles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    plateNumber: text("plate_number").notNull(),
    type: text("type").notNull(),
    capacityKg: integer("capacity_kg"),
    status: vehicleStatusEnum("status").notNull().default("active"),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("vehicles_tenant_id_idx").on(table.tenantId)],
);

export type Vehicle = typeof vehicles.$inferSelect;
export type NewVehicle = typeof vehicles.$inferInsert;

export const drivers = pgTable(
  "drivers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),

    /** Nullable: a driver record can exist before/without a login account. */
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),

    name: text("name").notNull(),
    phone: text("phone").notNull(),
    licenseNumber: text("license_number"),
    status: driverStatusEnum("status").notNull().default("active"),

    assignedVehicleId: uuid("assigned_vehicle_id").references(() => vehicles.id, {
      onDelete: "set null",
    }),

    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [index("drivers_tenant_id_idx").on(table.tenantId)],
);

export type Driver = typeof drivers.$inferSelect;
export type NewDriver = typeof drivers.$inferInsert;
