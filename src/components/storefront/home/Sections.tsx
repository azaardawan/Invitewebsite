import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import type { I18nText as I18nContent } from '@/catalog/fields';
import { OccasionArt, occasionTone } from '../art/OccasionArt';

function Ornament({ className = '' }: { className?: string }) {
  return (
    <svg aria-hidden width="80" height="16" viewBox="0 0 60 14" fill="none" stroke="#a8834f" strokeWidth="1" className={className}>
      <path d="M30 1l1.8 4.3 4.6.5-3.5 3.1 1 4.5-3.9-2.4-3.9 2.4 1-4.5-3.5-3.1 4.6-.5z" />
      <path d="M2 8h18M40 8h18" />
    </svg>
  );
}

export function SectionTitle({ title, subtitle, id }: { title: string; subtitle?: string; id?: string }) {
  return (
    <div data-reveal className="flex flex-col items-center gap-3 px-6 text-center">
      <Ornament />
      <h2 id={id} className="font-display text-[36px] font-bold text-heading lg:text-[54px]">
        {title}
      </h2>
      {subtitle ? <p className="max-w-xl text-[15px] leading-relaxed text-muted lg:text-lg">{subtitle}</p> : null}
    </div>
  );
}

export async function Occasions({ sections }: { sections: { key: string; name: I18nContent; imageUrl: string | null }[] }) {
  const t = await getTranslations('home');
  const locale = await getLocale();
  if (!sections.length) return null;
  return (
    <section id="occasions" aria-labelledby="occasions-title" className="mx-auto max-w-[1440px] scroll-mt-6 pt-28 lg:pt-40">
      <SectionTitle id="occasions-title" title={t('occasionsTitle')} />
      <div className="mt-8 grid grid-cols-2 gap-4 px-6 lg:mt-11 lg:grid-cols-4 lg:gap-7 lg:px-[110px]">
        {sections.map((s, i) => (
          <Link
            key={s.key}
            href={`/occasions/${s.key}`}
            data-reveal
            className={`group relative flex h-[232px] flex-col items-center justify-between overflow-hidden rounded-t-[80px] rounded-b-2xl px-3 pt-8 pb-5 transition hover:-translate-y-1 lg:h-[380px] lg:rounded-t-[140px] lg:px-5 lg:pt-16 lg:pb-8 ${occasionTone(s.key, i)}`}
          >
            {s.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={s.imageUrl} alt="" loading="lazy" decoding="async" className="absolute inset-0 size-full object-cover opacity-90" />
            ) : (
              <OccasionArt sectionKey={s.key} className="size-[92px] transition duration-700 group-hover:scale-105 lg:size-[140px]" />
            )}
            <span className="relative flex flex-col items-center gap-0.5">
              <span className="font-display text-[28px] lg:text-[40px]">{localized(s.name, locale)}</span>
              {locale !== 'en' ? <span className="text-xs opacity-85 lg:text-sm">{s.name.en}</span> : null}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

export async function HowItWorks() {
  const t = await getTranslations('home');
  const steps = [
    { title: t('step1Title'), body: t('step1Body'), tone: 'bg-accent text-[#f3e3d3]', icon: <path d="M4 3h11v15H4zM10 21h9V8" /> },
    { title: t('step2Title'), body: t('step2Body'), tone: 'bg-blush text-accent', icon: <path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4" /> },
    { title: t('step3Title'), body: t('step3Body'), tone: 'bg-sand text-accent', icon: <path d="M4 12l16-8-6 16-3-7z" /> },
  ];
  return (
    <section id="how" aria-labelledby="how-title" className="mt-28 scroll-mt-6 border-y border-[#ebdad1] bg-paper py-16 lg:mt-40 lg:py-24">
      <div className="mx-auto max-w-[1440px]">
        <SectionTitle id="how-title" title={t('howTitle')} />
        <ol className="mt-10 flex flex-col gap-9 px-6 lg:mt-14 lg:grid lg:grid-cols-3 lg:gap-16 lg:px-[110px]">
          {steps.map((s, i) => (
            <li key={s.title} data-reveal className="flex items-start gap-5 lg:flex-col lg:items-center lg:text-center">
              <span className={`flex h-[76px] w-16 shrink-0 items-center justify-center rounded-t-[32px] rounded-b-[10px] lg:h-[130px] lg:w-[110px] lg:rounded-t-[55px] lg:rounded-b-[14px] ${s.tone}`}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="lg:size-11">
                  {s.icon}
                </svg>
              </span>
              <span className="flex flex-col gap-1.5 pt-1.5">
                <span className="font-display text-2xl text-accent lg:text-[32px]">
                  <span className="hidden lg:inline">{['١', '٢', '٣'][i]} · </span>
                  {s.title}
                </span>
                <span className="text-[15px] leading-[1.8] text-muted lg:max-w-[300px] lg:text-[17px]">{s.body}</span>
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

export async function Features() {
  const t = await getTranslations('home');
  const items = [
    { label: t('featureMusic'), icon: <path d="M9 18V5l11-2v13M6 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm11-2a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" /> },
    { label: t('featureRsvp'), icon: <path d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM8 12l3 3 5-6" /> },
    { label: t('featurePrint'), icon: <path d="M7 9V3h10v6M3 9h18v8H3zM7 14h10v7H7z" /> },
    { label: t('featureDays'), icon: <path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4" /> },
  ];
  return (
    <section aria-labelledby="features-title" className="mx-auto grid max-w-[1440px] gap-8 px-6 pt-28 lg:grid-cols-2 lg:items-center lg:gap-24 lg:px-[110px] lg:pt-40">
      <div data-reveal className="flex flex-col items-center gap-7 text-center lg:items-start lg:text-start">
        <h2 id="features-title" className="font-display text-[36px] leading-[1.35] font-bold text-heading lg:text-[54px]">
          {t('featuresTitle')}
        </h2>
        <div className="w-[290px] rounded-[18px] rounded-ee-[4px] bg-white px-4 py-3.5 shadow-[0_10px_26px_rgb(74_19_34/0.1)] lg:w-[360px]">
          <p className="text-sm lg:text-base">{t('sampleMessage')}</p>
          <p dir="ltr" className="text-start text-[13px] text-accent lg:text-sm">
            …/i/ali-noor-x7k2p9qd4m
          </p>
        </div>
      </div>
      <ul className="grid grid-cols-2 gap-3.5 lg:gap-4">
        {items.map((f) => (
          <li key={f.label} data-reveal className="flex flex-col gap-3 rounded-[18px] border border-[#ebdad1] bg-paper px-4 py-5 lg:px-6 lg:py-7">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6e1f33" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              {f.icon}
            </svg>
            <span className="text-sm leading-[1.7] lg:text-[17px]">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

export async function Faq() {
  const t = await getTranslations('home');
  const items = [1, 2, 3, 4].map((n) => ({ q: t(`faq${n}q` as 'faq1q'), a: t(`faq${n}a` as 'faq1a') }));
  return (
    <section aria-labelledby="faq-title" className="mx-auto grid max-w-[1440px] gap-6 px-6 pt-28 lg:grid-cols-3 lg:gap-20 lg:px-[110px] lg:pt-40">
      <h2 id="faq-title" data-reveal className="font-display text-center text-[36px] font-bold text-heading lg:text-start lg:text-[54px]">
        {t('faqTitle')}
      </h2>
      <div className="lg:col-span-2">
        {items.map((f, i) => (
          <details key={f.q} open={i === 0} className="group border-b border-line">
            <summary className="flex min-h-[60px] cursor-pointer list-none items-center justify-between gap-3 py-3.5 text-[15px] font-medium lg:min-h-[68px] lg:text-[19px] [&::-webkit-details-marker]:hidden">
              {f.q}
              <span aria-hidden className="text-2xl leading-none text-accent transition duration-300 group-open:rotate-45">
                +
              </span>
            </summary>
            <p className="pb-5 text-sm leading-[1.9] text-muted lg:max-w-[680px] lg:text-[17px]">{f.a}</p>
          </details>
        ))}
      </div>
    </section>
  );
}

export async function CtaBand() {
  const t = await getTranslations('home');
  return (
    <section className="mx-4 mt-28 lg:mx-auto lg:mt-40 lg:max-w-[1220px]">
      <div
        data-reveal
        className="relative flex flex-col items-center gap-5 overflow-hidden rounded-t-[170px] rounded-b-[22px] bg-accent px-6 pt-16 pb-12 text-center text-accent-ink lg:rounded-t-[400px] lg:pt-20 lg:pb-16"
      >
        <span aria-hidden className="absolute inset-3 rounded-t-[160px] rounded-b-[14px] border border-[#d9b77c80] lg:inset-4 lg:rounded-t-[390px]" />
        <span className="relative flex size-[70px] items-center justify-center rounded-full bg-canvas shadow-[inset_0_0_0_5px_#e6cfc4] lg:size-[84px]">
          <span className="font-display text-[32px] leading-none text-accent lg:text-[40px]">ب</span>
        </span>
        <h2 className="font-display relative text-[36px] leading-[1.35] font-bold lg:text-[58px]">{t('ctaTitle')}</h2>
        <Link href="/themes" className="relative inline-flex h-[54px] items-center rounded-full bg-canvas px-8 text-base font-semibold text-accent lg:h-[60px] lg:px-10 lg:text-lg">
          {t('ctaButton')}
        </Link>
      </div>
    </section>
  );
}
