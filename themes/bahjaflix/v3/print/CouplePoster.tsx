import { Photo, type PrintPosterProps, type ThemePhoto } from '@/theme-sdk';
import fonts from '../fonts.module.css';
import s from './poster.module.css';

/**
 * The couple posters (features `couple_poster_landscape` / `couple_poster_portrait`, print/CouplePoster.tsx), as approved on the demos: the title page as a printed A3 poster.
 * Portrait: their picture on top (no logo, owner 2026-11-01), the title, TOP #01, the story and "starring". Landscape: the split hero and
 * a row of their photos. Both end with Bahja's details (website, WhatsApp/phone, Instagram). Drawn at the demo's own
 * size and scaled into the platform's box.
 */
/** A class of this poster's stylesheet. */
const k = (name: string) => s[name] ?? '';

const DEMO = { portrait: { width: 1240, height: 1754 }, landscape: { width: 1754, height: 1240 } } as const;

function Wordmark({ className }: { className?: string }) {
  const word = 'BAHJAFLIX';
  const mid = (word.length - 1) / 2;
  return (
    <span className={className} dir="ltr">
      {[...word].map((ch, i) => (
        <span key={i} style={{ transform: `scaleY(${(1 + 0.16 * ((i - mid) / mid) ** 2).toFixed(3)})` }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

function Picture({ photo, still, className }: { photo: ThemePhoto | undefined; still: string | null; className: string }) {
  if (still) return <span className={className} style={{ backgroundImage: `url("${still}")` }} />;
  if (photo) return <Photo photo={photo} className={className} eager />;
  return <span className={className} />;
}

function Footer({ contact, className }: { contact: PrintPosterProps['contact']; className: string }) {
  return (
    <div className={className}>
      <span>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
        </svg>
        <bdi>{contact.website}</bdi>
      </span>
      {contact.phone ? (
        <span dir="ltr">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <path d="M3 21l1.6-4.7A9 9 0 1 1 8 19.5z" />
            <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 1c-1.2-.5-2.5-1.8-3-3l1-1-1-2z" fill="currentColor" stroke="none" />
          </svg>
          {contact.phone}
        </span>
      ) : null}
      {contact.instagram ? (
        <span dir="ltr">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
          </svg>
          {contact.instagram}
        </span>
      ) : null}
    </div>
  );
}

export default function Poster(props: PrintPosterProps) {
  const { orientation, size, dir, lang, still, main, row, contact, texts } = props;
  const demo = DEMO[orientation];
  // Every text is the customer's for this poster (or the page's): '' means they left it out.
  const tx = (key: string) => texts[key]?.trim() ?? '';
  // The customer's choices (the poster step): the big picture (a photo or their own picture, or the video's still).
  const hero = main ?? undefined;
  const heroStill = main ? null : still;
  const scale = size.width / demo.width;
  const starring = (className: string) =>
    tx('couple') || tx('starring') ? (
      <div className={k(className)}>
        {tx('starring') ? <em>{tx('starring')}</em> : null} {tx('couple')}
        <i>★★★★★</i>
      </div>
    ) : null;

  return (
    <div className={`${fonts.root} ${k('box')}`} dir={dir} lang={lang} style={{ width: demo.width, height: demo.height, transform: `scale(${scale})` }}>
      {orientation === 'portrait' ? (
        <div className={k('portrait')}>
          <Picture photo={hero} still={heroStill} className={k('photo')} />
          <div className={k('fade')} />
          <div className={k('info')}>
            {tx('label') ? (
              <div className={k('kind')}>
                <b>B</b>
                {tx('label')}
              </div>
            ) : null}
            {tx('title') ? <h1 className={k('title')}>{tx('title')}</h1> : null}
            {tx('badge') ? (
              <div className={k('rank')}>
                <span className={k('dot')}>
                  TOP<b>#01</b>
                </span>
                {tx('badge')}
              </div>
            ) : null}
            {tx('match') || tx('since') ? (
              <div className={k('meta')}>
                {tx('match') ? <span className={k('green')}>{tx('match')}</span> : null}
                {tx('since') ? <span>{tx('since')}</span> : null}
              </div>
            ) : null}
            {tx('story') ? <p className={k('story')}>{tx('story')}</p> : null}
            {starring('star')}
            <Footer contact={contact} className={k('foot')} />
          </div>
        </div>
      ) : (
        <div className={k('landscape')}>
          <Picture photo={hero} still={heroStill} className={k('lphoto')} />
          <div className={k('lshade')} />
          <div className={k('ribbon')}>
            <small>TOP</small>
            <b>01</b>
          </div>
          {tx('tag') ? <div className={k('tag')}>{tx('tag')}</div> : null}
          <div className={k('linfo')}>
            <Wordmark className={k('llogo')} />
            {tx('label') ? (
              <div className={k('sub')}>
                <b>B</b>
                {tx('label')}
              </div>
            ) : null}
            {tx('title') ? <h1 className={k('ltitle')}>{tx('title')}</h1> : null}
            {tx('badge') ? (
              <div className={k('rank')}>
                <span className={k('dot')}>
                  TOP<b>#01</b>
                </span>
                {tx('badge')}
              </div>
            ) : null}
            {tx('story') ? <p className={k('lstory')}>{tx('story')}</p> : null}
            {starring('star')}
            <div className={k('btns')}>
              {tx('play') ? <span className={k('play')}>▶ {tx('play')}</span> : null}
              {tx('moreInfo') ? <span className={k('more')}>{tx('moreInfo')}</span> : null}
              {tx('match') ? <span className={k('green')}>{tx('match')}</span> : null}
              {tx('since') ? <span className={k('when')}>{tx('since')}</span> : null}
            </div>
          </div>
          {row.length ? (
            <>
              {tx('rowTitle') ? <h2 className={k('rowTitle')}>{tx('rowTitle')}</h2> : null}
              <div className={k('mem')}>
                {row.map((p) => (
                  <span key={p.index} className={k('memItem')}>
                    <Photo photo={p} className={k('memPhoto')} eager />
                    <b>B</b>
                  </span>
                ))}
              </div>
            </>
          ) : null}
          <Footer contact={contact} className={k('lfoot')} />
        </div>
      )}
    </div>
  );
}
