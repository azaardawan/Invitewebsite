import 'server-only';
import { randomUUID } from 'node:crypto';
import { and, eq } from 'drizzle-orm';
import type { DbOrTx } from '@/server/db/client';
import { generatedDocuments, invitations, themeVersions } from '@/server/db/schema';
import { storage } from '@/server/storage';
import { sha256 } from '@/lib/crypto';
import { kitFeatureForUnit, type KitFormat, type KitOptions, type KitUnitKey } from '@/catalog/kit';
import type { Locale } from '@/i18n/config';
import { themeContentHash } from '@/theme-registry';
import { kitCopy } from './props';
import { renderKitFile } from './render';

/** Bump when the platform's sheet/crop-mark drawing changes, so stored files are made again. */
const RENDERER_VERSION = 1;

type InvitationRow = typeof invitations.$inferSelect;

export class KitFileError extends Error {
  constructor(public readonly code: 'notIncluded' | 'invalidFormat') {
    super(code);
  }
}

const CONTENT_TYPES: Record<KitFormat, string> = { png: 'image/png', pdf: 'application/pdf' };

/** Only the options that change this unit's file (the bottle size matters only for bottle wraps). */
function relevantOptions(unit: KitUnitKey, o: KitOptions) {
  return { dateStyle: o.dateStyle, digits: o.digits, ...(unit === 'bottle' ? { bottle: o.bottle } : {}) };
}

/** Everything that shapes the file; a different value means a different file. */
export function kitSourceHash(inv: Pick<InvitationRow, 'locale' | 'fieldValues' | 'fieldKeys'>, codeRef: string, unit: KitUnitKey, format: KitFormat, options: KitOptions) {
  const fields = Object.fromEntries([...inv.fieldKeys].sort().map((k) => [k, inv.fieldValues[k] ?? null]));
  const themeKey = codeRef.split('@')[0]!;
  return sha256(
    JSON.stringify({
      r: RENDERER_VERSION,
      codeRef,
      // An activated version is frozen; this only differs while a version is still in development.
      code: themeContentHash(codeRef),
      locale: inv.locale,
      fields,
      unit,
      format,
      options: relevantOptions(unit, options),
      copy: kitCopy(inv.locale as Locale, themeKey),
    }),
  );
}

/** A download name in plain ASCII (works everywhere, including WhatsApp and older phones). */
export function kitFileName(inv: Pick<InvitationRow, 'slug' | 'publicId'>, unit: KitUnitKey, format: KitFormat, options: KitOptions) {
  const base = inv.slug || inv.publicId;
  return `${base}-${unit}${unit === 'bottle' ? `-${options.bottle}ml` : ''}.${format}`;
}

/**
 * Returns the requested file, making it on first request. The caller has
 * already checked who may download (receipt token or admin permission); this
 * checks that the package includes it.
 */
export async function getKitFile(db: DbOrTx, inv: InvitationRow, unit: KitUnitKey, format: KitFormat, options: KitOptions) {
  if (!inv.featureKeys.includes(kitFeatureForUnit(unit))) throw new KitFileError('notIncluded');
  if (unit === 'story' && format !== 'png') throw new KitFileError('invalidFormat');
  const [version] = await db.select({ codeRef: themeVersions.codeRef }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const sourceHash = kitSourceHash(inv, version!.codeRef, unit, format, options);
  const result = (body: Buffer) => ({ body, contentType: CONTENT_TYPES[format], fileName: kitFileName(inv, unit, format, options) });

  const [existing] = await db
    .select()
    .from(generatedDocuments)
    .where(and(eq(generatedDocuments.invitationId, inv.id), eq(generatedDocuments.sourceHash, sourceHash)));
  if (existing) {
    const body = await storage().get(existing.storageKey);
    if (body) return result(body);
    await db.delete(generatedDocuments).where(eq(generatedDocuments.id, existing.id));
  }

  const body = await renderKitFile({ invitationId: inv.id, unit, format, options });
  const storageKey = `documents/${randomUUID()}.${format}`;
  await storage().put(storageKey, body, CONTENT_TYPES[format]);
  const inserted = await db
    .insert(generatedDocuments)
    .values({
      invitationId: inv.id,
      themeVersionId: inv.themeVersionId,
      variant: `kit:${unit}:${format}`,
      sourceHash,
      storageKey,
      contentType: CONTENT_TYPES[format],
      bytes: body.byteLength,
    })
    .onConflictDoNothing()
    .returning({ id: generatedDocuments.id });
  // Two downloads raced: keep the first stored file, drop ours.
  if (!inserted.length) await storage().delete(storageKey);
  return result(body);
}
