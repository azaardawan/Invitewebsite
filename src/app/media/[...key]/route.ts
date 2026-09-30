import { NextResponse } from 'next/server';
import { env } from '@/server/env';
import { isValidStorageKey, storage } from '@/server/storage';

const TYPES: Record<string, string> = { webp: 'image/webp', mp3: 'audio/mpeg' };

/**
 * Serves locally stored media in development only. In staging/production
 * media is served from the CDN domain and this route returns 404.
 * (PDF documents are private and never served here.)
 */
export async function GET(_req: Request, ctx: RouteContext<'/media/[...key]'>) {
  const { key: parts } = await ctx.params;
  const key = parts.join('/');
  const ext = key.split('.').pop() ?? '';
  if (env().STORAGE_DRIVER !== 'local' || !isValidStorageKey(key) || !TYPES[ext]) {
    return new NextResponse(null, { status: 404 });
  }
  const body = await storage().get(key);
  if (!body) return new NextResponse(null, { status: 404 });
  return new NextResponse(new Uint8Array(body), {
    headers: {
      'Content-Type': TYPES[ext],
      'Content-Length': String(body.byteLength),
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
