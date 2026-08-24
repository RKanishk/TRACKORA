import { z } from "zod";

import { paginationQuerySchema } from "../../lib/pagination";

export const createVehicleSchema = z.object({
  plateNumber: z.string().trim().min(2),
  type: z.string().trim().min(2),
  capacityKg: z.coerce.number().int().positive().optional(),
});
export type CreateVehicleInput = z.infer<typeof createVehicleSchema>;

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  status: z.enum(["active", "in_maintenance", "retired"]).optional(),
});
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>;

export const listVehiclesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["active", "in_maintenance", "retired"]).optional(),
});
export type ListVehiclesQuery = z.infer<typeof listVehiclesQuerySchema>;

export const vehicleIdParamSchema = z.object({ id: z.string().uuid() });
