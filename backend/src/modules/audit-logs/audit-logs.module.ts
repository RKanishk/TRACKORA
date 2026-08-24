import { z } from "zod";
import { Router, type Request, type Response } from "express";
import { count, desc } from "drizzle-orm";

import { db } from "../../db/client";
import { auditLogs } from "../../db/schema";
import { withTenant } from "../../db/tenant-scope";
import { authenticate } from "../../middleware/authenticate";
import { requirePermission } from "../../middleware/authorize";
import { validate } from "../../middleware/validate";
import { asyncHandler } from "../../lib/async-handler";
import { paginationQuerySchema, buildPaginatedResult, toOffsetLimit } from "../../lib/pagination";

export const auditLogsRouter = Router();
auditLogsRouter.use(authenticate);

auditLogsRouter.get(
  "/audit-logs",
  requirePermission("audit_logs:read"),
  validate({ query: paginationQuerySchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const query = req.query as unknown as z.infer<typeof paginationQuerySchema>;
    const { offset, limit } = toOffsetLimit(query);
    const condition = withTenant(auditLogs.tenantId, req.auth!.tenantId);

    const [items, [totalRow]] = await Promise.all([
      db.query.auditLogs.findMany({
        where: condition,
        limit,
        offset,
        orderBy: () => [desc(auditLogs.createdAt)],
      }),
      db.select({ value: count() }).from(auditLogs).where(condition),
    ]);

    res.status(200).json({ data: buildPaginatedResult(items, totalRow?.value ?? 0, query) });
  }),
);
