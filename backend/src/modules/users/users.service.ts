import { usersRepository } from "./users.repository";
import { hashPassword, generateSecureToken, hashToken } from "../../lib/crypto";
import { logger } from "../../lib/logger";
import { logAuditEvent } from "../../services/audit-log.service";
import { ConflictError, NotFoundError, BadRequestError, ForbiddenError } from "../../lib/api-error";
import type { PaginationQuery } from "../../lib/pagination";
import { buildPaginatedResult, toOffsetLimit } from "../../lib/pagination";
import type { InviteUserInput, UpdateUserRoleInput, ListUsersQuery } from "./users.validation";
import type { UserRole } from "../../db/schema/enums";

const INVITE_TTL_DAYS = 7;

function sendInviteEmail(to: string, rawToken: string) {
  logger.info({ to }, `[DEV ONLY] Invite email — token: ${rawToken}`);
}

export const usersService = {
  async list(tenantId: string, query: ListUsersQuery) {
    const { offset, limit } = toOffsetLimit(query);
    const { items, total } = await usersRepository.list(tenantId, { role: query.role }, offset, limit);
    return buildPaginatedResult(
      items.map(({ passwordHash: _passwordHash, ...rest }) => rest),
      total,
      query as PaginationQuery,
    );
  },

  async getById(tenantId: string, id: string) {
    const user = await usersRepository.findByIdInTenant(tenantId, id);
    if (!user) throw new NotFoundError("User");
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  },

  async invite(tenantId: string, invitedBy: string, input: InviteUserInput) {
    const existing = await usersRepository.findByTenantAndEmail(tenantId, input.email);
    if (existing) {
      throw new ConflictError("A user with this email already exists in this workspace");
    }

    // Invited users can't log in until they accept and set a password;
    // this hash is a random, never-communicated placeholder.
    const placeholderHash = await hashPassword(generateSecureToken());
    const created = await usersRepository.create({
      tenantId,
      name: input.name,
      email: input.email,
      passwordHash: placeholderHash,
      role: input.role as UserRole,
    });
    if (!created) throw new Error("Failed to create user");

    const rawToken = generateSecureToken();
    await usersRepository.createInviteCode({
      userId: created.id,
      codeHash: hashToken(rawToken),
      expiresAt: new Date(Date.now() + INVITE_TTL_DAYS * 24 * 60 * 60 * 1000),
    });
    sendInviteEmail(created.email, rawToken);

    await logAuditEvent({
      tenantId,
      userId: invitedBy,
      action: "user.invited",
      entityType: "user",
      entityId: created.id,
      metadata: { role: input.role },
    });

    const { passwordHash: _placeholderHash, ...publicUser } = created;
    return publicUser;
  },

  async acceptInvite(rawToken: string, password: string) {
    const codeHash = hashToken(rawToken);
    const invite = await usersRepository.findActiveInviteByHash(codeHash);
    if (!invite) throw new BadRequestError("This invite link has expired or is invalid");

    await usersRepository.consumeInviteCode(invite.id);
    const passwordHash = await hashPassword(password);
    await usersRepository.activateInvitedUser(invite.userId, passwordHash);
  },

  async updateRole(
    tenantId: string,
    actingUserId: string,
    targetUserId: string,
    input: UpdateUserRoleInput,
  ) {
    const target = await usersRepository.findByIdInTenant(tenantId, targetUserId);
    if (!target) throw new NotFoundError("User");

    if (target.role === "owner" && input.role !== "owner") {
      const [ownerCountRow] = await usersRepository.countOwners(tenantId);
      if ((ownerCountRow?.value ?? 0) <= 1) {
        throw new ForbiddenError("A workspace must always have at least one owner");
      }
    }

    const updated = await usersRepository.updateRole(tenantId, targetUserId, input.role);
    await logAuditEvent({
      tenantId,
      userId: actingUserId,
      action: "user.role_changed",
      entityType: "user",
      entityId: targetUserId,
      metadata: { from: target.role, to: input.role },
    });

    const { passwordHash: _passwordHash, ...publicUser } = updated!;
    return publicUser;
  },

  async remove(tenantId: string, actingUserId: string, targetUserId: string) {
    const target = await usersRepository.findByIdInTenant(tenantId, targetUserId);
    if (!target) throw new NotFoundError("User");
    if (target.role === "owner") {
      throw new ForbiddenError("The workspace owner can't be removed");
    }

    await usersRepository.remove(tenantId, targetUserId);
    await logAuditEvent({
      tenantId,
      userId: actingUserId,
      action: "user.removed",
      entityType: "user",
      entityId: targetUserId,
    });
  },
};
