import { Router } from "express";

import { driversController } from "./drivers.controller";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import {
  createDriverSchema,
  updateDriverSchema,
  listDriversQuerySchema,
  driverIdParamSchema,
} from "./drivers.validation";

export const driversRouter = Router();

driversRouter.use(authenticate);

driversRouter.get(
  "/drivers",
  requirePermission("drivers:read"),
  validate({ query: listDriversQuerySchema }),
  asyncHandler(driversController.list),
);
driversRouter.get(
  "/drivers/:id",
  requirePermission("drivers:read"),
  validate({ params: driverIdParamSchema }),
  asyncHandler(driversController.getById),
);
driversRouter.post(
  "/drivers",
  requirePermission("drivers:manage"),
  validate({ body: createDriverSchema }),
  asyncHandler(driversController.create),
);
driversRouter.patch(
  "/drivers/:id",
  requirePermission("drivers:manage"),
  validate({ params: driverIdParamSchema, body: updateDriverSchema }),
  asyncHandler(driversController.update),
);
driversRouter.delete(
  "/drivers/:id",
  requirePermission("drivers:manage"),
  validate({ params: driverIdParamSchema }),
  asyncHandler(driversController.remove),
);
