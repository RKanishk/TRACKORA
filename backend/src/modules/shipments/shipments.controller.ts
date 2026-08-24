import type { Request, Response } from "express";

import { shipmentsService } from "./shipments.service";
import type {
  CreateShipmentInput,
  UpdateShipmentInput,
  UpdateShipmentStatusInput,
  ListShipmentsQuery,
} from "./shipments.validation";

export const shipmentsController = {
  async list(req: Request, res: Response) {
    const result = await shipmentsService.list(req.auth!.tenantId, req.query as unknown as ListShipmentsQuery);
    res.status(200).json({ data: result });
  },
  async getById(req: Request, res: Response) {
    const shipment = await shipmentsService.getById(req.auth!.tenantId, req.params.id as string);
    res.status(200).json({ data: shipment });
  },
  async create(req: Request, res: Response) {
    const created = await shipmentsService.create(
      req.auth!.tenantId,
      req.auth!.userId,
      req.body as CreateShipmentInput,
    );
    res.status(201).json({ data: created });
  },
  async update(req: Request, res: Response) {
    const updated = await shipmentsService.update(
      req.auth!.tenantId,
      req.auth!.userId,
      req.params.id as string,
      req.body as UpdateShipmentInput,
    );
    res.status(200).json({ data: updated });
  },
  async updateStatus(req: Request, res: Response) {
    const { status } = req.body as UpdateShipmentStatusInput;
    const updated = await shipmentsService.updateStatus(
      req.auth!.tenantId,
      { userId: req.auth!.userId, role: req.auth!.role },
      req.params.id as string,
      status,
    );
    res.status(200).json({ data: updated });
  },
  async remove(req: Request, res: Response) {
    await shipmentsService.remove(req.auth!.tenantId, req.auth!.userId, req.params.id as string);
    res.status(204).send();
  },
};
