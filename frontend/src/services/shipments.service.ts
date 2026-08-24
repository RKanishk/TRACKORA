/**
 * Shipments service — the "orders" of the operations console.
 *   GET /shipments      → PaginatedResult<Shipment>  (requires shipments:read)
 *   GET /shipments/:id  → Shipment
 *
 * Filters mirror the backend query schema exactly: page, pageSize (≤100),
 * status, driverId. The list returns raw shipment rows (driverId only — no
 * embedded driver object), so the UI resolves driver names client-side from
 * the drivers list.
 */

import { apiRequest } from "@/services/api-client";
import type { PaginatedResult, Shipment, ShipmentStatus } from "@/types/api";

export interface ListShipmentsParams {
  page?: number;
  pageSize?: number;
  status?: ShipmentStatus;
  driverId?: string;
}

export async function listShipments(
  params: ListShipmentsParams = {},
  signal?: AbortSignal,
): Promise<PaginatedResult<Shipment>> {
  return apiRequest<PaginatedResult<Shipment>>("/shipments", {
    query: {
      page: params.page,
      pageSize: params.pageSize,
      status: params.status,
      driverId: params.driverId,
    },
    signal,
  });
}

export async function getShipment(id: string, signal?: AbortSignal): Promise<Shipment> {
  return apiRequest<Shipment>(`/shipments/${id}`, { signal });
}
