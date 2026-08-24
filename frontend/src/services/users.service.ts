/**
 * Users service — team/employee directory.
 *   GET    /users        → PaginatedResult<PublicUser>  (requires users:read)
 *   GET    /users/:id    → PublicUser
 *
 * Filters mirror the backend query schema: page, pageSize (≤100), role.
 * `users:read` is held by owner/admin/dispatcher/viewer — not driver.
 */

import { apiRequest } from "@/services/api-client";
import type { PaginatedResult, PublicUser, UserRole } from "@/types/api";

export interface ListUsersParams {
  page?: number;
  pageSize?: number;
  role?: UserRole;
}

export async function listUsers(
  params: ListUsersParams = {},
  signal?: AbortSignal,
): Promise<PaginatedResult<PublicUser>> {
  return apiRequest<PaginatedResult<PublicUser>>("/users", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      role: params.role,
    },
    signal,
  });
}

export async function getUser(id: string, signal?: AbortSignal): Promise<PublicUser> {
  return apiRequest<PublicUser>(`/users/${id}`, { signal });
}
