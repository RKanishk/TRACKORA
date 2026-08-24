import type { UserRole } from "../db/schema/enums";

/**
 * Permission-based RBAC rather than a bare role hierarchy: middleware
 * and services check "can this role do X", not "is this role >= Y".
 * That makes exceptions (e.g. drivers updating only their own
 * shipments) explicit instead of hacked around a linear ordering.
 */
export type Permission =
  | "tenant:manage"
  | "users:manage"
  | "users:read"
  | "drivers:manage"
  | "drivers:read"
  | "vehicles:manage"
  | "vehicles:read"
  | "shipments:manage"
  | "shipments:read"
  | "shipments:update_own"
  | "routes:manage"
  | "routes:read"
  | "analytics:read"
  | "webhooks:manage"
  | "api_keys:manage"
  | "audit_logs:read";

const ALL_PERMISSIONS: Permission[] = [
  "tenant:manage",
  "users:manage",
  "users:read",
  "drivers:manage",
  "drivers:read",
  "vehicles:manage",
  "vehicles:read",
  "shipments:manage",
  "shipments:read",
  "shipments:update_own",
  "routes:manage",
  "routes:read",
  "analytics:read",
  "webhooks:manage",
  "api_keys:manage",
  "audit_logs:read",
];

const READ_ONLY_PERMISSIONS: Permission[] = [
  "users:read",
  "drivers:read",
  "vehicles:read",
  "shipments:read",
  "routes:read",
  "analytics:read",
];

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  // Full access, including tenant settings and billing.
  owner: ALL_PERMISSIONS,

  // Everything except transferring/deleting the tenant itself — that
  // stays owner-only and is enforced in the tenant service, not here.
  admin: ALL_PERMISSIONS,

  // Runs day-to-day operations; no user management, billing, or API/webhook config.
  dispatcher: [
    "drivers:manage",
    "drivers:read",
    "vehicles:manage",
    "vehicles:read",
    "shipments:manage",
    "shipments:read",
    "routes:manage",
    "routes:read",
    "analytics:read",
    "users:read",
  ],

  // Can see their own assigned work and update its status; nothing else.
  driver: ["shipments:read", "shipments:update_own", "routes:read"],

  // Read-only across the board.
  viewer: READ_ONLY_PERMISSIONS,
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}
