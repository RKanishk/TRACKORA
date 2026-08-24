import { Router } from "express";

import { vehiclesController } from "./vehicles.controller";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import {
  createVehicleSchema,
  updateVehicleSchema,
  listVehiclesQuerySchema,
  vehicleIdParamSchema,
} from "./vehicles.validation";

export const vehiclesRouter = Router();

vehiclesRouter.use(authenticate);

vehiclesRouter.get(
  "/vehicles",
  requirePermission("vehicles:read"),
  validate({ query: listVehiclesQuerySchema }),
  asyncHandler(vehiclesController.list),
);
vehiclesRouter.get(
  "/vehicles/:id",
  requirePermission("vehicles:read"),
  validate({ params: vehicleIdParamSchema }),
  asyncHandler(vehiclesController.getById),
);
vehiclesRouter.post(
  "/vehicles",
  requirePermission("vehicles:manage"),
  validate({ body: createVehicleSchema }),
  asyncHandler(vehiclesController.create),
);
vehiclesRouter.patch(
  "/vehicles/:id",
  requirePermission("vehicles:manage"),
  validate({ params: vehicleIdParamSchema, body: updateVehicleSchema }),
  asyncHandler(vehiclesController.update),
);
vehiclesRouter.delete(
  "/vehicles/:id",
  requirePermission("vehicles:manage"),
  validate({ params: vehicleIdParamSchema }),
  asyncHandler(vehiclesController.remove),
);
