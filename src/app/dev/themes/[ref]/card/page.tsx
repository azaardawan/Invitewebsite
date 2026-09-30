import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import { labContext } from '../../lab';

/** Print proof of the theme's A5 invitation card (trim + bleed), ready for Chromium's PDF export. */
export default async function CardLabPage({ params, searchParams }: PageProps<'/dev/themes/[ref]/card'>) {
  const { ref } = await params;
  const ctx = await labContext(ref, await searchParams);
  const spec = ctx.manifest.print?.card;
  if (!ctx.loaders.card || !spec) notFound();
  const { default: Card } = await ctx.loaders.card();
  const [w, h] = spec.size === 'A5' ? [148, 210] : [127, 178];
  const qrDataUrl = spec.qr
    ? await QRCode.toDataURL('https://bahja.example/i/sample', { margin: 0, width: 300, color: { dark: '#39412d', light: '#fffdf8' } })
    : null;
  return (
    <>
      <style>{`@page { size: ${w + 2 * spec.bleedMm}mm ${h + 2 * spec.bleedMm}mm; margin: 0 }`}</style>
      <Card locale={ctx.locale} dir={ctx.dir} fields={ctx.fields} qrDataUrl={qrDataUrl} />
    </>
  );
}
