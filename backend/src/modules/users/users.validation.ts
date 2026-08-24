import { z } from "zod";

import { paginationQuerySchema } from "../../lib/pagination";

const roleEnum = z.enum(["owner", "admin", "dispatcher", "driver", "viewer"]);

export const inviteUserSchema = z.object({
  name: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  role: roleEnum.exclude(["owner"]), // owners are only created via registration
});
export type InviteUserInput = z.infer<typeof inviteUserSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(1),
  password: z
    .string()
    .min(10)
    .regex(/[a-z]/)
    .regex(/[A-Z]/)
    .regex(/[0-9]/)
    .regex(/[^A-Za-z0-9]/),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const updateUserRoleSchema = z.object({
  role: roleEnum,
});
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;

export const listUsersQuerySchema = paginationQuerySchema.extend({
  role: roleEnum.optional(),
});
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;

export const userIdParamSchema = z.object({ id: z.string().uuid() });
