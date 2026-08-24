import { and, eq, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";

/**
 * TENANT ISOLATION STRATEGY
 * -------------------------
 * Trackora uses application-enforced row isolation, not Postgres RLS:
 * every tenant-scoped table has a `tenantId` column, and every
 * repository function REQUIRES a `tenantId` argument that gets ANDed
 * into the query via this helper. There is no repository method that
 * queries a tenant-scoped table without one — that's the whole
 * defense, and it's enforced by convention + code review + the
 * TypeScript signatures below, not by a database feature.
 *
 * `withTenant` exists so that convention has one obvious shape at
 * every call site: `where: withTenant(table.tenantId, tenantId, ...otherConditions)`.
 *
 * For a true defense-in-depth setup, pair this with Postgres Row
 * Level Security policies on each tenant-scoped table (documented in
 * README.md) — the app-layer check should never be the *only* layer
 * in a system handling real customer data, but it is the one this
 * codebase directly controls and tests.
 */
export function withTenant(
  tenantColumn: PgColumn,
  tenantId: string,
  ...extra: Array<SQL | undefined>
): SQL {
  return and(eq(tenantColumn, tenantId), ...extra) as SQL;
}
