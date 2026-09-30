import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const base = process.env.APP_URL ?? 'http://localhost:3000';
  const isProduction = process.env.APP_ENV === 'production';
  return {
    // Staging and development are never indexed.
    rules: isProduction
      ? { userAgent: '*', allow: '/', disallow: ['/admin', '/api/', '/i/', '/p/', '/r/'] }
      : { userAgent: '*', disallow: '/' },
    sitemap: isProduction ? `${base}/sitemap.xml` : undefined,
  };
}
