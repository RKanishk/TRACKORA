import { routesRepository } from "./routes.repository";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError } from "../../lib/api-error";
import { buildPaginatedResult, toOffsetLimit, type PaginationQuery } from "../../lib/pagination";
import type { CreateRouteInput, UpdateRouteInput, ListRoutesQuery } from "./routes.validation";

export const routesService = {
  async list(tenantId: string, query: ListRoutesQuery) {
    const { offset, limit } = toOffsetLimit(query);
    const { items, total } = await routesRepository.list(tenantId, { status: query.status }, offset, limit);
    return buildPaginatedResult(items, total, query as PaginationQuery);
  },

  async getById(tenantId: string, id: string) {
    const route = await routesRepository.findByIdInTenant(tenantId, id);
    if (!route) throw new NotFoundError("Route");
    return route;
  },

  async create(tenantId: string, userId: string, input: CreateRouteInput) {
    const created = await routesRepository.create({
      ...input,
      tenantId,
      plannedDate: input.plannedDate.toISOString().slice(0, 10),
    });
    if (!created) throw new Error("Failed to create route");
    await logAuditEvent({ tenantId, userId, action: "route.created", entityType: "route", entityId: created.id });
    return created;
  },

  async update(tenantId: string, userId: string, id: string, patch: UpdateRouteInput) {
    const { plannedDate, ...rest } = patch;
    const updated = await routesRepository.update(tenantId, id, {
      ...rest,
      ...(plannedDate ? { plannedDate: plannedDate.toISOString().slice(0, 10) } : {}),
    });
    if (!updated) throw new NotFoundError("Route");
    await logAuditEvent({ tenantId, userId, action: "route.updated", entityType: "route", entityId: id });
    return updated;
  },

  async setStops(tenantId: string, userId: string, routeId: string, shipmentIds: string[]) {
    const route = await routesRepository.findByIdInTenant(tenantId, routeId);
    if (!route) throw new NotFoundError("Route");

    const stops = await routesRepository.setStops(tenantId, routeId, shipmentIds);
    await logAuditEvent({
      tenantId,
      userId,
      action: "route.stops_updated",
      entityType: "route",
      entityId: routeId,
      metadata: { stopCount: stops.length },
    });
    return stops;
  },

  async remove(tenantId: string, userId: string, id: string) {
    const deleted = await routesRepository.remove(tenantId, id);
    if (!deleted) throw new NotFoundError("Route");
    await logAuditEvent({ tenantId, userId, action: "route.deleted", entityType: "route", entityId: id });
  },
};
