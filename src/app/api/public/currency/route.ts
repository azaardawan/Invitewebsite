import { NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { getSettings } from '@/server/settings/service';

/**
 * Public exchange rate for display-only USD prices. Cached briefly at the
 * edge so storefront pages can stay static.
 */
export async function GET() {
  const { currency } = await getSettings(db());
  return NextResponse.json(
    { usdRateIqd: currency.usdRateIqd },
    { headers: { 'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600' } },
  );
}
