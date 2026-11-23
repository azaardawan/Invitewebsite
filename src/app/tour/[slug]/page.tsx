import type { Metadata } from 'next';
import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import { db } from '@/server/db/client';
import { env } from '@/server/env';
import { clientIpFrom, hashIp } from '@/server/auth/request-context';
import { consumeRateLimit, rateLimited } from '@/server/rate-limit';
import { messagesFor } from '@/i18n/messages';
import { localeMeta } from '@/i18n/config';
import { countTourVisit, publicTour } from '@/server/tours/tours';
import { tourLocale } from '@/server/tours/locale';
import { InvitationEnded } from '@/components/invitation/InvitationEnded';
import { TourViewer, type TourWords } from '@/components/tour/TourViewer';

export const dynamic = 'force-dynamic';

const MISS_LIMIT = 30;

type TourMessages = TourWords & { title: string; share: string; offTitle: string; offBody: string; endedTitle: string; endedBody: string };

async function words() {
  const locale = tourLocale((await headers()).get('accept-language'));
  const m = messagesFor(locale) as unknown as { tour: TourMessages; common: { brand: string } };
  return { locale, t: m.tour, brand: m.common.brand };
}

export async function generateMetadata({ params }: PageProps<'/tour/[slug]'>): Promise<Metadata> {
  const { slug } = await params;
  const r = await publicTour(db(), slug);
  if (r.state !== 'live') return {};
  const { t } = await words();
  const title = t.title.replace('{name}', r.tour.name);
  const url = `${env().APP_URL.replace(/\/$/, '')}/tour/${slug}`;
  const logo = r.tour.logo ? new URL(r.tour.logo, url).href : undefined;
  return {
    title,
    description: t.share,
    alternates: { canonical: url },
    openGraph: { title, description: t.share, url, type: 'website', ...(logo ? { images: [{ url: logo, alt: r.tour.name }] } : {}) },
    twitter: { card: 'summary', title, description: t.share, ...(logo ? { images: [logo] } : {}) },
  };
}

/**
 * A café's virtual tour (owner, 2026-11-21): the link in its Instagram bio. Shown while it is on and its subscription
 * has not ended; otherwise a calm page says so. Unknown names are a 404 (misses are rate-limited).
 */
export default async function TourPage({ params }: PageProps<'/tour/[slug]'>) {
  const { slug } = await params;
  const ipHash = hashIp(clientIpFrom(await headers()));
  if (await rateLimited(db(), `tour-miss:${ipHash}`, MISS_LIMIT, 3600)) notFound();
  const r = await publicTour(db(), slug);
  if (r.state === 'missing') {
    await consumeRateLimit(db(), `tour-miss:${ipHash}`, MISS_LIMIT, 3600);
    notFound();
  }
  const { locale, t, brand } = await words();
  if (r.state !== 'live') {
    return (
      <InvitationEnded
        title={(r.state === 'ended' ? t.endedTitle : t.offTitle).replace('{name}', r.name ?? '')}
        body={r.state === 'ended' ? t.endedBody : t.offBody}
        brand={brand}
      />
    );
  }
  await countTourVisit(db(), r.tour.id);
  return <TourViewer name={r.tour.name} logo={r.tour.logo} model={r.tour.model} links={r.tour.links} edits={r.tour.edits} words={t} dir={localeMeta[locale].dir} />;
}
