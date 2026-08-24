import { z } from "zod";

const passwordSchema = z
  .string()
  .min(10, "Use at least 10 characters")
  .regex(/[a-z]/, "Include a lowercase letter")
  .regex(/[A-Z]/, "Include an uppercase letter")
  .regex(/[0-9]/, "Include a number")
  .regex(/[^A-Za-z0-9]/, "Include a symbol");

const workspaceSlugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3)
  .max(48)
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "Lowercase letters, numbers, and hyphens only");

export const registerSchema = z.object({
  companyName: z.string().trim().min(2).max(80),
  workspaceSlug: workspaceSlugSchema,
  fullName: z.string().trim().min(2),
  email: z.string().trim().toLowerCase().email(),
  password: passwordSchema,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  workspaceSlug: workspaceSlugSchema,
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const verifyEmailSchema = z.object({
  userId: z.string().uuid(),
  code: z.string().length(6).regex(/^\d{6}$/),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

export const resendCodeSchema = z.object({
  userId: z.string().uuid(),
});
export type ResendCodeInput = z.infer<typeof resendCodeSchema>;

export const forgotPasswordSchema = z.object({
  workspaceSlug: workspaceSlugSchema,
  email: z.string().trim().toLowerCase().email(),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1).optional(),
});
export type RefreshInput = z.infer<typeof refreshSchema>;
