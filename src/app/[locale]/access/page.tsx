import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { Locale } from '@/i18n/config';
import { PageHeading } from '@/components/storefront/ThemeGrid';
import { accessAction } from '../_actions/access';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/access'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'access' });
  return { title: t('title'), robots: { index: false } };
}

/** "My invitation": customers type the number from their receipt to get back to everything, no account needed. */
export default async function AccessPage({ params, searchParams }: PageProps<'/[locale]/access'>) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations('access');
  const { e } = await searchParams;
  const error = e === 'invalid' || e === 'notFound' || e === 'rateLimited' ? e : null;

  return (
    <>
      <PageHeading title={t('title')} subtitle={t('subtitle')} />
      <form action={accessAction} className="mx-auto mt-10 flex max-w-md flex-col gap-4 px-6">
        <input type="hidden" name="locale" value={locale} />
        <label className="flex flex-col gap-2">
          <span className="text-sm font-semibold text-heading">{t('label')}</span>
          <input
            name="code"
            required
            inputMode="numeric"
            autoComplete="off"
            dir="ltr"
            placeholder="482 199 3015"
            maxLength={20}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'access-error' : 'access-help'}
            className="h-14 rounded-2xl border border-line bg-surface px-5 text-center text-xl tracking-widest"
          />
        </label>
        {error ? (
          <p id="access-error" role="alert" className="text-sm text-danger">
            {t(`errors.${error}`)}
          </p>
        ) : (
          <p id="access-help" className="text-sm text-muted">
            {t('help')}
          </p>
        )}
        <button type="submit" className="h-14 rounded-full bg-accent px-8 text-base font-semibold text-accent-ink">
          {t('submit')}
        </button>
      </form>
    </>
  );
}
