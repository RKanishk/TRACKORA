import { z } from "zod";

import { paginationQuerySchema } from "../../lib/pagination";

export const createRouteSchema = z.object({
  name: z.string().trim().min(2),
  plannedDate: z.coerce.date(),
  driverId: z.string().uuid().optional(),
  vehicleId: z.string().uuid().optional(),
});
export type CreateRouteInput = z.infer<typeof createRouteSchema>;

export const updateRouteSchema = createRouteSchema.partial().extend({
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
});
export type UpdateRouteInput = z.infer<typeof updateRouteSchema>;

export const setRouteStopsSchema = z.object({
  shipmentIds: z.array(z.string().uuid()).min(1),
});
export type SetRouteStopsInput = z.infer<typeof setRouteStopsSchema>;

export const listRoutesQuerySchema = paginationQuerySchema.extend({
  status: z.enum(["planned", "in_progress", "completed", "cancelled"]).optional(),
});
export type ListRoutesQuery = z.infer<typeof listRoutesQuerySchema>;

export const routeIdParamSchema = z.object({ id: z.string().uuid() });
