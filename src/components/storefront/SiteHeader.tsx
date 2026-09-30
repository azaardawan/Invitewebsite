import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './currency';

export async function SiteHeader() {
  const t = await getTranslations('common');
  return (
    <header className="border-b border-line">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="text-xl font-semibold">
          {t('brand')}
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          <LanguageSwitcher label={t('language')} />
          <CurrencySwitcher />
        </div>
      </div>
    </header>
  );
}
