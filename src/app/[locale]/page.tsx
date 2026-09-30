import { getTranslations, setRequestLocale } from 'next-intl/server';

/** Placeholder until the homepage design is supplied (milestone M4). */
export default async function HomePage({ params }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('home');

  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t('preparingTitle')}</h1>
      <p className="mt-4 text-muted">{t('preparingBody')}</p>
    </section>
  );
}
