import { vehiclesRepository } from "./vehicles.repository";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError } from "../../lib/api-error";
import { buildPaginatedResult, toOffsetLimit, type PaginationQuery } from "../../lib/pagination";
import type { CreateVehicleInput, UpdateVehicleInput, ListVehiclesQuery } from "./vehicles.validation";

export const vehiclesService = {
  async list(tenantId: string, query: ListVehiclesQuery) {
    const { offset, limit } = toOffsetLimit(query);
    const { items, total } = await vehiclesRepository.list(tenantId, { status: query.status }, offset, limit);
    return buildPaginatedResult(items, total, query as PaginationQuery);
  },

  async getById(tenantId: string, id: string) {
    const vehicle = await vehiclesRepository.findByIdInTenant(tenantId, id);
    if (!vehicle) throw new NotFoundError("Vehicle");
    return vehicle;
  },

  async create(tenantId: string, userId: string, input: CreateVehicleInput) {
    const created = await vehiclesRepository.create({ ...input, tenantId });
    if (!created) throw new Error("Failed to create vehicle");
    await logAuditEvent({ tenantId, userId, action: "vehicle.created", entityType: "vehicle", entityId: created.id });
    return created;
  },

  async update(tenantId: string, userId: string, id: string, patch: UpdateVehicleInput) {
    const updated = await vehiclesRepository.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("Vehicle");
    await logAuditEvent({ tenantId, userId, action: "vehicle.updated", entityType: "vehicle", entityId: id });
    return updated;
  },

  async remove(tenantId: string, userId: string, id: string) {
    const deleted = await vehiclesRepository.remove(tenantId, id);
    if (!deleted) throw new NotFoundError("Vehicle");
    await logAuditEvent({ tenantId, userId, action: "vehicle.deleted", entityType: "vehicle", entityId: id });
  },
};
