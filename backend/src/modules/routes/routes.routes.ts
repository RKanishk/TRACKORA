import { Router } from "express";

import { routesController } from "./routes.controller";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import {
  createRouteSchema,
  updateRouteSchema,
  setRouteStopsSchema,
  listRoutesQuerySchema,
  routeIdParamSchema,
} from "./routes.validation";

export const routesRouter = Router();

routesRouter.use(authenticate);

routesRouter.get(
  "/routes",
  requirePermission("routes:read"),
  validate({ query: listRoutesQuerySchema }),
  asyncHandler(routesController.list),
);
routesRouter.get(
  "/routes/:id",
  requirePermission("routes:read"),
  validate({ params: routeIdParamSchema }),
  asyncHandler(routesController.getById),
);
routesRouter.post(
  "/routes",
  requirePermission("routes:manage"),
  validate({ body: createRouteSchema }),
  asyncHandler(routesController.create),
);
routesRouter.patch(
  "/routes/:id",
  requirePermission("routes:manage"),
  validate({ params: routeIdParamSchema, body: updateRouteSchema }),
  asyncHandler(routesController.update),
);
routesRouter.put(
  "/routes/:id/stops",
  requirePermission("routes:manage"),
  validate({ params: routeIdParamSchema, body: setRouteStopsSchema }),
  asyncHandler(routesController.setStops),
);
routesRouter.delete(
  "/routes/:id",
  requirePermission("routes:manage"),
  validate({ params: routeIdParamSchema }),
  asyncHandler(routesController.remove),
);
