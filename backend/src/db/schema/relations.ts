import { relations } from "drizzle-orm";

import { tenants } from "./tenants";
import { users } from "./users";
import { refreshTokens, verificationCodes } from "./auth";
import { drivers, vehicles } from "./fleet";
import { routes, routeStops } from "./routes";
import { shipments } from "./shipments";
import { auditLogs } from "./audit-logs";
import { apiKeys, webhookEndpoints } from "./webhooks";

export const tenantsRelations = relations(tenants, ({ many }) => ({
  users: many(users),
  drivers: many(drivers),
  vehicles: many(vehicles),
  shipments: many(shipments),
  routes: many(routes),
  webhookEndpoints: many(webhookEndpoints),
  apiKeys: many(apiKeys),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  tenant: one(tenants, { fields: [users.tenantId], references: [tenants.id] }),
  refreshTokens: many(refreshTokens),
  verificationCodes: many(verificationCodes),
  driverProfile: one(drivers, { fields: [users.id], references: [drivers.userId] }),
}));

export const driversRelations = relations(drivers, ({ one, many }) => ({
  tenant: one(tenants, { fields: [drivers.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [drivers.userId], references: [users.id] }),
  assignedVehicle: one(vehicles, {
    fields: [drivers.assignedVehicleId],
    references: [vehicles.id],
  }),
  shipments: many(shipments),
  routes: many(routes),
}));

export const vehiclesRelations = relations(vehicles, ({ one, many }) => ({
  tenant: one(tenants, { fields: [vehicles.tenantId], references: [tenants.id] }),
  shipments: many(shipments),
  routes: many(routes),
}));

export const routesRelations = relations(routes, ({ one, many }) => ({
  tenant: one(tenants, { fields: [routes.tenantId], references: [tenants.id] }),
  driver: one(drivers, { fields: [routes.driverId], references: [drivers.id] }),
  vehicle: one(vehicles, { fields: [routes.vehicleId], references: [vehicles.id] }),
  stops: many(routeStops),
}));

export const routeStopsRelations = relations(routeStops, ({ one }) => ({
  route: one(routes, { fields: [routeStops.routeId], references: [routes.id] }),
  shipment: one(shipments, { fields: [routeStops.shipmentId], references: [shipments.id] }),
}));

export const shipmentsRelations = relations(shipments, ({ one }) => ({
  tenant: one(tenants, { fields: [shipments.tenantId], references: [tenants.id] }),
  driver: one(drivers, { fields: [shipments.driverId], references: [drivers.id] }),
  vehicle: one(vehicles, { fields: [shipments.vehicleId], references: [vehicles.id] }),
  route: one(routes, { fields: [shipments.routeId], references: [routes.id] }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  tenant: one(tenants, { fields: [auditLogs.tenantId], references: [tenants.id] }),
  user: one(users, { fields: [auditLogs.userId], references: [users.id] }),
}));

export const webhookEndpointsRelations = relations(webhookEndpoints, ({ one }) => ({
  tenant: one(tenants, { fields: [webhookEndpoints.tenantId], references: [tenants.id] }),
}));

export const apiKeysRelations = relations(apiKeys, ({ one }) => ({
  tenant: one(tenants, { fields: [apiKeys.tenantId], references: [tenants.id] }),
}));

export const refreshTokensRelations = relations(refreshTokens, ({ one }) => ({
  user: one(users, { fields: [refreshTokens.userId], references: [users.id] }),
  tenant: one(tenants, { fields: [refreshTokens.tenantId], references: [tenants.id] }),
}));

export const verificationCodesRelations = relations(verificationCodes, ({ one }) => ({
  user: one(users, { fields: [verificationCodes.userId], references: [users.id] }),
}));
