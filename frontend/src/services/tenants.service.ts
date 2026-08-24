/**
 * Tenants service — the current workspace/company.
 *   GET   /tenants/me → Tenant
 *   PATCH /tenants/me → Tenant (requires tenant:manage)
 *
 * The backend always derives the tenant from the JWT; the client never
 * sends a tenant id. This is the frontend half of the tenant-isolation
 * guarantee — there is no client-supplied company id anywhere.
 */

import { apiRequest } from "@/services/api-client";
import type { Tenant, UpdateTenantInput } from "@/types/api";

export async function getCurrentTenant(signal?: AbortSignal): Promise<Tenant> {
  return apiRequest<Tenant>("/tenants/me", { signal });
}

/**
 * Update the current workspace. The backend enforces `tenant:manage`; the UI
 * gates the form on the same permission so we never send a request we know
 * will be rejected. The tenant id is derived server-side from the JWT.
 */
export async function updateTenant(
  patch: UpdateTenantInput,
  signal?: AbortSignal,
): Promise<Tenant> {
  return apiRequest<Tenant>("/tenants/me", { method: "PATCH", body: patch, signal });
}
