import { notFound } from 'next/navigation';
import { labContext } from '../../lab';
import { sampleMessages } from '../../samples';

/** Print proof of the theme's A4 keepsake with `?count=` sample messages (default 12). */
export default async function KeepsakeLabPage({ params, searchParams }: PageProps<'/dev/themes/[ref]/keepsake'>) {
  const { ref } = await params;
  const search = await searchParams;
  const ctx = await labContext(ref, search);
  if (!ctx.loaders.keepsake || !ctx.manifest.print?.keepsake) notFound();
  const { default: Keepsake } = await ctx.loaders.keepsake();
  const count = Math.min(500, Math.max(0, Number(search.count ?? 12) || 0));
  return (
    <>
      {/* Page geometry and numbering belong to the platform, not the theme. */}
      <style>{`
        @page { size: A4; margin: 18mm 16mm 20mm;
          @bottom-center { content: counter(page); font: 9pt serif; color: #626b45 } }
        @page :first { margin: 0; @bottom-center { content: none } }
      `}</style>
      <Keepsake locale={ctx.locale} dir={ctx.dir} fields={ctx.fields} messages={sampleMessages(ctx.locale, count)} />
    </>
  );
}
