import { notFound } from 'next/navigation';
import { labContext } from '../lab';

/** Renders a theme version with sample data in one of its designed package states (sample mode: the form is inert). */
export default async function ThemeLabPage({ params, searchParams }: PageProps<'/dev/themes/[ref]'>) {
  const { ref } = await params;
  const ctx = await labContext(ref, await searchParams);
  if (!ctx.loaders.theme) notFound();
  const { default: Theme } = await ctx.loaders.theme();
  return (
    <Theme
      mode="sample"
      locale={ctx.locale}
      dir={ctx.dir}
      fields={ctx.fields}
      features={ctx.state.features}
      labels={{}}
      music={ctx.music}
    />
  );
}
