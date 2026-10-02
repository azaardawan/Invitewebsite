import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { formatLongDate } from '@/server/invitation/theme-props';
import { db } from '@/server/db/client';
import { currentPolicy, policyTypeFromSlug, type PolicyType } from '@/server/legal/policies';
import { PageHeading } from '@/components/storefront/ThemeGrid';
import { PolicyText } from '@/components/legal/PolicyText';

const TITLE_KEY: Record<PolicyType, 'terms' | 'privacy' | 'refund'> = { TERMS: 'terms', PRIVACY: 'privacy', REFUND: 'refund' };

export async function generateMetadata({ params }: PageProps<'/[locale]/legal/[type]'>): Promise<Metadata> {
  const { locale, type } = await params;
  const policy = policyTypeFromSlug(type);
  if (!policy) return {};
  const t = await getTranslations({ locale, namespace: 'footer' });
  return { title: t(TITLE_KEY[policy]) };
}

/** The current published version of a legal policy, in the visitor's language (Kurdish falls back to Arabic). */
export default async function LegalPage({ params }: PageProps<'/[locale]/legal/[type]'>) {
  const { locale, type } = (await params) as { locale: Locale; type: string };
  setRequestLocale(locale);
  const policy = policyTypeFromSlug(type);
  if (!policy) notFound();
  const t = await getTranslations('legal');
  const f = await getTranslations('footer');
  const row = await currentPolicy(db(), policy);
  const date = row?.publishedAt ? formatLongDate(row.publishedAt, locale) : null;

  return (
    <>
      <PageHeading title={f(TITLE_KEY[policy])} subtitle={row && date ? t('updated', { date, version: row.version }) : t('preparing')} />
      {row ? (
        <article className="mx-auto mt-10 max-w-2xl px-6" dir="auto">
          <PolicyText source={localized(row.content, locale)} />
        </article>
      ) : null}
    </>
  );
}
