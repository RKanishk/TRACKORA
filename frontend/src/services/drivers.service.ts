/**
 * Drivers service.
 *   GET /drivers      → PaginatedResult<Driver>  (requires drivers:read)
 *   GET /drivers/:id  → Driver
 *
 * Filters mirror the backend query schema: page, pageSize (≤100), status.
 */

import { apiRequest } from "@/services/api-client";
import type { Driver, DriverStatus, PaginatedResult } from "@/types/api";

export interface ListDriversParams {
  page?: number;
  pageSize?: number;
  status?: DriverStatus;
}

export async function listDrivers(
  params: ListDriversParams = {},
  signal?: AbortSignal,
): Promise<PaginatedResult<Driver>> {
  return apiRequest<PaginatedResult<Driver>>("/drivers", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
    },
    signal,
  });
}

export async function getDriver(id: string, signal?: AbortSignal): Promise<Driver> {
  return apiRequest<Driver>(`/drivers/${id}`, { signal });
}
