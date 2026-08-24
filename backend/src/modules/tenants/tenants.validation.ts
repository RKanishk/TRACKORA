import { z } from "zod";

export const slugParamSchema = z.object({
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(48)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
});

export const updateTenantSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  website: z.string().trim().url().optional().or(z.literal("")),
  industry: z.string().trim().optional(),
  companySize: z.string().trim().optional(),
  addressLine1: z.string().trim().optional(),
  addressLine2: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  country: z.string().trim().optional(),
  logoUrl: z.string().trim().url().optional(),
});
export type UpdateTenantInput = z.infer<typeof updateTenantSchema>;

export const updatePlanSchema = z.object({
  plan: z.enum(["starter", "growth", "enterprise"]),
  billingCycle: z.enum(["monthly", "annual"]),
});
export type UpdatePlanInput = z.infer<typeof updatePlanSchema>;
