import Link from 'next/link';
import { getTranslations } from 'next-intl/server';

export default async function AdminNotFound() {
  const t = await getTranslations('errors');
  return (
    <main className="mx-auto max-w-xl px-4 py-24 text-center">
      <h1 className="text-xl font-semibold">{t('notFoundTitle')}</h1>
      <Link href="/admin" className="mt-6 inline-block text-accent underline">
        {t('backHome')}
      </Link>
    </main>
  );
}
