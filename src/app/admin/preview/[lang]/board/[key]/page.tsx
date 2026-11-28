import { notFound } from 'next/navigation';
import { eq } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { themes } from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guard';
import { resolveSample } from '@/server/invitation/preview';
import { themeBoard } from '@/server/catalog/card-design';
import { getSettings } from '@/server/settings/service';
import { invitationMessages } from '@/server/invitation/theme-props';
import { isLocale } from '@/i18n/config';
import { BOARD_INKS } from '@/catalog/signature-board';
import { signatureDrawing } from '@/lib/signature-strokes';
import { BoardPrint } from '@/components/board/BoardPrint';
import { SAMPLE_MESSAGES, sampleSignature } from '@/components/board/samples';
import type { BoardView } from '@/components/board/types';

/**
 * Admin sample of a design's signature board: the owner's artwork with sample guest messages (as many as one board
 * holds), laid out as a customer's would be. Embedded on the design's page.
 */
export default async function BoardSamplePreview({ params, searchParams }: PageProps<'/admin/preview/[lang]/board/[key]'>) {
  await requireAdmin({ permission: 'themes.view' });
  const { lang, key } = await params;
  if (!isLocale(lang)) notFound();
  const [theme] = await db().select({ id: themes.id }).from(themes).where(eq(themes.key, key));
  if (!theme) notFound();
  const design = await themeBoard(db(), theme.id);
  if (!design) notFound();
  const sample = await resolveSample(db(), { themeKey: key, locale: lang });
  const { signatureBoard } = await getSettings(db());
  const msgs = invitationMessages(lang) as unknown as { and: string; print: { keepsakeTitle: string } };
  const f = sample?.props.fields ?? {};
  const names = f.baby_name ? f.baby_name : [f.person_1_name, f.person_2_name].filter(Boolean).join(` ${msgs.and} `);
  const count = Math.min(SAMPLE_MESSAGES.length, signatureBoard.perBoard);
  const view: BoardView = {
    design: { src: design.src, widthMm: design.widthMm, heightMm: design.heightMm, area: design.area, inks: [...BOARD_INKS[design.inks]], title: design.title, titleColor: design.titleColor, titleFont: design.titleFont, font: design.font, keepOut: design.keepOut ?? null },
    heading: design.title ? { names, subtitle: msgs.print.keepsakeTitle } : null,
    notes: SAMPLE_MESSAGES.slice(0, count).map(([name, message], i) => ({ id: `00000000-0000-4000-8000-${String(i).padStart(12, '0')}`, name, message, signature: signatureDrawing(sampleSignature(i + 1)) })),
    perBoard: signatureBoard.perBoard,
    arrangement: null,
    dir: lang === 'en' ? 'ltr' : 'rtl',
    lang: lang === 'bdn' ? 'ku' : lang,
    occasion: null,
  };
  // `areas=1`: the decoration found on the artwork, shaded, where no message goes (owner, 2026-11-28).
  const areas = (await searchParams).areas === '1' ? design.keepOut : null;
  return (
    <div style={{ position: 'relative', width: '100%', margin: 0 }}>
      <style>{'html,body{margin:0;padding:0;background:#fff}'}</style>
      <BoardPrint view={view} board={0} />
      {areas ? (
        <svg
          data-keep-out=""
          viewBox={`0 0 ${areas.cols} ${areas.rows}`}
          preserveAspectRatio="none"
          aria-hidden="true"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
        >
          {Array.from(areas.cells, (c, i) => (c === '1' ? <rect key={i} x={i % areas.cols} y={Math.floor(i / areas.cols)} width={1} height={1} fill="rgba(200,30,70,0.38)" /> : null))}
        </svg>
      ) : null}
    </div>
  );
}
