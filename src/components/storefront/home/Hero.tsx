import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { InviteArt, type InviteText, type InviteVariant } from '../art/InviteArt';

type CardKey = 'c1' | 'c2' | 'c3' | 'c4' | 'c5';

/**
 * Hero from the approved v2 design: headline, five illustrated invitations
 * fanned out (mobile: below the headline; desktop: on both sides), drifting
 * petals, the shanasheel lattice arch and the wax seal.
 */
const CARDS: { variant: InviteVariant; text: CardKey; cls: string; bob: string }[] = [
  // Back row first so later cards sit on top.
  {
    variant: 'rose',
    text: 'c5',
    bob: 'bh-bob',
    cls: 'left-[calc(50%-235px)] top-[150px] scale-[.62] -rotate-[14deg] lg:left-[20%] lg:top-[330px] lg:scale-[.95] lg:rotate-[6deg]',
  },
  {
    variant: 'blush',
    text: 'c4',
    bob: 'bh-bob-3',
    cls: 'left-[calc(50%+35px)] top-[150px] scale-[.62] rotate-[14deg] lg:left-auto lg:right-[21%] lg:top-[330px] lg:scale-[.95] lg:-rotate-[5deg]',
  },
  {
    variant: 'ivory',
    text: 'c3',
    bob: 'bh-bob',
    cls: 'left-[calc(50%-25px)] top-[70px] scale-[.78] rotate-[7deg] lg:left-[8%] lg:top-[110px] lg:scale-[1.1] lg:-rotate-[9deg]',
  },
  { variant: 'velvet', text: 'c2', bob: 'bh-bob-3', cls: 'left-[calc(50%-175px)] top-[70px] scale-[.78] -rotate-[7deg] lg:hidden' },
  {
    variant: 'night',
    text: 'c1',
    bob: 'bh-bob-2',
    cls: 'left-[calc(50%-100px)] top-5 lg:left-auto lg:right-[8%] lg:top-[150px] lg:scale-[1.15] lg:rotate-[8deg]',
  },
];

const PETALS = [
  'left-[8%] top-[60px] [animation-delay:-2s]',
  'left-[78%] top-5 [animation-delay:-7s] bg-[#d98e9c]',
  'left-[46%] top-0 [animation-delay:-11s] bg-[#f0c6cc]',
  'left-[90%] top-[140px] [animation-delay:-4s] [animation-duration:19s]',
  'left-[22%] top-[200px] [animation-delay:-14s] [animation-duration:21s] bg-[#d98e9c]',
  'left-[64%] top-[90px] [animation-delay:-9s] [animation-duration:18s] bg-[#f0c6cc]',
  'left-[4%] top-[300px] [animation-delay:-16s] [animation-duration:23s]',
];

export async function Hero() {
  const t = await getTranslations('home');
  const card = (k: CardKey): InviteText => ({
    name1: t(`cards.${k}.name1`),
    name2: t(`cards.${k}.name2`),
    caption: t(`cards.${k}.caption`),
    date: t(`cards.${k}.date`),
  });
  return (
    <section className="relative mx-auto flex max-w-[1440px] flex-col overflow-hidden pt-8 lg:h-[780px] lg:pt-0">
      <div
        aria-hidden
        className="bh-lattice absolute top-[250px] right-[9%] left-[9%] h-[470px] rounded-t-[160px] border border-[#e3c9bf] opacity-80 lg:top-10 lg:right-auto lg:left-1/2 lg:h-[740px] lg:w-[500px] lg:-translate-x-1/2 lg:rounded-t-[250px]"
      />
      {PETALS.map((p) => (
        <span key={p} aria-hidden className={`bh-petal ${p}`} />
      ))}

      <div className="relative z-10 order-1 flex flex-col items-center gap-4 px-6 text-center lg:absolute lg:top-[150px] lg:left-1/2 lg:w-[520px] lg:-translate-x-1/2 lg:gap-5">
        <svg aria-hidden width="80" height="16" viewBox="0 0 60 14" fill="none" stroke="#a8834f" strokeWidth="1" className="bh-rise hidden lg:block">
          <path d="M30 1l1.8 4.3 4.6.5-3.5 3.1 1 4.5-3.9-2.4-3.9 2.4 1-4.5-3.5-3.1 4.6-.5z" />
          <path d="M2 8h18M40 8h18" />
        </svg>
        <h1 className="bh-rise font-display text-[46px] leading-[1.3] font-bold text-heading lg:text-[76px]">
          {t('heroLine1')}
          <br />
          {t('heroLine2')}
        </h1>
        <p className="bh-rise-2 text-base text-muted lg:text-xl">{t('heroSubtitle')}</p>
        <div className="bh-rise-3 hidden flex-col items-center gap-5 pt-3 lg:flex">
          <BrowseButton label={t('browse')} />
        </div>
      </div>

      <div className="relative order-2 mt-8 h-[470px] lg:absolute lg:inset-0 lg:mt-0 lg:h-auto" aria-hidden>
        {CARDS.map((c) => (
          <div key={c.variant} className={`absolute h-[300px] w-[200px] origin-top ${c.cls}`}>
            <div className={c.bob}>
              <InviteArt variant={c.variant} text={card(c.text)} and={t('and')} />
            </div>
          </div>
        ))}
        <div className="bh-bob absolute top-[268px] left-[calc(50%+67px)] flex size-[58px] items-center justify-center rounded-full bg-accent shadow-[inset_0_0_0_4px_#5a1829,0_8px_18px_rgb(74_19_34/0.3)] lg:top-[530px] lg:left-[17%] lg:size-[76px]">
          <span className="font-display text-[26px] leading-none text-[#eed9d1] lg:text-[34px]">ب</span>
        </div>
      </div>

      <div className="bh-rise-3 order-3 flex flex-col items-center gap-4 pt-2 lg:hidden">
        <BrowseButton label={t('browse')} />
      </div>
    </section>
  );
}

function BrowseButton({ label }: { label: string }) {
  return (
    <>
      <Link
        href="/#themes"
        className="inline-flex h-[54px] items-center rounded-full bg-accent px-9 text-base font-semibold text-accent-ink shadow-[0_10px_22px_rgb(110_31_51/0.25)] transition hover:bg-accent-deep lg:h-[60px] lg:px-11 lg:text-lg"
      >
        {label}
      </Link>
      <svg aria-hidden className="bh-bob" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6e1f33" strokeWidth="1.8" strokeLinecap="round">
        <path d="M6 9l6 6 6-6" />
      </svg>
    </>
  );
}
