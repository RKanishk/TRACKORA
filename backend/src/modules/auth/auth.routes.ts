import { Router } from "express";

import { authController } from "./auth.controller";
import { authenticate } from "../../middleware/authenticate";
import { authRateLimiter } from "../../middleware/rate-limit";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import {
  registerSchema,
  loginSchema,
  verifyEmailSchema,
  resendCodeSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  refreshSchema,
} from "./auth.validation";

export const authRouter = Router();

authRouter.use(authRateLimiter);

authRouter.post("/register", validate({ body: registerSchema }), asyncHandler(authController.register));
authRouter.post("/verify-email", validate({ body: verifyEmailSchema }), asyncHandler(authController.verifyEmail));
authRouter.post("/verify-email/resend", validate({ body: resendCodeSchema }), asyncHandler(authController.resendCode));
authRouter.post("/login", validate({ body: loginSchema }), asyncHandler(authController.login));
authRouter.post("/refresh", validate({ body: refreshSchema }), asyncHandler(authController.refresh));
authRouter.post("/logout", validate({ body: refreshSchema }), asyncHandler(authController.logout));
authRouter.post("/forgot-password", validate({ body: forgotPasswordSchema }), asyncHandler(authController.forgotPassword));
authRouter.post("/reset-password", validate({ body: resetPasswordSchema }), asyncHandler(authController.resetPassword));
authRouter.get("/me", authenticate, asyncHandler(authController.me));
