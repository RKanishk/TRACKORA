import { tenantsRepository } from "./tenants.repository";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError } from "../../lib/api-error";
import type { UpdateTenantInput, UpdatePlanInput } from "./tenants.validation";

export const tenantsService = {
  /** Used by the frontend's real-time workspace-slug availability checker. */
  async checkSlugAvailability(slug: string) {
    const existing = await tenantsRepository.findBySlug(slug);
    return { slug, available: !existing };
  },

  async getCurrentTenant(tenantId: string) {
    const tenant = await tenantsRepository.findById(tenantId);
    if (!tenant) throw new NotFoundError("Workspace");
    return tenant;
  },

  async updateCurrentTenant(
    tenantId: string,
    userId: string,
    patch: UpdateTenantInput,
  ) {
    const updated = await tenantsRepository.update(tenantId, patch);
    if (!updated) throw new NotFoundError("Workspace");

    await logAuditEvent({
      tenantId,
      userId,
      action: "tenant.updated",
      entityType: "tenant",
      entityId: tenantId,
      metadata: { fields: Object.keys(patch) },
    });

    return updated;
  },

  async changePlan(tenantId: string, userId: string, patch: UpdatePlanInput) {
    const updated = await tenantsRepository.updatePlan(tenantId, patch);
    if (!updated) throw new NotFoundError("Workspace");

    await logAuditEvent({
      tenantId,
      userId,
      action: "tenant.plan_changed",
      entityType: "tenant",
      entityId: tenantId,
      metadata: patch,
    });

    return updated;
  },
};
