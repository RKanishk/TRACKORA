import { shipmentsRepository } from "./shipments.repository";
import { driversRepository } from "../drivers/drivers.repository";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError, BadRequestError, ForbiddenError } from "../../lib/api-error";
import { buildPaginatedResult, toOffsetLimit, type PaginationQuery } from "../../lib/pagination";
import { SHIPMENT_STATUS_TRANSITIONS } from "../../db/schema/shipments";
import type { Shipment } from "../../db/schema";
import type {
  CreateShipmentInput,
  UpdateShipmentInput,
  ListShipmentsQuery,
} from "./shipments.validation";
import type { UserRole } from "../../db/schema/enums";

/** "TRK-" + 6 random alphanumeric characters, re-rolled on the rare collision. */
async function generateUniqueTrackingCode(tenantId: string): Promise<string> {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = `TRK-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
    const [existingRow] = await shipmentsRepository.countByTenantAndCode(tenantId, code);
    if ((existingRow?.value ?? 0) === 0) return code;
  }
  throw new Error("Failed to generate a unique tracking code after 5 attempts");
}

export const shipmentsService = {
  async list(tenantId: string, query: ListShipmentsQuery) {
    const { offset, limit } = toOffsetLimit(query);
    const { items, total } = await shipmentsRepository.list(
      tenantId,
      { status: query.status, driverId: query.driverId },
      offset,
      limit,
    );
    return buildPaginatedResult(items, total, query as PaginationQuery);
  },

  async getById(tenantId: string, id: string) {
    const shipment = await shipmentsRepository.findByIdInTenant(tenantId, id);
    if (!shipment) throw new NotFoundError("Shipment");
    return shipment;
  },

  async create(tenantId: string, userId: string, input: CreateShipmentInput) {
    const trackingCode = await generateUniqueTrackingCode(tenantId);
    const created = await shipmentsRepository.create({ ...input, tenantId, trackingCode });
    if (!created) throw new Error("Failed to create shipment");

    await logAuditEvent({
      tenantId,
      userId,
      action: "shipment.created",
      entityType: "shipment",
      entityId: created.id,
      metadata: { trackingCode },
    });
    return created;
  },

  async update(tenantId: string, userId: string, id: string, patch: UpdateShipmentInput) {
    const updated = await shipmentsRepository.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("Shipment");
    await logAuditEvent({ tenantId, userId, action: "shipment.updated", entityType: "shipment", entityId: id });
    return updated;
  },

  /**
   * The one place shipment status can change. Enforces both the state
   * machine (`SHIPMENT_STATUS_TRANSITIONS`) and, for callers with only
   * `shipments:update_own` (drivers), that the shipment is actually
   * assigned to them.
   */
  async updateStatus(
    tenantId: string,
    actor: { userId: string; role: UserRole },
    id: string,
    nextStatus: Shipment["status"],
  ) {
    const shipment = await shipmentsRepository.findByIdInTenant(tenantId, id);
    if (!shipment) throw new NotFoundError("Shipment");

    if (actor.role === "driver") {
      const driver = await driversRepository.findByIdInTenant(tenantId, shipment.driverId ?? "");
      if (!driver || driver.userId !== actor.userId) {
        throw new ForbiddenError("You can only update shipments assigned to you");
      }
    }

    const allowedNext = SHIPMENT_STATUS_TRANSITIONS[shipment.status];
    if (!allowedNext.includes(nextStatus)) {
      throw new BadRequestError(
        `Cannot transition shipment from "${shipment.status}" to "${nextStatus}"`,
        { allowedTransitions: allowedNext },
      );
    }

    const patch: Partial<Shipment> = { status: nextStatus };
    if (nextStatus === "delivered") patch.deliveredAt = new Date();

    const updated = await shipmentsRepository.update(tenantId, id, patch);
    await logAuditEvent({
      tenantId,
      userId: actor.userId,
      action: "shipment.status_changed",
      entityType: "shipment",
      entityId: id,
      metadata: { from: shipment.status, to: nextStatus },
    });

    // Webhook dispatch (shipment.status_changed) would fire from here —
    // see modules/webhooks for endpoint management; delivery itself
    // is intentionally out of scope for this backend foundation.
    return updated;
  },

  async remove(tenantId: string, userId: string, id: string) {
    const deleted = await shipmentsRepository.remove(tenantId, id);
    if (!deleted) throw new NotFoundError("Shipment");
    await logAuditEvent({ tenantId, userId, action: "shipment.deleted", entityType: "shipment", entityId: id });
  },
};
