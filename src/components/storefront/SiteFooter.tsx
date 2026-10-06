import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { localized } from '@/lib/localized';
import { socialLinks, whatsappHref, type ContactInfo } from '@/lib/contact-links';

/** Footer; contact details come from Admin → Website settings (loaded by the layout). */
export async function SiteFooter({ contact }: { contact: ContactInfo }) {
  const t = await getTranslations('footer');
  const nav = await getTranslations('nav');
  const common = await getTranslations('common');
  const locale = await getLocale();
  const social = socialLinks(contact);
  return (
    <footer className="mt-28 bg-heading text-[#eed9d1] lg:mt-40">
      <div className="mx-auto grid max-w-[1440px] gap-10 px-6 py-14 text-center lg:grid-cols-3 lg:px-[110px] lg:text-start">
        <div className="flex flex-col items-center gap-2 lg:items-start">
          <span className="font-display text-[40px] leading-none">{common('brand')}</span>
          <p className="text-sm opacity-80">{t('tagline')}</p>
        </div>
        <nav aria-label={nav('menu')} className="flex flex-col items-center gap-2 text-sm lg:items-start">
          <Link href="/themes" className="hover:underline">{nav('themes')}</Link>
          <Link href="/#occasions" className="hover:underline">{nav('occasions')}</Link>
          <Link href="/#how" className="hover:underline">{nav('how')}</Link>
          <Link href="/contact" className="hover:underline">{nav('contact')}</Link>
          <Link href="/access" className="hover:underline">{t('access')}</Link>
        </nav>
        <div className="flex flex-col items-center gap-2 text-sm lg:items-start">
          {contact.whatsapp ? (
            <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noopener noreferrer" className="hover:underline">
              {t('whatsapp')}: <span dir="ltr">{contact.whatsapp}</span>
            </a>
          ) : null}
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="hover:underline">
              {t('phone')}: <span dir="ltr">{contact.phone}</span>
            </a>
          ) : null}
          {contact.email ? (
            <a href={`mailto:${contact.email}`} className="hover:underline" dir="ltr">
              {contact.email}
            </a>
          ) : null}
          {social.length ? (
            <p className="flex flex-wrap justify-center gap-x-4 gap-y-1 lg:justify-start">
              {social.map((s) => (
                <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className="hover:underline">
                  {t(s.key)}
                </a>
              ))}
            </p>
          ) : null}
          {contact.address ? <p className="opacity-80">{localized(contact.address, locale)}</p> : null}
        </div>
      </div>
      <div className="border-t border-[#ffffff1f] px-6 py-5 text-center text-xs opacity-80">
        <nav aria-label={t('legal')} className="mb-2 flex flex-wrap justify-center gap-x-5 gap-y-1">
          <Link href="/legal/terms" className="hover:underline">{t('terms')}</Link>
          <Link href="/legal/privacy" className="hover:underline">{t('privacy')}</Link>
          <Link href="/legal/refund" className="hover:underline">{t('refund')}</Link>
        </nav>
        <p className="opacity-90">{t('rights', { year: new Date().getFullYear() })}</p>
      </div>
    </footer>
  );
}
