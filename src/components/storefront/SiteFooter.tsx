import { getTranslations } from 'next-intl/server';

export async function SiteFooter() {
  const t = await getTranslations('footer');
  return (
    <footer className="border-t border-line">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-muted">
        {t('rights', { year: new Date().getFullYear() })}
      </div>
    </footer>
  );
}
