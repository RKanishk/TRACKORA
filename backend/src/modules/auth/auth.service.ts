import { randomUUID } from "node:crypto";

import { authRepository } from "./auth.repository";
import { hashPassword, verifyPassword, generateOtp, generateSecureToken, hashToken } from "../../lib/crypto";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../../lib/jwt";
import { env } from "../../config/env";
import { logger } from "../../lib/logger";
import { logAuditEvent } from "../../services/audit-log.service";
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  BadRequestError,
  NotFoundError,
} from "../../lib/api-error";
import type {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
} from "./auth.validation";
import type { User } from "../../db/schema";

const EMAIL_VERIFICATION_TTL_MINUTES = 10;
const PASSWORD_RESET_TTL_MINUTES = 30;
const MAX_OTP_ATTEMPTS = 5;

interface RequestContext {
  ipAddress?: string;
  userAgent?: string;
}

function toPublicUser(user: User) {
  const { passwordHash: _passwordHash, ...publicUser } = user;
  return publicUser;
}

/**
 * Sends transactional auth emails. No email provider is wired up in
 * this backend — swap this for a real call (Postgres LISTEN/NOTIFY to
 * a worker, SES, Resend, etc). Logging the OTP/token here is strictly
 * a development convenience and MUST be removed before production,
 * since it writes a sensitive credential to application logs.
 */
function sendAuthEmail(to: string, subject: string, secret: string) {
  logger.info({ to, subject }, `[DEV ONLY] Auth email — secret: ${secret}`);
}

async function issueTokenPair(user: User, context: RequestContext) {
  const accessToken = signAccessToken({ sub: user.id, tenantId: user.tenantId, role: user.role });

  const refreshTokenId = randomUUID();
  const refreshToken = signRefreshToken({
    sub: user.id,
    tenantId: user.tenantId,
    jti: refreshTokenId,
  });

  const expiresAt = new Date(Date.now() + env.JWT_REFRESH_TTL_DAYS * 24 * 60 * 60 * 1000);
  await authRepository.createRefreshToken({
    userId: user.id,
    tenantId: user.tenantId,
    tokenHash: hashToken(refreshToken),
    expiresAt,
    userAgent: context.userAgent,
    ipAddress: context.ipAddress,
  });

  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput, context: RequestContext) {
    const existingTenant = await authRepository.findTenantBySlug(input.workspaceSlug);
    if (existingTenant) {
      throw new ConflictError("This workspace URL is already taken", {
        field: "workspaceSlug",
      });
    }

    const passwordHash = await hashPassword(input.password);
    const { tenant, owner } = await authRepository.createTenantWithOwner(
      { name: input.companyName, slug: input.workspaceSlug },
      { name: input.fullName, email: input.email, passwordHash },
    );

    const otp = generateOtp();
    await authRepository.createVerificationCode({
      userId: owner.id,
      purpose: "email_verification",
      codeHash: hashToken(otp),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000),
    });
    sendAuthEmail(owner.email, "Verify your Trackora email", otp);

    await logAuditEvent({
      tenantId: tenant.id,
      userId: owner.id,
      action: "tenant.created",
      entityType: "tenant",
      entityId: tenant.id,
      ipAddress: context.ipAddress,
    });

    return { userId: owner.id, tenantId: tenant.id, email: owner.email };
  },

  async verifyEmail(userId: string, code: string, context: RequestContext) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError("Account");

    const activeCode = await authRepository.findActiveCode(userId, "email_verification");
    if (!activeCode) {
      throw new BadRequestError("This code has expired. Request a new one.");
    }

    if (activeCode.attempts >= MAX_OTP_ATTEMPTS) {
      throw new BadRequestError("Too many attempts. Request a new code.");
    }

    if (activeCode.codeHash !== hashToken(code)) {
      await authRepository.incrementCodeAttempts(activeCode.id, activeCode.attempts + 1);
      throw new BadRequestError("Incorrect code");
    }

    await authRepository.consumeCode(activeCode.id);
    await authRepository.markEmailVerified(userId);

    const verifiedUser: User = { ...user, status: "active", emailVerifiedAt: new Date() };
    const tokens = await issueTokenPair(verifiedUser, context);

    await logAuditEvent({
      tenantId: user.tenantId,
      userId: user.id,
      action: "user.email_verified",
      entityType: "user",
      entityId: user.id,
      ipAddress: context.ipAddress,
    });

    return { user: toPublicUser(verifiedUser), ...tokens };
  },

  async resendVerificationCode(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) throw new NotFoundError("Account");
    if (user.emailVerifiedAt) throw new BadRequestError("This email is already verified");

    await authRepository.invalidateActiveCodesForUser(userId, "email_verification");
    const otp = generateOtp();
    await authRepository.createVerificationCode({
      userId,
      purpose: "email_verification",
      codeHash: hashToken(otp),
      expiresAt: new Date(Date.now() + EMAIL_VERIFICATION_TTL_MINUTES * 60 * 1000),
    });
    sendAuthEmail(user.email, "Your new Trackora verification code", otp);
  },

  async login(input: LoginInput, context: RequestContext) {
    const genericError = () => new UnauthorizedError("Invalid workspace, email, or password");

    const tenant = await authRepository.findTenantBySlug(input.workspaceSlug);
    if (!tenant) throw genericError();

    const user = await authRepository.findUserByTenantAndEmail(tenant.id, input.email);
    if (!user) throw genericError();

    const passwordValid = await verifyPassword(input.password, user.passwordHash);
    if (!passwordValid) throw genericError();

    if (!user.emailVerifiedAt) {
      throw new ForbiddenError("Please verify your email before logging in");
    }
    if (user.status === "suspended") {
      throw new ForbiddenError("This account has been suspended");
    }

    const tokens = await issueTokenPair(user, context);
    await authRepository.updateLastLogin(user.id);

    await logAuditEvent({
      tenantId: user.tenantId,
      userId: user.id,
      action: "user.logged_in",
      entityType: "user",
      entityId: user.id,
      ipAddress: context.ipAddress,
    });

    return { user: toPublicUser(user), ...tokens };
  },

  /**
   * Rotates the refresh token on every use. If a token that was
   * already revoked (i.e. already used once before) is presented
   * again, that's a signal of a stolen/replayed token — every
   * refresh token for the user is revoked immediately.
   */
  async refresh(rawRefreshToken: string, context: RequestContext) {
    let payload;
    try {
      payload = verifyRefreshToken(rawRefreshToken);
    } catch {
      throw new UnauthorizedError("Invalid or expired refresh token");
    }

    const tokenHash = hashToken(rawRefreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (!stored) throw new UnauthorizedError("Refresh token not recognized");

    if (stored.revokedAt) {
      await authRepository.revokeAllRefreshTokensForUser(stored.userId);
      throw new UnauthorizedError("Session revoked — please log in again");
    }

    if (stored.expiresAt < new Date()) {
      throw new UnauthorizedError("Refresh token expired");
    }

    const user = await authRepository.findUserById(payload.sub);
    if (!user || user.tenantId !== payload.tenantId) {
      throw new UnauthorizedError("Invalid refresh token");
    }

    const tokens = await issueTokenPair(user, context);
    // Find the newly-created token's id isn't returned directly here,
    // but revoking-by-hash keeps this simple and correct either way.
    await authRepository.revokeRefreshToken(stored.id);

    return { user: toPublicUser(user), ...tokens };
  },

  async logout(rawRefreshToken: string) {
    const tokenHash = hashToken(rawRefreshToken);
    const stored = await authRepository.findRefreshTokenByHash(tokenHash);
    if (stored && !stored.revokedAt) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  },

  /** Always resolves successfully regardless of whether the account exists — never leak account existence. */
  async forgotPassword(input: ForgotPasswordInput) {
    const tenant = await authRepository.findTenantBySlug(input.workspaceSlug);
    if (!tenant) return;

    const user = await authRepository.findUserByTenantAndEmail(tenant.id, input.email);
    if (!user) return;

    await authRepository.invalidateActiveCodesForUser(user.id, "password_reset");
    const rawToken = generateSecureToken();
    await authRepository.createVerificationCode({
      userId: user.id,
      purpose: "password_reset",
      codeHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + PASSWORD_RESET_TTL_MINUTES * 60 * 1000),
    });
    sendAuthEmail(user.email, "Reset your Trackora password", rawToken);
  },

  async resetPassword(rawToken: string, newPassword: string, context: RequestContext) {
    const codeHash = hashToken(rawToken);
    const activeCode = await authRepository.findActiveCodeByHash(codeHash, "password_reset");
    if (!activeCode) {
      throw new BadRequestError("This link has expired or is invalid");
    }

    await authRepository.consumeCode(activeCode.id);
    const passwordHash = await hashPassword(newPassword);
    await authRepository.updatePassword(activeCode.userId, passwordHash);

    // Force re-login on every device after a password reset.
    await authRepository.revokeAllRefreshTokensForUser(activeCode.userId);

    const user = await authRepository.findUserById(activeCode.userId);
    if (user) {
      await logAuditEvent({
        tenantId: user.tenantId,
        userId: user.id,
        action: "user.password_reset",
        entityType: "user",
        entityId: user.id,
        ipAddress: context.ipAddress,
      });
    }
  },
};
