import { Photo, type PrintPosterProps, type ThemePhoto } from '@/theme-sdk';
import { copyFor } from '../copy';
import fonts from '../fonts.module.css';
import s from './poster.module.css';

/**
 * The couple posters (feature `couple_poster`, print/CouplePoster.tsx), as approved on the demos: the title page as a printed A3 poster.
 * Portrait: their photo on top, the logo, the title, TOP #01, the story and "starring". Landscape: the split hero and
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
  const { orientation, size, locale, dir, lang, fields, wording, labels, still, main, row, contact } = props;
  const t = copyFor(locale);
  const demo = DEMO[orientation];
  const couple = [fields.person_1_name, fields.person_2_name].filter(Boolean).join(` ${labels.and} `);
  const story = fields.invitation_message?.trim() ?? '';
  // The customer's choices (the poster step): the big picture (a photo, or the video's still) and the row.
  const hero = main ?? undefined;
  const heroStill = main ? null : still;
  const scale = size.width / demo.width;

  return (
    <div className={`${fonts.root} ${k('box')}`} dir={dir} lang={lang} style={{ width: demo.width, height: demo.height, transform: `scale(${scale})` }}>
      {orientation === 'portrait' ? (
        <div className={k('portrait')}>
          <Picture photo={hero} still={heroStill} className={k('photo')} />
          <div className={k('fade')} />
          <Wordmark className={k('logo')} />
          <div className={k('info')}>
            <div className={k('kind')}>
              <b>B</b>
              {wording.label}
            </div>
            <h1 className={k('title')}>{wording.title}</h1>
            <div className={k('rank')}>
              <span className={k('dot')}>
                TOP<b>#01</b>
              </span>
              {wording.badge}
            </div>
            <div className={k('meta')}>
              <span className={k('green')}>{t.match}</span>
              <span>{wording.since}</span>
            </div>
            {story ? <p className={k('story')}>{story}</p> : null}
            {couple ? (
              <div className={k('star')}>
                <em>{t.starring}</em> {couple}
                <i>★★★★★</i>
              </div>
            ) : null}
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
          {wording.tag ? <div className={k('tag')}>{wording.tag}</div> : null}
          <div className={k('linfo')}>
            <Wordmark className={k('llogo')} />
            <div className={k('sub')}>
              <b>B</b>
              {wording.label}
            </div>
            <h1 className={k('ltitle')}>{wording.title}</h1>
            <div className={k('rank')}>
              <span className={k('dot')}>
                TOP<b>#01</b>
              </span>
              {wording.badge}
            </div>
            {story ? <p className={k('lstory')}>{story}</p> : null}
            {couple ? (
              <div className={k('star')}>
                <em>{t.starring}</em> {couple}
                <i>★★★★★</i>
              </div>
            ) : null}
            <div className={k('btns')}>
              <span className={k('play')}>▶ {t.play}</span>
              <span className={k('more')}>{t.moreInfo}</span>
              <span className={k('green')}>{t.match}</span>
              <span className={k('when')}>{wording.since}</span>
            </div>
          </div>
          {row.length ? (
            <>
              <h2 className={k('rowTitle')}>{wording.row1}</h2>
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
