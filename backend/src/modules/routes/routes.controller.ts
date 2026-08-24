import type { Request, Response } from "express";

import { routesService } from "./routes.service";
import type { CreateRouteInput, UpdateRouteInput, ListRoutesQuery, SetRouteStopsInput } from "./routes.validation";

export const routesController = {
  async list(req: Request, res: Response) {
    const result = await routesService.list(req.auth!.tenantId, req.query as unknown as ListRoutesQuery);
    res.status(200).json({ data: result });
  },
  async getById(req: Request, res: Response) {
    const route = await routesService.getById(req.auth!.tenantId, req.params.id as string);
    res.status(200).json({ data: route });
  },
  async create(req: Request, res: Response) {
    const created = await routesService.create(req.auth!.tenantId, req.auth!.userId, req.body as CreateRouteInput);
    res.status(201).json({ data: created });
  },
  async update(req: Request, res: Response) {
    const updated = await routesService.update(
      req.auth!.tenantId,
      req.auth!.userId,
      req.params.id as string,
      req.body as UpdateRouteInput,
    );
    res.status(200).json({ data: updated });
  },
  async setStops(req: Request, res: Response) {
    const { shipmentIds } = req.body as SetRouteStopsInput;
    const stops = await routesService.setStops(req.auth!.tenantId, req.auth!.userId, req.params.id as string, shipmentIds);
    res.status(200).json({ data: stops });
  },
  async remove(req: Request, res: Response) {
    await routesService.remove(req.auth!.tenantId, req.auth!.userId, req.params.id as string);
    res.status(204).send();
  },
};
