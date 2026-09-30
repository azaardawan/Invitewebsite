import 'server-only';
import type { DbOrTx } from '@/server/db/client';
import { auditLogs } from '@/server/db/schema';

export type AuditEntry = {
  actorType: 'ADMIN' | 'SYSTEM' | 'WEBHOOK' | 'CUSTOMER';
  actorAdminId?: string | null;
  action: string;
  objectType: string;
  objectId?: string | null;
  before?: unknown;
  after?: unknown;
  reason?: string | null;
  ipHash?: string | null;
};

/** Never include secrets (password hashes, TOTP secrets, tokens) in before/after. */
export async function recordAudit(db: DbOrTx, entry: AuditEntry) {
  await db.insert(auditLogs).values({
    actorType: entry.actorType,
    actorAdminId: entry.actorAdminId ?? null,
    action: entry.action,
    objectType: entry.objectType,
    objectId: entry.objectId ?? null,
    before: entry.before ?? null,
    after: entry.after ?? null,
    reason: entry.reason ?? null,
    ipHash: entry.ipHash ?? null,
  });
}
