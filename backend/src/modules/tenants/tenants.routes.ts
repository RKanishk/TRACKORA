import { Router } from "express";

import { tenantsController } from "./tenants.controller";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { slugParamSchema, updateTenantSchema, updatePlanSchema } from "./tenants.validation";

export const tenantsRouter = Router();

// Public — used by the registration wizard's live availability check.
tenantsRouter.get(
  "/workspaces/:slug/availability",
  validate({ params: slugParamSchema }),
  asyncHandler(tenantsController.checkAvailability),
);

tenantsRouter.get("/tenants/me", authenticate, asyncHandler(tenantsController.getCurrent));

tenantsRouter.patch(
  "/tenants/me",
  authenticate,
  requirePermission("tenant:manage"),
  validate({ body: updateTenantSchema }),
  asyncHandler(tenantsController.updateCurrent),
);

tenantsRouter.patch(
  "/tenants/me/plan",
  authenticate,
  requirePermission("tenant:manage"),
  validate({ body: updatePlanSchema }),
  asyncHandler(tenantsController.changePlan),
);
