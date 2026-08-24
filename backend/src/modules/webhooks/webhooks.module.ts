import { z } from "zod";
import { eq } from "drizzle-orm";
import { Router, type Request, type Response } from "express";
import { randomBytes } from "node:crypto";

import { db } from "../../db/client";
import { webhookEndpoints } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { logAuditEvent } from "../../services/audit-log.service";
import { NotFoundError } from "../../lib/api-error";

export const WEBHOOK_EVENTS = [
  "shipment.created",
  "shipment.status_changed",
  "route.completed",
  "driver.status_changed",
] as const;

const createWebhookSchema = z.object({
  url: z.string().trim().url(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1),
});

const updateWebhookSchema = z.object({
  url: z.string().trim().url().optional(),
  events: z.array(z.enum(WEBHOOK_EVENTS)).min(1).optional(),
  isActive: z.boolean().optional(),
});

const webhookIdParamSchema = z.object({ id: z.string().uuid() });

const webhooksRepository = {
  listByTenant(tenantId: string) {
    return db.query.webhookEndpoints.findMany({ where: withTenant(webhookEndpoints.tenantId, tenantId) });
  },
  findByIdInTenant(tenantId: string, id: string) {
    return db.query.webhookEndpoints.findFirst({
      where: withTenant(webhookEndpoints.tenantId, tenantId, eq(webhookEndpoints.id, id)),
    });
  },
  async create(record: { tenantId: string; url: string; events: string[]; secret: string }) {
    const [created] = await db.insert(webhookEndpoints).values(record).returning();
    return created;
  },
  async update(tenantId: string, id: string, patch: Partial<typeof webhookEndpoints.$inferInsert>) {
    const [updated] = await db
      .update(webhookEndpoints)
      .set({ ...patch, updatedAt: new Date() })
      .where(withTenant(webhookEndpoints.tenantId, tenantId, eq(webhookEndpoints.id, id)))
      .returning();
    return updated;
  },
  async remove(tenantId: string, id: string) {
    const [deleted] = await db
      .delete(webhookEndpoints)
      .where(withTenant(webhookEndpoints.tenantId, tenantId, eq(webhookEndpoints.id, id)))
      .returning();
    return deleted;
  },
};

const webhooksService = {
  list: (tenantId: string) => webhooksRepository.listByTenant(tenantId),

  async create(tenantId: string, userId: string, input: z.infer<typeof createWebhookSchema>) {
    const secret = `whsec_${randomBytes(24).toString("hex")}`;
    const created = await webhooksRepository.create({ ...input, tenantId, secret });
    if (!created) throw new Error("Failed to create webhook");
    await logAuditEvent({ tenantId, userId, action: "webhook.created", entityType: "webhook", entityId: created.id });
    return created;
  },

  async update(tenantId: string, userId: string, id: string, patch: z.infer<typeof updateWebhookSchema>) {
    const updated = await webhooksRepository.update(tenantId, id, patch);
    if (!updated) throw new NotFoundError("Webhook endpoint");
    await logAuditEvent({ tenantId, userId, action: "webhook.updated", entityType: "webhook", entityId: id });
    return updated;
  },

  async remove(tenantId: string, userId: string, id: string) {
    const deleted = await webhooksRepository.remove(tenantId, id);
    if (!deleted) throw new NotFoundError("Webhook endpoint");
    await logAuditEvent({ tenantId, userId, action: "webhook.deleted", entityType: "webhook", entityId: id });
  },
};

export const webhooksRouter = Router();
webhooksRouter.use(authenticate);

webhooksRouter.get(
  "/webhooks",
  requirePermission("webhooks:manage"),
  asyncHandler(async (req: Request, res: Response) => {
    const items = await webhooksService.list(req.auth!.tenantId);
    res.status(200).json({ data: items });
  }),
);

webhooksRouter.post(
  "/webhooks",
  requirePermission("webhooks:manage"),
  validate({ body: createWebhookSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const created = await webhooksService.create(req.auth!.tenantId, req.auth!.userId, req.body);
    res.status(201).json({ data: created });
  }),
);

webhooksRouter.patch(
  "/webhooks/:id",
  requirePermission("webhooks:manage"),
  validate({ params: webhookIdParamSchema, body: updateWebhookSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const updated = await webhooksService.update(req.auth!.tenantId, req.auth!.userId, req.params.id as string, req.body);
    res.status(200).json({ data: updated });
  }),
);

webhooksRouter.delete(
  "/webhooks/:id",
  requirePermission("webhooks:manage"),
  validate({ params: webhookIdParamSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    await webhooksService.remove(req.auth!.tenantId, req.auth!.userId, req.params.id as string);
    res.status(204).send();
  }),
);
