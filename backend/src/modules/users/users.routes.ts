import { Router } from "express";

import { usersController } from "./users.controller";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import {
  inviteUserSchema,
  acceptInviteSchema,
  updateUserRoleSchema,
  listUsersQuerySchema,
  userIdParamSchema,
} from "./users.validation";

export const usersRouter = Router();

// Public — invited users don't have a session yet.
usersRouter.post(
  "/users/accept-invite",
  validate({ body: acceptInviteSchema }),
  asyncHandler(usersController.acceptInvite),
);

usersRouter.use(authenticate);

usersRouter.get(
  "/users",
  requirePermission("users:read"),
  validate({ query: listUsersQuerySchema }),
  asyncHandler(usersController.list),
);

usersRouter.get(
  "/users/:id",
  requirePermission("users:read"),
  validate({ params: userIdParamSchema }),
  asyncHandler(usersController.getById),
);

usersRouter.post(
  "/users",
  requirePermission("users:manage"),
  validate({ body: inviteUserSchema }),
  asyncHandler(usersController.invite),
);

usersRouter.patch(
  "/users/:id/role",
  requirePermission("users:manage"),
  validate({ params: userIdParamSchema, body: updateUserRoleSchema }),
  asyncHandler(usersController.updateRole),
);

usersRouter.delete(
  "/users/:id",
  requirePermission("users:manage"),
  validate({ params: userIdParamSchema }),
  asyncHandler(usersController.remove),
);
