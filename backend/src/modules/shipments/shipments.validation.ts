import { z } from "zod";

import { paginationQuerySchema } from "../../lib/pagination";

const statusEnum = z.enum(["queued", "in_transit", "delivered", "delayed", "failed"]);
const priorityEnum = z.enum(["standard", "expedited", "same_day"]);

export const createShipmentSchema = z.object({
  originAddress: z.string().trim().min(3),
  destinationAddress: z.string().trim().min(3),
  priority: priorityEnum.default("standard"),
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
  routeId: z.string().uuid().optional(),
  windowStart: z.coerce.date().optional(),
  windowEnd: z.coerce.date().optional(),
});
export type CreateShipmentInput = z.infer<typeof createShipmentSchema>;

export const updateShipmentSchema = createShipmentSchema.partial();
export type UpdateShipmentInput = z.infer<typeof updateShipmentSchema>;

export const updateShipmentStatusSchema = z.object({
  status: statusEnum,
});
export type UpdateShipmentStatusInput = z.infer<typeof updateShipmentStatusSchema>;

export const listShipmentsQuerySchema = paginationQuerySchema.extend({
  status: statusEnum.optional(),
  driverId: z.string().uuid().optional(),
});
export type ListShipmentsQuery = z.infer<typeof listShipmentsQuerySchema>;

export const shipmentIdParamSchema = z.object({ id: z.string().uuid() });
