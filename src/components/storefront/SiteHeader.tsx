import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from './LanguageSwitcher';
import { CurrencySwitcher } from './currency';
import { MobileMenu } from './MobileMenu';

export async function SiteHeader() {
  const t = await getTranslations('common');
  const n = await getTranslations('nav');
  const links = [
    { href: '/', label: n('home') },
    { href: '/themes', label: n('themes') },
    { href: '/#occasions', label: n('occasions') },
    { href: '/#how', label: n('how') },
    { href: '/contact', label: n('contact') },
  ];
  return (
    <header className="relative z-30">
      <div className="mx-auto grid max-w-[1440px] grid-cols-3 items-center px-4 py-3 lg:px-[110px] lg:py-6">
        <div className="flex items-center gap-1">
          <nav aria-label={n('menu')} className="hidden gap-8 text-[15px] font-medium lg:flex">
            {links.map((l) => (
              <Link key={l.href} href={l.href} className="hover:text-accent">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="lg:hidden">
            <LanguageSwitcher label={t('language')} />
          </div>
        </div>
        <Link href="/" className="font-display justify-self-center text-[38px] leading-none font-bold text-accent lg:text-[50px]">
          {t('brand')}
        </Link>
        <div className="flex items-center justify-end gap-2">
          <div className="hidden items-center gap-2 lg:flex">
            <LanguageSwitcher label={t('language')} />
            <CurrencySwitcher />
          </div>
          <MobileMenu links={links} labels={{ menu: n('menu'), close: n('close'), brand: t('brand') }} />
        </div>
      </div>
    </header>
  );
}
