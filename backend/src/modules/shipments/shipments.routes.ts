import { Router } from "express";

import { shipmentsController } from "./shipments.controller";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { ForbiddenError } from "../../lib/api-error";
import { roleHasPermission } from "../../lib/permissions";
import {
  createShipmentSchema,
  updateShipmentSchema,
  updateShipmentStatusSchema,
  listShipmentsQuerySchema,
  shipmentIdParamSchema,
} from "./shipments.validation";
import type { Request, Response, NextFunction } from "express";

export const shipmentsRouter = Router();

shipmentsRouter.use(authenticate);

/**
 * Status updates accept EITHER full manage rights OR the driver-scoped
 * "update_own" permission — the service layer enforces the "own"
 * constraint (which shipment) once we're past this "who's even allowed
 * to try" gate.
 */
function requireShipmentsManageOrUpdateOwn(req: Request, _res: Response, next: NextFunction) {
  const role = req.auth?.role;
  if (role && (roleHasPermission(role, "shipments:manage") || roleHasPermission(role, "shipments:update_own"))) {
    return next();
  }
  return next(new ForbiddenError("You don't have permission to update shipment status"));
}

shipmentsRouter.get(
  "/shipments",
  requirePermission("shipments:read"),
  validate({ query: listShipmentsQuerySchema }),
  asyncHandler(shipmentsController.list),
);
shipmentsRouter.get(
  "/shipments/:id",
  requirePermission("shipments:read"),
  validate({ params: shipmentIdParamSchema }),
  asyncHandler(shipmentsController.getById),
);
shipmentsRouter.post(
  "/shipments",
  requirePermission("shipments:manage"),
  validate({ body: createShipmentSchema }),
  asyncHandler(shipmentsController.create),
);
shipmentsRouter.patch(
  "/shipments/:id",
  requirePermission("shipments:manage"),
  validate({ params: shipmentIdParamSchema, body: updateShipmentSchema }),
  asyncHandler(shipmentsController.update),
);
shipmentsRouter.patch(
  "/shipments/:id/status",
  requireShipmentsManageOrUpdateOwn,
  validate({ params: shipmentIdParamSchema, body: updateShipmentStatusSchema }),
  asyncHandler(shipmentsController.updateStatus),
);
shipmentsRouter.delete(
  "/shipments/:id",
  requirePermission("shipments:manage"),
  validate({ params: shipmentIdParamSchema }),
  asyncHandler(shipmentsController.remove),
);
