import { writeFileSync, mkdirSync } from 'node:fs';
import { test, type Page } from '@playwright/test';
import { generatedManifests } from '../src/theme-registry/generated';
import { STANDARD_FIELDS } from '../src/catalog/fields';
import ar from '../src/i18n/messages/ar.json' with { type: 'json' };
import en from '../src/i18n/messages/en.json' with { type: 'json' };
import { signInAsNewOwner } from './helpers';
import { issues } from './clash';

/**
 * Text-length probe (owner, 2026-11-08): for every design, finds how long each customer text can be before it breaks the
 * design (runs out of its box, is cut off, or runs into another text) on the invitation (cover and opened, 360 px phone)
 * and the printed card (front, back, shapes), in Arabic and English. Writes the longest safe length per text to
 * `test-results/text-limits/<design>.json`; the limits go into `src/catalog/text-limits.ts`.
 *
 * Not part of CI: `TEXT_LIMITS_PROBE=1 pnpm exec playwright test e2e/text-limits.spec.ts --project=desktop --trace off`
 * (optionally `TEXT_LIMITS_THEMES=key1,key2`).
 */
test.skip(!process.env.TEXT_LIMITS_PROBE, 'run on demand (TEXT_LIMITS_PROBE=1)');
test.describe.configure({ mode: 'parallel' });

const OUT = 'test-results/text-limits';
/** As `CARD_BACK_LIMITS` (src/server/orders/extras.ts, server-only). */
const CARD_BACK_LIMITS = { title: 40, message: 300 };
const LANGS = ['ar', 'en'] as const;
type Lang = (typeof LANGS)[number];

/** Realistic words: names, and ordinary sentences for long texts. */
const NAME_WORDS: Record<Lang, string[]> = {
  ar: ['عبدالرحمن', 'مصطفى', 'الحسيني', 'إبراهيم', 'عبدالله', 'البرزنجي', 'يوسف', 'الكركوكي', 'سلمان', 'الدوسكي'],
  en: ['Abdulrahman', 'Mustafa', 'Alhusseini', 'Ibrahim', 'Abdullah', 'Barzinji', 'Yousif', 'Kirkuki', 'Salman', 'Doski'],
};
const TEXT_WORDS: Record<Lang, string[]> = {
  ar: 'يسرنا أن ندعوكم لمشاركتنا فرحتنا في يوم مميز نجتمع فيه مع الأهل والأحبة ونحتفل معاً بهذه المناسبة السعيدة بكل حب وامتنان'.split(' '),
  en: 'We would be delighted to have you with us on this special day as we celebrate together with family and friends with love and gratitude'.split(' '),
};

function textOf(words: string[], length: number): string {
  let s = '';
  for (let i = 0; s.length < length; i++) s += (s ? ' ' : '') + words[i % words.length];
  return s.slice(0, length).trimEnd().padEnd(length, words[0]![0]);
}

type Surface = { theme?: string; name: string; url: (lang: Lang, probe: string) => string; invitation: boolean };
type Probe = { key: string; kind: 'field' | 'wording' | 'cardTitle' | 'cardMessage'; max: number; long: boolean };

async function render(page: Page, surface: Surface, lang: Lang, probe: string): Promise<string[]> {
  // The smallest phone for the invitation; the printed card at its own size.
  await page.setViewportSize(surface.invitation ? { width: 360, height: 780 } : { width: 1400, height: 1200 });
  const res = await page.goto(surface.url(lang, probe), { waitUntil: 'networkidle' });
  if (!res || res.status() !== 200) return [`status-${res?.status()}`];
  await page.evaluate(() => document.fonts.ready);
  const shot = async (tag: string) => {
    if (process.env.TEXT_LIMITS_SHOTS) await page.screenshot({ path: `${OUT}/shots/${surface.theme ?? ''}-${surface.name}-${lang}-${probe.length}-${tag}.png`, fullPage: true });
  };
  if (!surface.invitation) {
    await shot('print');
    return issues(page);
  }
  await shot('cover');
  const cover = (await issues(page)).map((x) => `cover/${x}`);
  const open = page.getByRole('button', { name: (lang === 'ar' ? ar : en).invitation.openInvitation });
  if (await open.count()) {
    await open.first().click();
    await page.waitForTimeout(1200);
  }
  // Everything that shows as the guest scrolls.
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 600) {
      window.scrollTo(0, y);
      await new Promise((r) => setTimeout(r, 60));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForTimeout(400);
  await shot('open');
  return [...cover, ...(await issues(page))];
}

const only = process.env.TEXT_LIMITS_THEMES?.split(',').filter(Boolean);
// The newest version of every design on sale (older versions keep the same texts).
const latest = new Map<string, (typeof generatedManifests)[number]>();
for (const m of generatedManifests) if (!m.internal && (latest.get(m.key)?.version ?? 0) < m.version) latest.set(m.key, m);
const manifests = [...latest.values()].filter((m) => !only || only.includes(m.key));

const results: Record<string, Record<string, { max: number; safe: number; broke: string[] }>> = {};

for (const m of manifests) {
  test(`text limits: ${m.key}`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'runs once');
    test.setTimeout(60 * 60_000);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await signInAsNewOwner(page);
    // A still clock: the countdown must not change between two renders.
    await page.clock.setFixedTime(new Date('2026-11-01T09:00:00Z'));
    const q = (probe: string) => `v=${m.version}&try=${encodeURIComponent(probe)}`;
    const surfaces: Surface[] = [];
    if (m.onlineInvitation !== false) surfaces.push({ name: 'invitation', invitation: true, url: (l, p) => `/admin/preview/${l}/theme/${m.key}?${q(p)}` });
    if (m.print?.card)
      for (const side of ['front', 'back'] as const) surfaces.push({ name: `card-${side}`, invitation: false, url: (l, p) => `/admin/preview/${l}/card/${m.key}?side=${side}&${q(p)}` });
    for (const s of m.print?.shapes ?? [])
      for (const side of ['front', 'back'] as const)
        surfaces.push({ name: `${s.key}-${side}`, invitation: false, url: (l, p) => `/admin/preview/${l}/card/${m.key}?shape=${s.key}&side=${side}&${q(p)}` });

    for (const s of surfaces) s.theme = m.key;
    const probes: Probe[] = [];
    for (const f of m.fields) {
      const spec = STANDARD_FIELDS[f as keyof typeof STANDARD_FIELDS] as { type: string; maxLength?: number };
      if ((spec.type === 'text' || spec.type === 'longtext') && spec.maxLength) probes.push({ key: f, kind: 'field', max: spec.maxLength, long: spec.type === 'longtext' || spec.maxLength > 80 });
    }
    for (const w of m.wording ?? []) if (w.custom !== false) probes.push({ key: w.key, kind: 'wording', max: w.maxLength, long: w.maxLength > 60 });
    if (m.print?.card) {
      probes.push({ key: 'card_title', kind: 'cardTitle', max: CARD_BACK_LIMITS.title, long: false });
      probes.push({ key: 'card_message', kind: 'cardMessage', max: CARD_BACK_LIMITS.message, long: true });
    }

    const json = (p: Probe, lang: Lang, length: number) => {
      const t = textOf((p.long ? TEXT_WORDS : NAME_WORDS)[lang], length);
      if (p.kind === 'field') return JSON.stringify({ values: { [p.key]: t } });
      if (p.kind === 'wording') return JSON.stringify({ wording: { [p.key]: t } });
      return JSON.stringify(p.kind === 'cardTitle' ? { title: t } : { message: t });
    };
    const relevant = (p: Probe) => surfaces.filter((s) => !p.kind.startsWith('card') || s.name.endsWith('back'));

    results[m.key] = {};
    const keys = process.env.TEXT_LIMITS_KEYS?.split(',').filter(Boolean);
    for (const p of probes) {
      if (keys && !keys.includes(p.key)) continue;
      const base = new Map<string, Set<string>>();
      const shortLen = Math.min(p.max, p.long ? 30 : 8);
      for (const s of relevant(p)) for (const lang of LANGS) base.set(`${s.name}/${lang}`, new Set(await render(page, s, lang, json(p, lang, shortLen))));
      /** What breaks at this length that the short text doesn't. */
      // Stops at the first problem: the printed card first (quicker), then the invitation.
      const broken = async (length: number) => {
        for (const s of [...relevant(p)].sort((a, b) => Number(a.invitation) - Number(b.invitation)))
          for (const lang of ['en', 'ar'] as const) {
            const before = base.get(`${s.name}/${lang}`)!;
            let found = (await render(page, s, lang, json(p, lang, length))).filter((x) => !before.has(x));
            // Only what shows again on a second render (nothing that moves by itself).
            if (found.length) {
              const again = new Set(await render(page, s, lang, json(p, lang, length)));
              found = found.filter((x) => again.has(x));
            }
            if (found.length && process.env.TEXT_LIMITS_EXPLAIN) {
              const texts = await page.evaluate((paths) => paths.map((p) => {
                const sel = 'body > ' + p.split('>').map((x) => { const m = /^([a-z0-9]+?)(\d+)$/.exec(x)!; return `${m[1]}:nth-of-type(${m[2]})`; }).join(' > ');
                const el = document.querySelector(sel);
                return `${p} = «${el?.textContent?.trim().slice(0, 60)}» ${el ? JSON.stringify(el.getBoundingClientRect().toJSON()) : ''}`;
              }), [...new Set(found.flatMap((x) => x.replace(/^[a-z-]+\/|^cover\//g, '').replace(/^[a-z-]+:/, '').split('|')))]);
              console.log(`EXPLAIN ${m.key} ${p.key} ${length} ${s.name}/${lang}\n  ${found.join('\n  ')}\n  ${texts.join('\n  ')}`);
            }
            if (found.length) return found.map((x) => `${s.name}/${lang}: ${x}`);
          }
        return [];
      };
      let broke = await broken(p.max);
      let safe = p.max;
      if (broke.length) {
        let lo = shortLen; // fits
        let hi = p.max; // breaks
        while (hi - lo > 1) {
          const mid = Math.floor((lo + hi) / 2);
          const b = await broken(mid);
          if (b.length) {
            hi = mid;
            broke = b;
          } else lo = mid;
        }
        safe = lo;
      }
      results[m.key]![p.key] = { max: p.max, safe, broke: safe < p.max ? broke.slice(0, 6) : [] };
      console.log(`${m.key} ${p.key}: ${safe}/${p.max}${safe < p.max ? ` (${broke[0]})` : ''}`);
      mkdirSync(OUT, { recursive: true });
      writeFileSync(`${OUT}/${m.key}.json`, JSON.stringify(results[m.key], null, 2));
    }
  });
}
