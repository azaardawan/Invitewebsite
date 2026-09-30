import 'server-only';
import { asc, eq } from 'drizzle-orm';
import { z } from 'zod';
import type { DbOrTx } from '@/server/db/client';
import { fieldDefinitions } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { FIELD_KEYS, MAX_TEXT_LENGTH, STANDARD_FIELDS, isFieldKey, type FieldKey } from '@/catalog/fields';
import { CatalogError, auditActor, i18nContent, type Actor } from './common';

const TEXT_TYPES = new Set(['text', 'longtext']);

/** Adds new code-defined fields to the database; never overwrites the owner's labels or limits. */
export async function syncFieldLibrary(db: DbOrTx) {
  for (const key of FIELD_KEYS) {
    const spec = STANDARD_FIELDS[key];
    await db
      .insert(fieldDefinitions)
      .values({ key, type: spec.type, label: spec.label, maxLength: 'maxLength' in spec ? spec.maxLength : null })
      .onConflictDoUpdate({ target: fieldDefinitions.key, set: { type: spec.type } });
  }
}

export async function listFields(db: DbOrTx) {
  const rows = await db.select().from(fieldDefinitions).orderBy(asc(fieldDefinitions.key));
  const order = new Map(FIELD_KEYS.map((k, i) => [k, i]));
  return rows.filter((r) => isFieldKey(r.key)).sort((a, b) => order.get(a.key as FieldKey)! - order.get(b.key as FieldKey)!);
}

export const updateFieldInput = z.object({
  label: i18nContent(120),
  maxLength: z.coerce.number().int().min(1).max(MAX_TEXT_LENGTH).nullish(),
});

export async function updateField(db: DbOrTx, key: string, input: z.input<typeof updateFieldInput>, actor: Actor) {
  const data = updateFieldInput.parse(input);
  return db.transaction(async (tx) => {
    const [before] = await tx.select().from(fieldDefinitions).where(eq(fieldDefinitions.key, key)).for('update');
    if (!before) throw new CatalogError('notFound');
    const maxLength = TEXT_TYPES.has(before.type) ? (data.maxLength ?? before.maxLength) : null;
    const [after] = await tx
      .update(fieldDefinitions)
      .set({ label: data.label, maxLength })
      .where(eq(fieldDefinitions.key, key))
      .returning();
    await recordAudit(tx, {
      ...auditActor(actor),
      action: 'field.updated',
      objectType: 'field_definition',
      objectId: key,
      before: { label: before.label, maxLength: before.maxLength },
      after: { label: after!.label, maxLength: after!.maxLength },
    });
    return after!;
  });
}
