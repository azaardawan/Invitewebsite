import 'server-only';
import { and, desc, eq, max } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { legalPolicyVersions, type LegalContent } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { auditActor, type Actor } from '@/server/catalog/common';

export const POLICY_TYPES = ['TERMS', 'PRIVACY', 'REFUND'] as const;
export type PolicyType = (typeof POLICY_TYPES)[number];
/** URL segment per policy: /legal/terms, /legal/privacy, /legal/refund. */
export const POLICY_SLUGS: Record<PolicyType, string> = { TERMS: 'terms', PRIVACY: 'privacy', REFUND: 'refund' };
export function policyTypeFromSlug(slug: string): PolicyType | null {
  return (Object.entries(POLICY_SLUGS).find(([, s]) => s === slug)?.[0] as PolicyType | undefined) ?? null;
}

const MAX = 30_000;
export const legalContentSchema = z.object({
  ar: z.string().trim().min(1).max(MAX),
  en: z.string().trim().min(1).max(MAX),
  ckb: z.string().trim().max(MAX).nullish(),
  bdn: z.string().trim().max(MAX).nullish(),
});

export class LegalError extends Error {
  constructor(public readonly code: 'noDraft' | 'invalid') {
    super(code);
  }
}

/** The version the website shows (latest published), or null if none was ever published. */
export async function currentPolicy(db: DbOrTx, type: PolicyType) {
  const [row] = await db
    .select()
    .from(legalPolicyVersions)
    .where(and(eq(legalPolicyVersions.type, type), eq(legalPolicyVersions.status, 'PUBLISHED')))
    .orderBy(desc(legalPolicyVersions.version))
    .limit(1);
  return row ?? null;
}

/** What a customer accepts at checkout: the current published version of each policy ('none' if unpublished). */
export async function acceptedVersions(db: DbOrTx) {
  const [terms, refund, privacy] = await Promise.all([currentPolicy(db, 'TERMS'), currentPolicy(db, 'REFUND'), currentPolicy(db, 'PRIVACY')]);
  const v = (p: Awaited<ReturnType<typeof currentPolicy>>) => (p ? `v${p.version}` : 'none');
  return { terms: v(terms), refund: v(refund), privacy: v(privacy) };
}

export async function policyAdminView(db: DbOrTx, type: PolicyType) {
  const rows = await db.select().from(legalPolicyVersions).where(eq(legalPolicyVersions.type, type)).orderBy(desc(legalPolicyVersions.version));
  return { draft: rows.find((r) => r.status === 'DRAFT') ?? null, published: rows.filter((r) => r.status === 'PUBLISHED') };
}

/** Creates or updates the single draft of a policy. Publishing is a separate step. */
export async function saveDraft(db: DbOrTx, type: PolicyType, input: LegalContent, actor: Actor) {
  const parsed = legalContentSchema.safeParse(input);
  if (!parsed.success) throw new LegalError('invalid');
  const content: LegalContent = { ar: parsed.data.ar, en: parsed.data.en, ckb: parsed.data.ckb || null, bdn: parsed.data.bdn || null };
  return db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(legalPolicyVersions)
      .where(and(eq(legalPolicyVersions.type, type), eq(legalPolicyVersions.status, 'DRAFT')))
      .for('update');
    if (draft) {
      await tx.update(legalPolicyVersions).set({ content }).where(eq(legalPolicyVersions.id, draft.id));
      await recordAudit(tx, { ...auditActor(actor), action: 'legal.draft_updated', objectType: 'legal_policy', objectId: draft.id, after: { type, version: draft.version } });
      return draft.id;
    }
    const [{ last } = { last: 0 }] = await tx.select({ last: max(legalPolicyVersions.version) }).from(legalPolicyVersions).where(eq(legalPolicyVersions.type, type));
    const [row] = await tx
      .insert(legalPolicyVersions)
      .values({ type, version: (last ?? 0) + 1, content, createdBy: actor.adminId })
      .returning({ id: legalPolicyVersions.id, version: legalPolicyVersions.version });
    await recordAudit(tx, { ...auditActor(actor), action: 'legal.draft_created', objectType: 'legal_policy', objectId: row!.id, after: { type, version: row!.version } });
    return row!.id;
  });
}

/** Publishes the draft: it becomes what the website shows and what new orders accept. It can never be edited again. */
export async function publishDraft(db: DbOrTx, type: PolicyType, actor: Actor) {
  return db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(legalPolicyVersions)
      .where(and(eq(legalPolicyVersions.type, type), eq(legalPolicyVersions.status, 'DRAFT')))
      .for('update');
    if (!draft) throw new LegalError('noDraft');
    await tx.update(legalPolicyVersions).set({ status: 'PUBLISHED', publishedAt: new Date(), publishedBy: actor.adminId }).where(eq(legalPolicyVersions.id, draft.id));
    await recordAudit(tx, { ...auditActor(actor), action: 'legal.published', objectType: 'legal_policy', objectId: draft.id, after: { type, version: draft.version } });
    return draft.version;
  });
}

/** Throws the draft away (published versions are untouched). */
export async function discardDraft(db: DbOrTx, type: PolicyType, actor: Actor) {
  await db.transaction(async (tx) => {
    const [draft] = await tx
      .select()
      .from(legalPolicyVersions)
      .where(and(eq(legalPolicyVersions.type, type), eq(legalPolicyVersions.status, 'DRAFT')))
      .for('update');
    if (!draft) return;
    await tx.delete(legalPolicyVersions).where(eq(legalPolicyVersions.id, draft.id));
    await recordAudit(tx, { ...auditActor(actor), action: 'legal.draft_discarded', objectType: 'legal_policy', objectId: draft.id, before: { type, version: draft.version } });
  });
}
