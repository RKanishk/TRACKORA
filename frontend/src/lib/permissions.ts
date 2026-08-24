/**
 * Frontend mirror of the backend RBAC matrix.
 *
 * This is a faithful copy of the backend `src/lib/permissions.ts`
 * ROLE_PERMISSIONS map. It exists ONLY to drive UI affordances — which
 * nav items and quick actions to show, which panels to attempt to load.
 * It is NOT a security boundary: the backend independently enforces every
 * permission on every request, and the client never sends a role or tenant
 * id of its own. If these two ever drift, the backend wins; keep this in
 * sync when backend permissions change.
 */

import type { UserRole } from "@/types/api";

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
  owner: ALL_PERMISSIONS,
  // admin shares the full matrix; the owner-only tenant transfer/delete is
  // enforced in the backend tenant service, not in this permission list.
  admin: ALL_PERMISSIONS,
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
  driver: ["shipments:read", "shipments:update_own", "routes:read"],
  viewer: READ_ONLY_PERMISSIONS,
};

export function roleHasPermission(role: UserRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role].includes(permission);
}

export function roleHasAnyPermission(role: UserRole, permissions: Permission[]): boolean {
  return permissions.some((p) => roleHasPermission(role, p));
}

/** Human-friendly label for a role, for headers and badges. */
export const ROLE_LABELS: Record<UserRole, string> = {
  owner: "Owner",
  admin: "Admin",
  dispatcher: "Dispatcher",
  driver: "Driver",
  viewer: "Viewer",
};
