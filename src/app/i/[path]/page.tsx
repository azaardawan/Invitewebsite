import { invitationNames } from '@/catalog/fields';
import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { headers } from 'next/headers';
import { db } from '@/server/db/client';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit, rateLimited } from '@/server/rate-limit';

const MISS_LIMIT = 30;
import { resolvePublicInvitation } from '@/server/invitation/public';
import { invitationRenderData } from '@/server/invitation/load';
import { invitationMessages } from '@/server/invitation/theme-props';
import { env } from '@/server/env';
import { isLocale } from '@/i18n/config';
import { InvitationView } from '@/components/invitation/InvitationView';
import { InvitationEnded } from '@/components/invitation/InvitationEnded';
import { submitGuestAction } from './actions';
import { InvitationOpenBeacon } from '@/components/analytics/Beacon';

export async function generateMetadata({ params }: PageProps<'/i/[path]'>): Promise<Metadata> {
  const { path } = await params;
  const r = await resolvePublicInvitation(path);
  if (r.state !== 'live') return {};
  const v = r.invitation.fieldValues;
  const msgs = invitationMessages(r.invitation.locale);
  const names = invitationNames(v).join(` ${msgs.and} `);
  const title = names || msgs.youreInvited;
  const url = `${env().APP_URL.replace(/\/$/, '')}${r.canonicalPath}`;
  return {
    title,
    description: msgs.youreInvited,
    alternates: { canonical: url },
    // The invitation's own cover with the names (see ./og), so WhatsApp shows the real invitation.
    openGraph: { title, description: msgs.youreInvited, url, type: 'website', images: [{ url: `${url}/og`, width: 1200, height: 630, alt: title }] },
    twitter: { card: 'summary_large_image', title, images: [`${url}/og`] },
  };
}

/**
 * The public invitation guests open from WhatsApp. Only published, unexpired
 * invitations render; expired ones show a calm "ended" page, and unknown ids
 * are a 404 (misses are rate-limited so ids can't be enumerated).
 */
export default async function PublicInvitationPage({ params }: PageProps<'/i/[path]'>) {
  const { path } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  // A visitor guessing ids gets cut off after 30 misses an hour: from then on
  // every /i page answers 404 for them, valid ids included.
  const missKey = ipHash ? `i-miss:${ipHash}` : null;
  if (missKey && (await rateLimited(db(), missKey, MISS_LIMIT, 3600))) notFound();
  const r = await resolvePublicInvitation(path);
  if (r.state === 'missing') {
    if (missKey) await consumeRateLimit(db(), missKey, MISS_LIMIT, 3600);
    notFound();
  }
  if (r.state === 'redirect') permanentRedirect(r.to);
  if (r.state === 'ended') {
    const msgs = invitationMessages(isLocale(r.locale) ? r.locale : 'ar');
    return <InvitationEnded title={msgs.endedTitle} body={msgs.endedBody} brand={msgs.brand} />;
  }
  const { codeRef, props } = await invitationRenderData(db(), r.invitation, 'live');
  const msgs = invitationMessages(r.invitation.locale);
  return (
    <>
      <InvitationOpenBeacon publicId={r.invitation.publicId} locale={r.invitation.locale} />
      <InvitationView
        codeRef={codeRef}
        props={props}
        ribbon={null}
        errorText={{ message: msgs.renderError, retry: msgs.retry }}
        submitGuestResponse={submitGuestAction.bind(null, r.invitation.id)}
        turnstileSiteKey={env().TURNSTILE_SITE_KEY ?? null}
      />
    </>
  );
}
