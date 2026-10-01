import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { localized } from '@/lib/localized';
import type { Locale } from '@/i18n/config';
import { publicContact } from '@/server/settings/public';
import { socialLinks, whatsappHref } from '@/lib/contact-links';
import { PageHeading } from '@/components/storefront/ThemeGrid';

// Rendered per request: contact details come from Admin settings (the image is built without a database).
export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: PageProps<'/[locale]/contact'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'contact' });
  return { title: t('title'), description: t('subtitle') };
}

/** Contact page, entirely from Admin → Website settings. */
export default async function ContactPage({ params }: PageProps<'/[locale]/contact'>) {
  const { locale } = (await params) as { locale: Locale };
  setRequestLocale(locale);
  const t = await getTranslations('contact');
  const f = await getTranslations('footer');
  const contact = await publicContact();
  const social = socialLinks(contact);
  const row = 'flex flex-col gap-1 rounded-2xl border border-line bg-surface px-5 py-4';
  const nothing = !contact.whatsapp && !contact.phone && !contact.email && !social.length;

  return (
    <>
      <PageHeading title={t('title')} subtitle={t('subtitle')} />
      <div className="mx-auto mt-10 flex max-w-xl flex-col gap-4 px-6">
        {contact.whatsapp ? (
          <a
            href={whatsappHref(contact.whatsapp, t('waText'))}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-14 items-center justify-center rounded-full bg-accent px-8 text-base font-semibold text-accent-ink"
          >
            {t('whatsappButton')}
          </a>
        ) : null}
        {contact.phone ? (
          <a href={`tel:${contact.phone}`} className={row}>
            <span className="text-sm text-muted">{f('phone')}</span>
            <span className="font-medium" dir="ltr">
              {contact.phone}
            </span>
          </a>
        ) : null}
        {contact.email ? (
          <a href={`mailto:${contact.email}`} className={row}>
            <span className="text-sm text-muted">{t('email')}</span>
            <span className="font-medium" dir="ltr">
              {contact.email}
            </span>
          </a>
        ) : null}
        {social.map((s) => (
          <a key={s.key} href={s.href} target="_blank" rel="noopener noreferrer" className={row}>
            <span className="text-sm text-muted">{f(s.key)}</span>
            <span className="font-medium" dir="ltr">
              {s.key === 'tiktok' ? '@' : ''}
              {s.handle}
            </span>
          </a>
        ))}
        {contact.address ? (
          <div className={row}>
            <span className="text-sm text-muted">{t('address')}</span>
            <span className="whitespace-pre-line">{localized(contact.address, locale)}</span>
          </div>
        ) : null}
        {contact.hours ? (
          <div className={row}>
            <span className="text-sm text-muted">{t('hours')}</span>
            <span className="whitespace-pre-line">{localized(contact.hours, locale)}</span>
          </div>
        ) : null}
        {nothing ? <p className="text-center text-muted">{t('soon')}</p> : null}
      </div>
    </>
  );
}
