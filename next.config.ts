import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isProd = process.env.NODE_ENV === 'production';

/**
 * Content-Security-Policy (production; dev needs eval for hot reload). Scripts only from this site and
 * Cloudflare Turnstile; Next's inline bootstrap scripts need 'unsafe-inline' until nonces are added.
 * Media/images may come from the R2 CDN, whose host is only known at runtime, hence `https:`.
 * No form-action: paying redirects the form to the payment provider.
 */
const csp = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://challenges.cloudflare.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://challenges.cloudflare.com",
  "frame-src 'self' https://challenges.cloudflare.com",
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
].join('; ');

/**
 * Cafés' virtual tours (`/tour/<slug>`): the 3D model's own pictures are read from `blob:` addresses, and a compressed
 * model is unpacked by a small WebAssembly decoder (meshopt). Only these pages allow them (the later header wins).
 */
const tourCsp = csp
  .replace("connect-src 'self'", "connect-src 'self' blob:")
  .replace("script-src 'self'", "script-src 'self' 'wasm-unsafe-eval'");

const baseSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Same-origin framing is allowed so the storefront/admin can sandbox theme previews in iframes.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  ...(isProd
    ? [
        { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        { key: 'Content-Security-Policy', value: csp },
      ]
    : []),
];


const noIndex = { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@node-rs/argon2'],
  experimental: { globalNotFound: true },
  async redirects() {
    // One address for everything (links, sign-in cookies, SEO): www.<domain> → <domain>.
    return [
      {
        source: '/:path*',
        has: [{ type: 'host', value: 'www\\.(?<domain>.+)' }],
        destination: 'https://:domain/:path*',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      { source: '/:path*', headers: baseSecurityHeaders },
      {
        source: '/admin/:path*',
        headers: [
          noIndex,
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Cache-Control', value: 'no-store' },
        ],
      },
      { source: '/admin', headers: [noIndex, { key: 'X-Frame-Options', value: 'DENY' }, { key: 'Cache-Control', value: 'no-store' }] },
      // Theme previews are shown inside an iframe on our own admin pages (later header wins).
      { source: '/admin/preview/:path*', headers: [{ key: 'X-Frame-Options', value: 'SAMEORIGIN' }] },
      // Customer invitations, personalized previews and private receipts are never indexed.
      { source: '/i/:path*', headers: [noIndex] },
      { source: '/p/:path*', headers: [noIndex] },
      { source: '/r/:path*', headers: [noIndex] },
      { source: '/t/:path*', headers: [noIndex] },
      // A private tour's link carries its code: never sent on to the sites its buttons open.
      {
        source: '/tour/:path*',
        headers: [{ key: 'Referrer-Policy', value: 'no-referrer' }, ...(isProd ? [{ key: 'Content-Security-Policy', value: tourCsp }] : [])],
      },
      // A customer's order screens carry their private preview token in the URL.
      { source: '/order/:path*', headers: [noIndex, { key: 'Cache-Control', value: 'no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
      { source: '/:locale(en|ckb|bdn)/order/:path*', headers: [noIndex, { key: 'Cache-Control', value: 'no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
    ];
  },
};

export default withNextIntl(nextConfig);
