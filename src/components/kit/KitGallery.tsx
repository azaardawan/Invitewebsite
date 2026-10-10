import type { KitUnitKey } from '@/catalog/kit';
import type { KitProps } from '@/theme-sdk/types';
import { ThemeErrorBoundary } from '@/components/invitation/ThemeErrorBoundary';
import { KitUnit } from './KitUnit';
import { Scaled } from './Scaled';
import styles from './kit.module.css';
import platform from '../invitation/platform.module.css';

export type GalleryUnit = { unit: KitUnitKey; props: KitProps };

/** Display width of each unit in the preview, in CSS px (it shrinks on narrow screens). */
const MAX_WIDTH: Record<KitUnitKey, number> = { story: 320, card: 320, 'sticker-round': 150, 'sticker-square': 150, bottle: 400 };

function watermarkUrl(text: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="150" height="100"><text x="75" y="55" text-anchor="middle" transform="rotate(-28 75 50)" font-family="system-ui,sans-serif" font-size="15" font-weight="700" fill="rgba(70,60,45,0.22)">${text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')}</text></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/**
 * Every file in the kit, drawn by the real theme with the customer's (or
 * sample) content, for previews. A watermark and a PREVIEW/SAMPLE ribbon the
 * theme can't remove sit on top: the full-resolution files exist only after payment.
 */
export function KitGallery({
  codeRef,
  units,
  titles,
  notes,
  ribbon,
  errorText,
}: {
  codeRef: string;
  units: GalleryUnit[];
  titles: Record<KitUnitKey, string>;
  notes?: Partial<Record<KitUnitKey, string>>;
  ribbon: string;
  errorText: { message: string; retry: string };
}) {
  const overlay = <div className={styles.watermark} style={{ backgroundImage: watermarkUrl(ribbon) }} aria-hidden />;
  const stickers = units.filter((u) => u.unit === 'sticker-round' || u.unit === 'sticker-square');
  const show = (u: GalleryUnit) => (
    <Scaled key={u.unit} width={u.props.size.width} height={u.props.size.height} maxWidth={MAX_WIDTH[u.unit]} round={u.props.size.shape === 'circle'} overlay={overlay}>
      <KitUnit codeRef={codeRef} props={u.props} clip="trim" />
    </Scaled>
  );
  const groups: { key: string; title: string; note?: string; body: React.ReactNode }[] = [];
  for (const u of units) {
    if (u.unit === 'sticker-square' && stickers.length === 2) continue;
    if (u.unit === 'sticker-round' || u.unit === 'sticker-square') {
      groups.push({ key: 'stickers', title: titles[u.unit], note: notes?.[u.unit], body: <div className={styles.row}>{stickers.map(show)}</div> });
    } else {
      groups.push({ key: u.unit, title: titles[u.unit], note: notes?.[u.unit], body: show(u) });
    }
  }
  return (
    <div className={styles.gallery} data-kit-gallery>
      <ThemeErrorBoundary codeRef={codeRef} message={errorText.message} retry={errorText.retry}>
        {groups.map((g) => (
          <section key={g.key} className={styles.group}>
            <h2>{g.title}</h2>
            {g.note ? <p className={styles.note}>{g.note}</p> : null}
            {g.body}
          </section>
        ))}
      </ThemeErrorBoundary>
      <div className={platform.ribbon} role="note">
        {ribbon}
      </div>
    </div>
  );
}
