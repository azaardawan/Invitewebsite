import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  return (
    <footer className="mt-28 bg-heading text-[#eed9d1] lg:mt-40">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center gap-6 px-6 py-14 text-center lg:flex-row lg:justify-between lg:px-[110px] lg:text-start">
        <div className="flex flex-col items-center gap-2 lg:items-start">
          <span className="font-display text-[40px] leading-none">بهجه</span>
          <p className="text-sm opacity-80">{t('tagline')}</p>
        </div>
        <nav aria-label={nav('menu')} className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
          <Link href="/themes" className="hover:underline">{nav('themes')}</Link>
          <Link href="/#occasions" className="hover:underline">{nav('occasions')}</Link>
          <Link href="/#how" className="hover:underline">{nav('how')}</Link>
        </nav>
      </div>
      <div className="border-t border-[#ffffff1f] py-5 text-center text-xs opacity-70">{t('rights', { year: new Date().getFullYear() })}</div>
    </footer>
  );
}
