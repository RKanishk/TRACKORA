/**
 * Semantic status → { label, tone } mappings.
 *
 * These labels and tones are derived ONLY from the backend's real enum
 * values (see backend `db/schema/enums.ts`). No invented statuses.
 * The `tone` is a visual bucket the StatusBadge translates to colors.
 */

import type {
  DriverStatus,
  RouteStatus,
  ShipmentPriority,
  ShipmentStatus,
  VehicleStatus,
} from "@/types/api";

export type Tone = "neutral" | "info" | "active" | "success" | "warning" | "danger";

interface StatusMeta {
  label: string;
  tone: Tone;
}

export const SHIPMENT_STATUS_META: Record<ShipmentStatus, StatusMeta> = {
  queued: { label: "Queued", tone: "neutral" },
  in_transit: { label: "In transit", tone: "active" },
  delivered: { label: "Delivered", tone: "success" },
  delayed: { label: "Delayed", tone: "warning" },
  failed: { label: "Failed", tone: "danger" },
};

export const SHIPMENT_PRIORITY_META: Record<ShipmentPriority, StatusMeta> = {
  standard: { label: "Standard", tone: "neutral" },
  expedited: { label: "Expedited", tone: "info" },
  same_day: { label: "Same day", tone: "warning" },
};

export const DRIVER_STATUS_META: Record<DriverStatus, StatusMeta> = {
  active: { label: "Active", tone: "success" },
  off_duty: { label: "Off duty", tone: "neutral" },
  suspended: { label: "Suspended", tone: "danger" },
};

export const VEHICLE_STATUS_META: Record<VehicleStatus, StatusMeta> = {
  active: { label: "Active", tone: "success" },
  in_maintenance: { label: "In maintenance", tone: "warning" },
  retired: { label: "Retired", tone: "neutral" },
};

export const ROUTE_STATUS_META: Record<RouteStatus, StatusMeta> = {
  planned: { label: "Planned", tone: "neutral" },
  in_progress: { label: "In progress", tone: "active" },
  completed: { label: "Completed", tone: "success" },
  cancelled: { label: "Cancelled", tone: "danger" },
};
