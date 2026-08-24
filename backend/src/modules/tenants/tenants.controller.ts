import type { Request, Response } from "express";

import { tenantsService } from "./tenants.service";
import type { UpdateTenantInput, UpdatePlanInput } from "./tenants.validation";

export const tenantsController = {
  async checkAvailability(req: Request, res: Response) {
    const { slug } = req.params as { slug: string };
    const result = await tenantsService.checkSlugAvailability(slug);
    res.status(200).json({ data: result });
  },

  async getCurrent(req: Request, res: Response) {
    const tenant = await tenantsService.getCurrentTenant(req.auth!.tenantId);
    res.status(200).json({ data: tenant });
  },

  async updateCurrent(req: Request, res: Response) {
    const updated = await tenantsService.updateCurrentTenant(
      req.auth!.tenantId,
      req.auth!.userId,
      req.body as UpdateTenantInput,
    );
    res.status(200).json({ data: updated });
  },

  async changePlan(req: Request, res: Response) {
    const updated = await tenantsService.changePlan(
      req.auth!.tenantId,
      req.auth!.userId,
      req.body as UpdatePlanInput,
    );
    res.status(200).json({ data: updated });
  },
};
