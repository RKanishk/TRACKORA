import type { Request, Response } from "express";

import { authService } from "./auth.service";
import { env } from "../../config/env";
import { UnauthorizedError } from "../../lib/api-error";
import type {
  RegisterInput,
  LoginInput,
  VerifyEmailInput,
  ResendCodeInput,
  ForgotPasswordInput,
  ResetPasswordInput,
} from "./auth.validation";

const REFRESH_COOKIE_NAME = "trackora_refresh_token";

function requestContext(req: Request) {
  return { ipAddress: req.ip, userAgent: req.header("user-agent") };
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(REFRESH_COOKIE_NAME, token, {
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: "/api/v1/auth",
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, { path: "/api/v1/auth" });
}

function readRefreshToken(req: Request): string {
  const fromCookie = req.cookies?.[REFRESH_COOKIE_NAME];
  const fromBody = (req.body as { refreshToken?: string } | undefined)?.refreshToken;
  const token = fromCookie ?? fromBody;
  if (!token) throw new UnauthorizedError("Missing refresh token");
  return token;
}

export const authController = {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body as RegisterInput, requestContext(req));
    res.status(201).json({ data: result });
  },

  async verifyEmail(req: Request, res: Response) {
    const { userId, code } = req.body as VerifyEmailInput;
    const result = await authService.verifyEmail(userId, code, requestContext(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ data: { user: result.user, accessToken: result.accessToken } });
  },

  async resendCode(req: Request, res: Response) {
    const { userId } = req.body as ResendCodeInput;
    await authService.resendVerificationCode(userId);
    res.status(200).json({ data: { sent: true } });
  },

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body as LoginInput, requestContext(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ data: { user: result.user, accessToken: result.accessToken } });
  },

  async refresh(req: Request, res: Response) {
    const token = readRefreshToken(req);
    const result = await authService.refresh(token, requestContext(req));
    setRefreshCookie(res, result.refreshToken);
    res.status(200).json({ data: { user: result.user, accessToken: result.accessToken } });
  },

  async logout(req: Request, res: Response) {
    const token = req.cookies?.[REFRESH_COOKIE_NAME] ?? (req.body as { refreshToken?: string })?.refreshToken;
    if (token) await authService.logout(token);
    clearRefreshCookie(res);
    res.status(204).send();
  },

  async forgotPassword(req: Request, res: Response) {
    await authService.forgotPassword(req.body as ForgotPasswordInput);
    // Always the same response, whether or not the account exists.
    res.status(200).json({ data: { sent: true } });
  },

  async resetPassword(req: Request, res: Response) {
    const { token, password } = req.body as ResetPasswordInput;
    await authService.resetPassword(token, password, requestContext(req));
    res.status(200).json({ data: { success: true } });
  },

  async me(req: Request, res: Response) {
    // `authenticate` middleware guarantees `req.auth` is set for this route.
    res.status(200).json({ data: { auth: req.auth } });
  },
};
