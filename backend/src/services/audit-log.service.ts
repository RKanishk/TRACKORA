import { db } from "../db/client";
import { auditLogs } from "../db/schema";

interface LogAuditEventInput {
  tenantId: string;
  userId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  ipAddress?: string | null;
}

/**
 * Fire-and-forget by design: an audit-log write failure should never
 * fail the request it's describing. Errors are swallowed here and
 * would show up in application logs via the DB client's own error
 * events, not surfaced to the caller.
 */
export async function logAuditEvent(input: LogAuditEventInput): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      tenantId: input.tenantId,
      userId: input.userId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: input.metadata ?? {},
      ipAddress: input.ipAddress ?? null,
    });
  } catch {
    // Deliberately swallowed — see doc comment above.
  }
}
