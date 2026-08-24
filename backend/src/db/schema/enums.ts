import { pgEnum } from "drizzle-orm/pg-core";

/**
 * Every enum used across the schema lives here so a status value only
 * has one authoritative definition, shared by tenants, users,
 * shipments, drivers, vehicles, and routes.
 */

export const planEnum = pgEnum("plan", ["starter", "growth", "enterprise"]);

export const tenantStatusEnum = pgEnum("tenant_status", [
  "active",
  "suspended",
  "pending_verification",
]);

export const userRoleEnum = pgEnum("user_role", [
  "owner",
  "admin",
  "dispatcher",
  "driver",
  "viewer",
]);

export const userStatusEnum = pgEnum("user_status", [
  "invited",
  "active",
  "suspended",
]);

export const shipmentStatusEnum = pgEnum("shipment_status", [
  "queued",
  "in_transit",
  "delivered",
  "delayed",
  "failed",
]);

export const shipmentPriorityEnum = pgEnum("shipment_priority", [
  "standard",
  "expedited",
  "same_day",
]);

export const driverStatusEnum = pgEnum("driver_status", [
  "active",
  "off_duty",
  "suspended",
]);

export const vehicleStatusEnum = pgEnum("vehicle_status", [
  "active",
  "in_maintenance",
  "retired",
]);

export const routeStatusEnum = pgEnum("route_status", [
  "planned",
  "in_progress",
  "completed",
  "cancelled",
]);

// Plain TS union types derived from each enum's values — used in
// contexts (JWT payloads, DTOs, service signatures) that shouldn't
// import the Drizzle pgEnum column builder itself.
export type Plan = (typeof planEnum.enumValues)[number];
export type TenantStatus = (typeof tenantStatusEnum.enumValues)[number];
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
export type ShipmentStatus = (typeof shipmentStatusEnum.enumValues)[number];
export type ShipmentPriority = (typeof shipmentPriorityEnum.enumValues)[number];
export type DriverStatus = (typeof driverStatusEnum.enumValues)[number];
export type VehicleStatus = (typeof vehicleStatusEnum.enumValues)[number];
export type RouteStatus = (typeof routeStatusEnum.enumValues)[number];
