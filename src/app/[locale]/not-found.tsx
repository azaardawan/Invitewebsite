import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function NotFound() {
  const t = await getTranslations('errors');
  return (
    <section className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-2xl font-semibold">{t('notFoundTitle')}</h1>
      <p className="mt-4 text-muted">{t('notFoundBody')}</p>
      <Link href="/" className="mt-8 inline-block rounded-full bg-accent px-6 py-3 text-accent-ink">
        {t('backHome')}
      </Link>
    </section>
  );
}
