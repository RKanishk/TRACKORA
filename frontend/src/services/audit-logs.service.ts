/**
 * Audit-logs service — backs the dashboard activity feed.
 *   GET /audit-logs → PaginatedResult<AuditLog>  (requires audit_logs:read)
 *
 * Only owner/admin have `audit_logs:read`, so callers must guard on the
 * permission before rendering the feed (a 403 otherwise is expected).
 * Results are already ordered newest-first by the backend.
 */

import { apiRequest } from "@/services/api-client";
import type { AuditLog, PaginatedResult, PaginationQuery } from "@/types/api";

export async function listAuditLogs(
  params: PaginationQuery = {},
  signal?: AbortSignal,
): Promise<PaginatedResult<AuditLog>> {
  return apiRequest<PaginatedResult<AuditLog>>("/audit-logs", {
    query: { page: params.page, pageSize: params.pageSize },
    signal,
  });
}
