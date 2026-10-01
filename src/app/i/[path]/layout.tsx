import type { Metadata } from 'next';
import { isLocale, localeMeta } from '@/i18n/config';
import { resolvePublicInvitation } from '@/server/invitation/public';

export const metadata: Metadata = { robots: { index: false, follow: false, nocache: true } };

/** Minimal root layout (no platform CSS): guests get only the theme and its own chunk. */
export default async function InvitationRootLayout({ children, params }: LayoutProps<'/i/[path]'>) {
  const { path } = await params;
  const r = await resolvePublicInvitation(path);
  const locale = r.state === 'live' ? r.invitation.locale : r.state === 'ended' && isLocale(r.locale) ? r.locale : 'ar';
  const meta = localeMeta[locale];
  return (
    <html lang={meta.htmlLang} dir={meta.dir}>
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}
