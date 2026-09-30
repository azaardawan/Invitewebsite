/**
 * Translation status report.
 * - Fails if English and Arabic don't have exactly the same keys.
 * - Fails if a Kurdish file has keys that don't exist in Arabic.
 * - Lists customer-facing keys still awaiting owner-approved Kurdish translations
 *   (these fall back to Arabic; see docs/translations/KURDISH_REVIEW.md).
 */
import ar from '../src/i18n/messages/ar.json' with { type: 'json' };
import en from '../src/i18n/messages/en.json' with { type: 'json' };
import ckb from '../src/i18n/messages/ckb.json' with { type: 'json' };
import bdn from '../src/i18n/messages/bdn.json' with { type: 'json' };

function keys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null ? keys(v, `${prefix}${k}.`) : [`${prefix}${k}`],
  );
}

const arKeys = new Set(keys(ar));
let failed = false;

const enKeys = new Set(keys(en));
const missingEn = [...arKeys].filter((k) => !enKeys.has(k));
const extraEn = [...enKeys].filter((k) => !arKeys.has(k));
if (missingEn.length || extraEn.length) {
  failed = true;
  console.error('English/Arabic key mismatch:', { missingEn, extraEn });
}

// The admin panel is Arabic/English only, so Kurdish covers everything else.
const customerFacing = [...arKeys].filter((k) => !k.startsWith('admin.'));
for (const [name, file] of [
  ['Sorani (ckb)', ckb],
  ['Badini (bdn)', bdn],
] as const) {
  const have = new Set(keys(file));
  const unknown = [...have].filter((k) => !arKeys.has(k));
  if (unknown.length) {
    failed = true;
    console.error(`${name} has keys not in Arabic:`, unknown);
  }
  // Sorani dates use built-in calendar data; only Badini needs translated month/weekday names.
  const calendarOnly = (k: string) => /^invitation\.(months|weekdays)\.|^invitation\.(am|pm)$/.test(k);
  const pending = customerFacing.filter((k) => !have.has(k) && !(name.startsWith('Sorani') && calendarOnly(k)));
  const total = customerFacing.filter((k) => !(name.startsWith('Sorani') && calendarOnly(k))).length;
  console.log(`${name}: ${total - pending.length}/${total} approved` + (pending.length ? `; pending ${pending.length} (see docs/translations/KURDISH_REVIEW.md)` : ''));
}

if (failed) process.exit(1);
