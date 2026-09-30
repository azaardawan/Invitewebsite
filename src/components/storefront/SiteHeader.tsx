import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';

export async function SiteHeader() {
  const t = await getTranslations('common');
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-semibold">
          {t('brand')}
        </Link>
        <LanguageSwitcher label={t('language')} />
      </div>
    </header>
  );
}
