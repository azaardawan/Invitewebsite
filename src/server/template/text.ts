import 'server-only';
import { eq } from 'drizzle-orm';
import { invitationNames } from '@/catalog/fields';
import type { DbOrTx } from '@/server/db/client';
import { invitations, themeVersions } from '@/server/db/schema';
import { recordAudit } from '@/server/audit/audit';
import { fieldDefs } from '@/server/orders/common';
import { validateFieldValues, type FieldError } from '@/server/orders/validation';
import { setPhotoText } from '@/server/photos/photos';
import { slugFromNames } from '@/lib/ids';
import { wordingDefault, type ThemeManifest } from '@/theme-sdk/manifest';

type InvitationRow = typeof invitations.$inferSelect;

export class TemplateTextError extends Error {
  constructor(public readonly code: 'unknownKey' | FieldError) {
    super(code);
  }
}

/** A key the template editor saves: a field, a wording line, or a photo's title or words. */
const KEY = /^(?:field:([a-z][a-z0-9_]*)|wording:([a-z][a-zA-Z0-9]*)|photo:(\d{1,2}):(title|caption))$/;

/**
 * One text of a template design (manifest `editor: 'template'`), typed by the customer in place: `field:<key>` (a
 * field of their package, checked like on the order form but allowed to be empty until checkout), `wording:<key>` (one
 * of the design's lines; empty brings back its default), or `photo:<n>:title|caption`. Returns what is now shown
 * (cleaned, or the line's default). TemplateTextError for a key the design does not have or a text that is refused.
 */
export async function setTemplateText(
  db: DbOrTx,
  inv: InvitationRow,
  key: string,
  value: string,
  now = new Date(),
  opts: { published?: boolean } = {},
): Promise<string> {
  const m = KEY.exec(key);
  if (!m || value.length > 2000) throw new TemplateTextError(m ? 'tooLong' : 'unknownKey');
  const [, field, line, photo, part] = m;
  // Only template designs are filled in place. Any other design changes its texts through the order form (before
  // checkout) or the counted self-edit (after publishing), never through this endpoint.
  const [version] = await db.select({ manifest: themeVersions.manifest }).from(themeVersions).where(eq(themeVersions.id, inv.themeVersionId));
  const manifest = version?.manifest as ThemeManifest | undefined;
  if (manifest?.editor !== 'template') throw new TemplateTextError('unknownKey');
  // After publishing, every change is audited in its own transaction (the key only: the customer's words stay out of the log).
  const audit = (tx: DbOrTx) =>
    opts.published
      ? recordAudit(tx, { actorType: 'CUSTOMER', actorAdminId: null, action: 'invitation.text_changed', objectType: 'invitation', objectId: inv.id, after: { key } })
      : Promise.resolve();

  if (photo !== undefined) {
    return db.transaction(async (tx) => {
      await setPhotoText(tx, inv.id, Number(photo), { [part!]: value });
      await audit(tx);
      return value.trim();
    });
  }

  return db.transaction(async (tx) => {
    const [locked] = await tx.select().from(invitations).where(eq(invitations.id, inv.id)).for('update');
    if (!locked) throw new TemplateTextError('unknownKey');
    if (field !== undefined) {
      if (!locked.fieldKeys.includes(field)) throw new TemplateTextError('unknownKey');
      // Empty is allowed while the customer is still filling the design; a published one keeps its required fields.
      const result = validateFieldValues({ [field]: value }, [field], await fieldDefs(tx, [field], locked.themeVersionId), now, { partial: !opts.published });
      if (!result.ok) throw new TemplateTextError(result.errors[field] ?? 'invalidText');
      const values = { ...locked.fieldValues };
      if (result.values[field]) values[field] = result.values[field];
      else delete values[field];
      await tx
        .update(invitations)
        .set({ fieldValues: values, ...(locked.status === 'DRAFT' ? { slug: slugFromNames(invitationNames(values)) } : {}) })
        .where(eq(invitations.id, locked.id));
      await audit(tx);
      return result.values[field] ?? '';
    }
    const def = manifest.wording?.find((w) => w.key === line);
    if (!def) throw new TemplateTextError('unknownKey');
    const text = value.normalize('NFC').replace(/[\u0000-\u001F\u007F]/g, '').replace(/\s+/g, ' ').trim();
    if (text.length > def.maxLength) throw new TemplateTextError('tooLong');
    const offered = [def.ar, ...Object.values(def.versions ?? {}), ...(def.options ?? [])];
    if (text && def.custom === false && !offered.includes(text)) throw new TemplateTextError('invalidChoice');
    const wording = { ...(locked.wording ?? {}) };
    if (text) wording[def.key] = text;
    else delete wording[def.key];
    await tx.update(invitations).set({ wording }).where(eq(invitations.id, locked.id));
    await audit(tx);
    return text || wordingDefault(def, locked.locale);
  });
}
