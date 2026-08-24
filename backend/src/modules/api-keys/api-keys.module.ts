import { z } from "zod";
import { eq } from "drizzle-orm";
import { Router, type Request, type Response } from "express";

import { db } from "../../db/client";
import { apiKeys } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import { generateApiKey } from "../../lib/crypto";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError } from "../../lib/api-error";

const createApiKeySchema = z.object({ name: z.string().trim().min(2).max(60) });
const apiKeyIdParamSchema = z.object({ id: z.string().uuid() });

const apiKeysRepository = {
  listByTenant(tenantId: string) {
    // keyHash is intentionally excluded from every read path below.
    return db.query.apiKeys.findMany({
      where: withTenant(apiKeys.tenantId, tenantId),
      columns: { keyHash: false },
    });
  },
  async create(record: { tenantId: string; name: string; keyPrefix: string; keyHash: string }) {
    const [created] = await db.insert(apiKeys).values(record).returning({
      id: apiKeys.id,
      tenantId: apiKeys.tenantId,
      name: apiKeys.name,
      keyPrefix: apiKeys.keyPrefix,
      createdAt: apiKeys.createdAt,
    });
    return created;
  },
  async revoke(tenantId: string, id: string) {
    const [updated] = await db
      .update(apiKeys)
      .set({ revokedAt: new Date() })
      .where(withTenant(apiKeys.tenantId, tenantId, eq(apiKeys.id, id)))
      .returning({ id: apiKeys.id });
    return updated;
  },
};

export const apiKeysRouter = Router();
apiKeysRouter.use(authenticate);

apiKeysRouter.get(
  "/api-keys",
  requirePermission("api_keys:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const items = await apiKeysRepository.listByTenant(req.auth!.tenantId);
    res.status(200).json({ data: items });
  }),
);

apiKeysRouter.post(
  "/api-keys",
  requirePermission("api_keys:manage"),
  validate({ body: createApiKeySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { raw, prefix, hash } = generateApiKey();
    const created = await apiKeysRepository.create({
      tenantId: req.auth!.tenantId,
      name: req.body.name,
      keyPrefix: prefix,
      keyHash: hash,
    });
    if (!created) throw new Error("Failed to create API key");

    await logAuditEvent({
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      action: "api_key.created",
      entityType: "api_key",
      entityId: created.id,
    });

    // The raw key is returned exactly once — it is not recoverable after this response.
    res.status(201).json({ data: { ...created, key: raw } });
  }),
);

apiKeysRouter.delete(
  "/api-keys/:id",
  requirePermission("api_keys:manage"),
  validate({ params: apiKeyIdParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const revoked = await apiKeysRepository.revoke(req.auth!.tenantId, req.params.id as string);
    if (!revoked) throw new NotFoundError("API key");

    await logAuditEvent({
      tenantId: req.auth!.tenantId,
      userId: req.auth!.userId,
      action: "api_key.revoked",
      entityType: "api_key",
      entityId: req.params.id as string,
    });
    res.status(204).send();
  }),
);
