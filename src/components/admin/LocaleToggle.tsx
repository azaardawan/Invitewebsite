import { getLocale, getTranslations } from 'next-intl/server';

export async function LocaleToggle({ action }: { action: (form: FormData) => Promise<void> }) {
  const locale = await getLocale();
  const t = await getTranslations('admin');
  const other = locale === 'ar' ? 'en' : 'ar';
  return (
    <form action={action}>
      <input type="hidden" name="locale" value={other} />
      <button type="submit" lang={other} className="text-sm text-muted underline-offset-4 hover:underline">
        {t('switchLanguage')}
      </button>
    </form>
  );
}
