/**
 * API types for the Trackora frontend.
 *
 * These mirror the backend's Drizzle schema and HTTP contract exactly
 * (see backend `src/db/schema/*` and each module's controller). Dates
 * are serialized as ISO 8601 strings over JSON, so every timestamp is
 * typed as `string` (or `string | null`) here, not `Date`.
 *
 * The backend is the source of truth. Notable domain facts encoded here:
 *   - The "order" concept is a `Shipment` (with a human `trackingCode`).
 *   - There is no Customer entity; shipments carry origin/destination text.
 *   - There is no GPS/location or revenue/financial data anywhere.
 */

/* ---------------------------------------------------------------- Enums */

export type UserRole = "owner" | "admin" | "dispatcher" | "driver" | "viewer";
export type UserStatus = "invited" | "active" | "suspended";

export type Plan = "starter" | "growth" | "enterprise";
export type TenantStatus = "active" | "suspended" | "pending_verification";

export type ShipmentStatus = "queued" | "in_transit" | "delivered" | "delayed" | "failed";
export type ShipmentPriority = "standard" | "expedited" | "same_day";

export type DriverStatus = "active" | "off_duty" | "suspended";
export type VehicleStatus = "active" | "in_maintenance" | "retired";
export type RouteStatus = "planned" | "in_progress" | "completed" | "cancelled";

export const SHIPMENT_STATUSES: ShipmentStatus[] = [
  "queued",
  "in_transit",
  "delivered",
  "delayed",
  "failed",
];

export const DRIVER_STATUSES: DriverStatus[] = ["active", "off_duty", "suspended"];

/* ------------------------------------------------------------- Entities */

/** The authenticated user, minus `passwordHash`. Returned by login/refresh. */
export interface PublicUser {
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  phone: string | null;
  avatarUrl: string | null;
  emailVerifiedAt: string | null;
  lastLoginAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The minimal authorization context carried in the JWT (from GET /auth/me). */
export interface AuthContext {
  userId: string;
  tenantId: string;
  role: UserRole;
}

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: Plan;
  status: TenantStatus;
  billingCycle: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  website: string | null;
  industry: string | null;
  companySize: string | null;
  logoUrl: string | null;
  settings: Record<string, unknown> | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * Editable workspace fields for PATCH /tenants/me (requires `tenant:manage`).
 * Mirrors the backend `updateTenantSchema` — `slug`, `plan`, and `status`
 * are intentionally NOT editable here (plan has its own endpoint).
 */
export interface UpdateTenantInput {
  name?: string;
  website?: string;
  industry?: string;
  companySize?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  logoUrl?: string;
}

export interface Driver {
  id: string;
  tenantId: string;
  userId: string | null;
  name: string;
  phone: string;
  licenseNumber: string | null;
  status: DriverStatus;
  assignedVehicleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Vehicle {
  id: string;
  tenantId: string;
  plateNumber: string;
  type: string;
  capacityKg: number | null;
  status: VehicleStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Shipment {
  id: string;
  tenantId: string;
  trackingCode: string;
  originAddress: string;
  destinationAddress: string;
  status: ShipmentStatus;
  priority: ShipmentPriority;
  driverId: string | null;
  vehicleId: string | null;
  routeId: string | null;
  windowStart: string | null;
  windowEnd: string | null;
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Route {
  id: string;
  tenantId: string;
  name: string;
  plannedDate: string;
  status: RouteStatus;
  driverId: string | null;
  vehicleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  tenantId: string;
  userId: string | null;
  /** e.g. "shipment.status_changed", "user.invited", "driver.deleted". */
  action: string;
  entityType: string;
  entityId: string | null;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  createdAt: string;
}

/* ------------------------------------------------------------ Analytics */

/** Response of GET /analytics/overview. */
export interface AnalyticsOverview {
  activeShipments: number;
  shipmentsByStatus: Record<ShipmentStatus, number>;
  /** delivered / (delivered + delayed + failed) over the last 30 days, or null if no data. */
  onTimeRate: number | null;
  /** Average create→deliver time over the last 30 days, in seconds, or null. */
  averageDeliverySeconds: number | null;
}

/* ------------------------------------------------------- Auth requests */

export interface LoginInput {
  workspaceSlug: string;
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SessionPayload {
  user: PublicUser;
  accessToken: string;
}

/* ---------------------------------------------------- HTTP envelopes */

/** Every successful response is wrapped as `{ data: ... }`. */
export interface ApiSuccess<T> {
  data: T;
}

/** Every error response has this shape. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  requestId?: string;
}

/** Every list endpoint returns this inside `data`. */
export interface PaginatedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationQuery {
  page?: number;
  pageSize?: number;
}
