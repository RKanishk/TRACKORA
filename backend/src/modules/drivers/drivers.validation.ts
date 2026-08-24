import { z } from "zod";

import { paginationQuerySchema } from "../../lib/pagination";

export const createDriverSchema = z.object({
  name: z.string().trim().min(2),
  phone: z.string().trim().min(5),
  licenseNumber: z.string().trim().optional(),
  assignedVehicleId: z.string().uuid().optional(),
});
export type CreateDriverInput = z.infer<typeof createDriverSchema>;

export const updateDriverSchema = createDriverSchema.partial().extend({
  status: z.enum(["active", "off_duty", "suspended"]).optional(),
});
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>;

export const listDriversQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["active", "off_duty", "suspended"]).optional(),
});
export type ListDriversQuery = z.infer<typeof listDriversQuerySchema>;

export const driverIdParamSchema = z.object({ id: z.string().uuid() });
