import { NextResponse } from 'next/server';
import { env } from '@/server/env';
import { isValidStorageKey, storage } from '@/server/storage';
import { mediaServedHere } from '@/server/storage/served-here';

/**
 * Serves locally stored media in development. In staging/production media is served from the CDN domain, and this
 * route serves only the customers' photos and video stills, which the 3D gallery needs from the site itself
 * (`mediaServedHere`). PDF documents are private and never served here.
 */
export async function GET(_req: Request, ctx: RouteContext<'/media/[...key]'>) {
  const { key: parts } = await ctx.params;
  const key = parts.join('/');
  const type = isValidStorageKey(key) ? mediaServedHere(key, env().STORAGE_DRIVER) : null;
  if (!type) return new NextResponse(null, { status: 404 });
  const body = await storage().get(key);
  if (!body) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': type,
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
