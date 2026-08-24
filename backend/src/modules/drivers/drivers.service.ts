import { driversRepository } from "./drivers.repository";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError } from "../../lib/api-error";
import { buildPaginatedResult, toOffsetLimit, type PaginationQuery } from "../../lib/pagination";
import type { CreateDriverInput, UpdateDriverInput, ListDriversQuery } from "./drivers.validation";

export const driversService = {
  async list(tenantId: string, query: ListDriversQuery) {
    const { offset, limit } = toOffsetLimit(query);
    const { items, total } = await driversRepository.list(tenantId, { status: query.status }, offset, limit);
    return buildPaginatedResult(items, total, query as PaginationQuery);
  },

  async getById(tenantId: string, id: string) {
    const driver = await driversRepository.findByIdInTenant(tenantId, id);
    if (!driver) throw new NotFoundError("Driver");
    return driver;
  },

  async create(tenantId: string, userId: string, input: CreateDriverInput) {
    const created = await driversRepository.create({ ...input, tenantId });
    if (!created) throw new Error("Failed to create driver");
    await logAuditEvent({ tenantId, userId, action: "driver.created", entityType: "driver", entityId: created.id });
    return created;
  },

  async update(tenantId: string, userId: string, id: string, patch: UpdateDriverInput) {
    const updated = await driversRepository.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("Driver");
    await logAuditEvent({ tenantId, userId, action: "driver.updated", entityType: "driver", entityId: id });
    return updated;
  },

  async remove(tenantId: string, userId: string, id: string) {
    const deleted = await driversRepository.remove(tenantId, id);
    if (!deleted) throw new NotFoundError("Driver");
    await logAuditEvent({ tenantId, userId, action: "driver.deleted", entityType: "driver", entityId: id });
  },
};
