import type { Request, Response } from "express";

import { vehiclesService } from "./vehicles.service";
import type { CreateVehicleInput, UpdateVehicleInput, ListVehiclesQuery } from "./vehicles.validation";

export const vehiclesController = {
  async list(req: Request, res: Response) {
    const result = await vehiclesService.list(req.auth!.tenantId, req.query as unknown as ListVehiclesQuery);
    res.status(200).json({ data: result });
  },
  async getById(req: Request, res: Response) {
    const vehicle = await vehiclesService.getById(req.auth!.tenantId, req.params.id as string);
    res.status(200).json({ data: vehicle });
  },
  async create(req: Request, res: Response) {
    const created = await vehiclesService.create(req.auth!.tenantId, req.auth!.userId, req.body as CreateVehicleInput);
    res.status(201).json({ data: created });
  },
  async update(req: Request, res: Response) {
    const updated = await vehiclesService.update(
      req.auth!.tenantId,
      req.auth!.userId,
      req.params.id as string,
      req.body as UpdateVehicleInput,
    );
    res.status(200).json({ data: updated });
  },
  async remove(req: Request, res: Response) {
    await vehiclesService.remove(req.auth!.tenantId, req.auth!.userId, req.params.id as string);
    res.status(204).send();
  },
};
