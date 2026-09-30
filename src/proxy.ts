import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  // Localized storefront only. Admin, API, invitations (/i), previews (/p),
  // receipts (/r), Next internals and files are not locale-routed.
  matcher: ['/((?!admin|api|media|i/|p/|r/|_next|_vercel|.*\\..*).*)'],
};
