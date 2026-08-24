import type { Request, Response } from "express";

import { driversService } from "./drivers.service";
import type { CreateDriverInput, UpdateDriverInput, ListDriversQuery } from "./drivers.validation";

export const driversController = {
  async list(req: Request, res: Response) {
    const result = await driversService.list(req.auth!.tenantId, req.query as unknown as ListDriversQuery);
    res.status(200).json({ data: result });
  },
  async getById(req: Request, res: Response) {
    const driver = await driversService.getById(req.auth!.tenantId, req.params.id as string);
    res.status(200).json({ data: driver });
  },
  async create(req: Request, res: Response) {
    const created = await driversService.create(req.auth!.tenantId, req.auth!.userId, req.body as CreateDriverInput);
    res.status(201).json({ data: created });
  },
  async update(req: Request, res: Response) {
    const updated = await driversService.update(
      req.auth!.tenantId,
      req.auth!.userId,
      req.params.id as string,
      req.body as UpdateDriverInput,
    );
    res.status(200).json({ data: updated });
  },
  async remove(req: Request, res: Response) {
    await driversService.remove(req.auth!.tenantId, req.auth!.userId, req.params.id as string);
    res.status(204).send();
  },
};
