import { eq } from "drizzle-orm";

import { db } from "../../db/client";
import { tenants } from "../../db/schema";
import type { UpdateTenantInput, UpdatePlanInput } from "./tenants.validation";

export const tenantsRepository = {
  findBySlug(slug: string) {
    return db.query.tenants.findFirst({ where: eq(tenants.slug, slug) });
  },

  findById(id: string) {
    return db.query.tenants.findFirst({ where: eq(tenants.id, id) });
  },

  async update(id: string, patch: UpdateTenantInput) {
    const [updated] = await db
      .update(tenants)
      .set({ ...patch, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  },

  async updatePlan(id: string, patch: UpdatePlanInput) {
    const [updated] = await db
      .update(tenants)
      .set({ plan: patch.plan, billingCycle: patch.billingCycle, updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  },

  async suspend(id: string) {
    const [updated] = await db
      .update(tenants)
      .set({ status: "suspended", updatedAt: new Date() })
      .where(eq(tenants.id, id))
      .returning();
    return updated;
  },
};
