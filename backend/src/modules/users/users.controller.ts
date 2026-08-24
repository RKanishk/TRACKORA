import type { Request, Response } from "express";

import { usersService } from "./users.service";
import type {
  InviteUserInput,
  UpdateUserRoleInput,
  ListUsersQuery,
  AcceptInviteInput,
} from "./users.validation";

export const usersController = {
  async list(req: Request, res: Response) {
    const result = await usersService.list(req.auth!.tenantId, req.query as unknown as ListUsersQuery);
    res.status(200).json({ data: result });
  },

  async getById(req: Request, res: Response) {
    const user = await usersService.getById(req.auth!.tenantId, req.params.id as string);
    res.status(200).json({ data: user });
  },

  async invite(req: Request, res: Response) {
    const created = await usersService.invite(req.auth!.tenantId, req.auth!.userId, req.body as InviteUserInput);
    res.status(201).json({ data: created });
  },

  async acceptInvite(req: Request, res: Response) {
    const { token, password } = req.body as AcceptInviteInput;
    await usersService.acceptInvite(token, password);
    res.status(200).json({ data: { success: true } });
  },

  async updateRole(req: Request, res: Response) {
    const updated = await usersService.updateRole(
      req.auth!.tenantId,
      req.auth!.userId,
      req.params.id as string,
      req.body as UpdateUserRoleInput,
    );
    res.status(200).json({ data: updated });
  },

  async remove(req: Request, res: Response) {
    await usersService.remove(req.auth!.tenantId, req.auth!.userId, req.params.id as string);
    res.status(204).send();
  },
};
