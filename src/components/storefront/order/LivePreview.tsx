'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fieldValuesFromForm } from '@/catalog/fields';

const PX_PER_MM = 96 / 25.4;
/** The invitation is drawn on a phone-sized page, scaled to the panel. */
const PHONE_W = 390;
const PHONE_H = 720;
/** Typing pauses this long before the preview is redrawn. */
const DEBOUNCE_MS = 650;

type Size = { widthMm: number; heightMm: number };
export type LivePreviewSpec = {
  themeKey: string;
  packageId: string;
  /** The occasion the customer came from (a design sold in several); the form's own choice wins when it has one. */
  occasion: string | null;
  /** The design has an online invitation (a files-only design shows its cards only). */
  invitation: boolean;
  /** The printed cards the package includes, with each side's size. */
  cards: { key: string; label: string; front: Size; back: Size }[];
  /** The sample's texts, shown where the customer hasn't written yet (used to find a field on the preview). */
  sample: Record<string, string>;
  /** The fields on the form (their inputs are named by key). */
  fieldKeys: string[];
};

type View = 'invitation' | 'front' | 'back';
type Picture = { url: string; size: { w: number; h: number } | null };
const NO_PICTURE: Picture = { url: '', size: null };

/** What the customer has written so far, as the preview's `live=` texts, and the invitation's language. */
function readForm(form: HTMLFormElement, fieldKeys: string[]) {
  const data = new FormData(form);
  const text = (k: string) => {
    const v = data.get(k);
    return typeof v === 'string' ? v : undefined;
  };
  const values: Record<string, string> = {};
  for (const [k, v] of Object.entries(fieldValuesFromForm(data))) if (fieldKeys.includes(k) && v.trim()) values[k] = v.trim();
  // The design's changeable lines: only the customer's own words differ from what the sample shows.
  const wording: Record<string, string> = {};
  for (const [k, v] of data.entries()) {
    const m = /^w\.([a-zA-Z0-9]+)$/.exec(k);
    const own = m && v === 'custom' ? text(`w.${m[1]}.text`)?.trim() : undefined;
    if (m && own) wording[m[1]!] = own;
  }
  const live = {
    values,
    wording,
    title: text('cb.title')?.trim() || undefined,
    message: text('cb.message')?.trim() || undefined,
    eventKind: text('eventKind') || undefined,
    eventName: text('eventName')?.trim() || undefined,
    palette: text('palette') || undefined,
  };
  return {
    live: JSON.stringify(live),
    lang: text('invitationLocale') ?? null,
    occasion: text('occasion') || null,
  };
}

/** A form input's field key: `f.person_1_name` → `person_1_name` (the initials' two boxes → their field). */
const fieldKey = (name: string) => name.replace(/^f\./, '').replace(/\.(first|second)$/, '');

/** The deepest visible element on the page whose text holds `needle`. */
function findText(doc: Document, needle: string): HTMLElement | null {
  const want = needle.replace(/\s+/g, ' ').trim().slice(0, 40);
  if (!want) return null;
  let best: HTMLElement | null = null;
  const walk = (el: Element) => {
    for (const child of Array.from(el.children)) {
      if (!(child.textContent ?? '').replace(/\s+/g, ' ').includes(want)) continue;
      const box = (child as HTMLElement).getBoundingClientRect?.();
      if (box && box.width > 0 && box.height > 0) best = child as HTMLElement;
      walk(child);
    }
  };
  if (doc.body) walk(doc.body);
  return best;
}

const GLOW_CSS =
  '[data-bahja-glow]{outline:3px solid #f2b84b!important;outline-offset:4px;border-radius:8px;box-shadow:0 0 22px 6px rgba(242,184,75,.6)!important;transition:outline-color .2s}';

/**
 * The live preview beside the order form (owner, 2026-11-26): the invitation and the printed card with the customer's
 * texts as they type, always in view (beside the form on a computer, pinned on top on a phone), with a bigger view
 * without leaving the page. The field being edited glows where it shows. Each change is drawn in a second frame and
 * swapped in once ready, so the preview never flashes empty; the design shows already open (PreviewRuntime).
 */
export function LivePreview({ spec, formId, initialLang }: { spec: LivePreviewSpec; formId: string; initialLang: string }) {
  const t = useTranslations('store.preview');
  const views = useMemo<View[]>(
    () => [...(spec.invitation ? (['invitation'] as const) : []), ...(spec.cards.length ? (['front', 'back'] as const) : [])],
    [spec],
  );
  const [view, setView] = useState<View>(views[0] ?? 'invitation');
  const [card, setCard] = useState(spec.cards[0]?.key ?? '');
  const [state, setState] = useState(() => ({
    live: '{}',
    lang: initialLang,
    occasion: spec.occasion,
  }));
  const [big, setBig] = useState(false);
  const [small, setSmall] = useState(false);
  const [busy, setBusy] = useState(false);
  const [wide, setWide] = useState(true);
  const [focus, setFocus] = useState<{ key: string; text: string } | null>(null);
  const [found, setFound] = useState<boolean | null>(null);

  const box = useRef<HTMLDivElement>(null);
  const [boxSize, setBoxSize] = useState({ w: 0, h: 0 });
  const frameA = useRef<HTMLIFrameElement>(null);
  const frameB = useRef<HTMLIFrameElement>(null);
  const [shown, setShown] = useState(0);
  // Each frame's picture: its address and its page size (null: the invitation, on a phone-sized page).
  const [srcs, setSrcs] = useState<[Picture, Picture]>([NO_PICTURE, NO_PICTURE]);
  const at = (i: number) => (i === 0 ? srcs[0] : srcs[1]);

  // The form: what it holds now, and which field is being edited.
  useEffect(() => {
    const form = document.getElementById(formId)?.closest('form') ?? (document.getElementById(formId)?.querySelector('form') as HTMLFormElement | null);
    if (!form) return;
    let timer: number | undefined;
    const update = () => {
      const now = readForm(form, spec.fieldKeys);
      setState((prev) => ({
        live: now.live,
        lang: now.lang ?? prev.lang,
        occasion: now.occasion ?? prev.occasion ?? spec.occasion,
      }));
    };
    const later = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(update, DEBOUNCE_MS);
    };
    const onFocus = (e: Event) => {
      const el = e.target as HTMLInputElement | HTMLTextAreaElement;
      const name = el?.name;
      if (!name || el.type === 'hidden' || el.type === 'radio' || el.type === 'checkbox') return;
      const text = el.value?.trim() || spec.sample[fieldKey(name)] || '';
      setFocus({ key: name, text });
      if (name.startsWith('cb.') && spec.cards.length) setView('back');
    };
    const onInput = (e: Event) => {
      later();
      const el = e.target as HTMLInputElement;
      if (el?.name && el === document.activeElement && el.type !== 'radio')
        setFocus({
          key: el.name,
          text: el.value?.trim() || spec.sample[fieldKey(el.name)] || '',
        });
    };
    update();
    form.addEventListener('input', onInput);
    form.addEventListener('change', later);
    form.addEventListener('focusin', onFocus);
    return () => {
      window.clearTimeout(timer);
      form.removeEventListener('input', onInput);
      form.removeEventListener('change', later);
      form.removeEventListener('focusin', onFocus);
    };
  }, [formId, spec]);

  // Computer (beside the form) or phone (pinned on top).
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const on = () => setWide(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const fit = () => setBoxSize({ w: el.clientWidth, h: el.clientHeight });
    fit();
    const watch = new ResizeObserver(fit);
    watch.observe(el);
    return () => watch.disconnect();
  }, []);

  const chosenCard = spec.cards.find((c) => c.key === card) ?? spec.cards[0];
  const picture = useMemo<Picture>(() => {
    const q = new URLSearchParams({ pkg: spec.packageId, live: state.live });
    if (state.occasion) q.set('occasion', state.occasion);
    const lang = encodeURIComponent(state.lang);
    if (view === 'invitation' || !chosenCard) return { url: `/t/${lang}/${encodeURIComponent(spec.themeKey)}?${q}`, size: null };
    q.set('card', chosenCard.key);
    q.set('side', view);
    const side = view === 'front' ? chosenCard.front : chosenCard.back;
    return { url: `/t/${lang}/${encodeURIComponent(spec.themeKey)}/card?${q}`, size: { w: side.widthMm * PX_PER_MM, h: side.heightMm * PX_PER_MM } };
  }, [spec, state, view, chosenCard]);
  const url = picture.url;

  // Glow on the field being edited, in the frame on show.
  const glow = useCallback(
    (frame: HTMLIFrameElement | null, scroll: boolean) => {
      const doc = frame?.contentDocument;
      if (!doc?.body) return null;
      if (!doc.getElementById('bahja-glow-css')) {
        const style = doc.createElement('style');
        style.id = 'bahja-glow-css';
        style.textContent = GLOW_CSS;
        doc.head.appendChild(style);
      }
      doc.querySelectorAll('[data-bahja-glow]').forEach((el) => el.removeAttribute('data-bahja-glow'));
      if (!focus?.text) return null;
      const el = findText(doc, focus.text.split('\n')[0]!);
      if (!el) return false;
      el.setAttribute('data-bahja-glow', '');
      if (scroll) el.scrollIntoView({ block: 'center', behavior: 'smooth' });
      return true;
    },
    [focus],
  );

  // A new picture: drawn in the hidden frame, swapped in once the design is ready.
  const [wanted, setWanted] = useState('');
  if (wanted !== url) {
    setWanted(url);
    if (at(shown).url !== url) {
      const next = 1 - shown;
      setBusy(true);
      setSrcs((s) => {
        const copy: [Picture, Picture] = [s[0], s[1]];
        copy[next] = picture;
        return copy;
      });
    }
  }

  const onLoad = (i: number) => {
    if (i === shown || !at(i).url) return;
    const frame = (i === 0 ? frameA : frameB).current;
    const old = (shown === 0 ? frameA : frameB).current;
    const loaded = at(i).url;
    let tries = 0;
    const ready = () => {
      // A newer picture was asked for meanwhile: that one will be swapped in instead.
      if (frame?.getAttribute('src') !== loaded) return;
      const doc = frame?.contentDocument;
      if (doc && doc.documentElement.dataset.previewReady !== '1' && tries++ < 50) {
        window.setTimeout(ready, 100);
        return;
      }
      // Keep the place the customer was looking at.
      try {
        const y = old?.contentWindow?.scrollY ?? 0;
        if (y && frame?.contentWindow) frame.contentWindow.scrollTo(0, y);
      } catch {}
      glow(frame, false);
      setShown(i);
      setBusy(false);
    };
    ready();
  };

  useEffect(() => {
    const result = glow((shown === 0 ? frameA : frameB).current, true);
    const id = window.requestAnimationFrame(() => setFound(result ?? null));
    return () => window.cancelAnimationFrame(id);
  }, [glow, shown]);

  // Each picture drawn at its real size, scaled to the panel (its own size, so the old one keeps its place while the next loads).
  const fit = (size: Picture['size']) => {
    if (!boxSize.w || !boxSize.h) return { scale: 0, w: 0, h: 0 };
    if (!size) {
      // On a phone's pinned strip the invitation fills the width; elsewhere a whole phone screen fits.
      const scale = !wide && !big ? boxSize.w / PHONE_W : Math.min(boxSize.w / PHONE_W, boxSize.h / PHONE_H);
      return { scale, w: PHONE_W, h: boxSize.h / scale };
    }
    return { scale: Math.min(boxSize.w / size.w, boxSize.h / size.h), w: size.w, h: size.h };
  };
  const ready = Boolean(boxSize.w && boxSize.h);

  // Two frames: the one on show, and the next picture being drawn behind it.
  const frameProps = (i: number) => {
    const { scale, w, h } = fit(at(i).size);
    return {
    src: at(i).url || undefined,
    title: t('title'),
    tabIndex: -1,
    'aria-hidden': i !== shown,
    className: 'absolute top-0 border-0 bg-white',
    style: {
      width: w,
      height: h,
      left: Math.max(0, (boxSize.w - w * scale) / 2),
      transform: `scale(${scale})`,
      transformOrigin: '0 0',
      opacity: i === shown ? 1 : 0,
      pointerEvents: i === shown ? ('auto' as const) : ('none' as const),
      boxShadow: at(i).size ? '0 14px 30px rgb(0 0 0 / 0.18)' : undefined,
    },
  };
  };

  const tab = (v: View) => (v === 'invitation' ? t('invitation') : v === 'front' ? t('front') : t('back'));
  const pill = (on: boolean) =>
    `inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium transition ${on ? (big || !wide ? 'border-white bg-white text-heading' : 'border-heading bg-heading text-white') : big || !wide ? 'border-white/40 text-white' : 'border-line bg-surface text-heading'}`;

  const shell = big
    ? 'fixed inset-0 z-[60] flex flex-col gap-3 bg-[rgb(20_8_12/0.86)] p-4 lg:p-8'
    : wide
      ? 'sticky top-6 flex h-[calc(100vh-3rem)] max-h-[860px] flex-col gap-3 rounded-[22px] border border-line bg-surface p-4'
      : `sticky top-0 z-30 -mx-6 flex flex-col bg-[#2b1c17] ${small ? 'h-12' : 'h-[44vh]'}`;

  return (
    <section aria-label={t('title')} className={shell} data-live-preview data-view={view} data-busy={busy ? '' : undefined}>
      <div className={`flex flex-wrap items-center gap-2 ${!wide && !big ? 'order-last flex-nowrap px-3 py-2' : ''}`}>
        {(wide || big) && views.length > 1
          ? views.map((v) => (
              <button key={v} type="button" className={pill(view === v)} aria-pressed={view === v} onClick={() => setView(v)}>
                {tab(v)}
              </button>
            ))
          : null}
        {!wide && !big ? (
          views.length > 1 ? (
            <select
              value={view}
              onChange={(e) => setView(e.target.value as View)}
              aria-label={t('title')}
              className="h-8 min-w-0 rounded-full border border-white/40 bg-transparent px-3 text-xs text-white [&>option]:text-heading"
            >
              {views.map((v) => (
                <option key={v} value={v}>
                  {tab(v)}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-xs font-medium text-white/80">{t('title')}</span>
          )
        ) : null}
        {spec.cards.length > 1 && view !== 'invitation' && (wide || big) ? (
          <select
            value={card}
            onChange={(e) => setCard(e.target.value)}
            aria-label={t('whichCard')}
            className="h-8 rounded-full border border-line bg-surface px-3 text-xs text-heading"
          >
            {spec.cards.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </select>
        ) : null}
        <span className="ms-auto flex gap-2">
          {!big && !wide ? (
            <button type="button" className={pill(false)} onClick={() => setSmall((s) => !s)} aria-expanded={!small}>
              {small ? t('show') : t('smaller')}
            </button>
          ) : null}
          <button type="button" className={pill(false)} onClick={() => setBig((b) => !b)} aria-expanded={big}>
            {big ? t('close') : t('enlarge')}
          </button>
        </span>
      </div>
      <div
        ref={box}
        className={`relative min-h-0 flex-1 overflow-hidden ${small && !big && !wide ? 'hidden' : ''} ${wide && !big ? 'rounded-[16px] bg-paper' : ''}`}
      >
        {ready ? (
          <>
            <iframe ref={frameA} {...frameProps(0)} onLoad={() => onLoad(0)} />
            <iframe ref={frameB} {...frameProps(1)} onLoad={() => onLoad(1)} />
          </>
        ) : null}
        {busy ? (
          <span className="pointer-events-none absolute end-2 top-2 rounded-full bg-[rgb(20_8_12/0.7)] px-2.5 py-1 text-[11px] text-white" aria-live="polite">
            {t('updating')}
          </span>
        ) : null}
      </div>
      {(wide || big) && focus ? (
        <p className={`text-xs ${big ? 'text-white/80' : 'text-muted'}`} role="status">
          <span aria-hidden className="me-1.5 inline-block size-2 rounded-full bg-[#f2b84b] align-middle shadow-[0_0_8px_#f2b84b]" />
          {found ? t('glowing') : found === false ? t('notHere') : t('sample')}
        </p>
      ) : wide || big ? (
        <p className={`text-xs ${big ? 'text-white/80' : 'text-muted'}`}>{t('sample')}</p>
      ) : null}
    </section>
  );
}
