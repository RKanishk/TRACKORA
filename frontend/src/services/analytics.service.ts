/**
 * Analytics service.
 *   GET /analytics/overview → AnalyticsOverview  (requires analytics:read)
 *
 * Backs the dashboard KPI cards. Note `onTimeRate` and
 * `averageDeliverySeconds` are null when there is no delivered-shipment
 * history yet — the UI must render an honest "—", never a fabricated value.
 */

import { apiRequest } from "@/services/api-client";
import type { AnalyticsOverview } from "@/types/api";

export async function getAnalyticsOverview(signal?: AbortSignal): Promise<AnalyticsOverview> {
  return apiRequest<AnalyticsOverview>("/analytics/overview", { signal });
}
