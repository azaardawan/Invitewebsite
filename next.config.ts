import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const isProd = process.env.NODE_ENV === 'production';

const baseSecurityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Same-origin framing is allowed so the storefront/admin can sandbox theme previews in iframes.
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  ...(isProd
    ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
    : []),
];

const noIndex = { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' };

const nextConfig: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ['@node-rs/argon2'],
  experimental: { globalNotFound: true },
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
      // A customer's order screens carry their private preview token in the URL.
      { source: '/order/:path*', headers: [noIndex, { key: 'Cache-Control', value: 'no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
      { source: '/:locale(en|ckb|bdn)/order/:path*', headers: [noIndex, { key: 'Cache-Control', value: 'no-store' }, { key: 'Referrer-Policy', value: 'no-referrer' }] },
    ];
  },
};

export default withNextIntl(nextConfig);
