'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Random id for this browser tab session (sessionStorage; not a cookie, never personal data). */
function sessionId(): { id: string; isNew: boolean } {
  try {
    const existing = sessionStorage.getItem('bahja_sid');
    if (existing) return { id: existing, isNew: false };
    const id = crypto.randomUUID().replace(/-/g, '');
    sessionStorage.setItem('bahja_sid', id);
    return { id, isNew: true };
  } catch {
    return { id: crypto.randomUUID().replace(/-/g, ''), isNew: true };
  }
}

function send(payload: Record<string, string | undefined>) {
  try {
    const body = JSON.stringify(payload);
    if (!navigator.sendBeacon?.('/api/e', new Blob([body], { type: 'application/json' }))) {
      void fetch('/api/e', { method: 'POST', body, keepalive: true }).catch(() => {});
    }
  } catch {
    // Analytics must never affect the page.
  }
}

/** Storefront page views (one per navigation); theme pages also report which theme. */
export function PageViewBeacon({ locale }: { locale: string }) {
  const pathname = usePathname();
  useEffect(() => {
    const { id, isNew } = sessionId();
    const path = pathname.replace(/^\/(en|ckb|bdn)(?=\/|$)/, '') || '/';
    const theme = /^\/themes\/([a-z0-9-]+)$/.exec(path)?.[1];
    send({ n: 'page_view', s: id, l: locale, r: isNew ? document.referrer || undefined : undefined, t: theme });
  }, [pathname, locale]);
  return null;
}

/** One "opened" event per guest visit to a live invitation. */
export function InvitationOpenBeacon({ publicId, locale }: { publicId: string; locale: string }) {
  useEffect(() => {
    const { id, isNew } = sessionId();
    send({ n: 'invitation_open', s: id, l: locale, i: publicId, r: isNew ? document.referrer || undefined : undefined });
  }, [publicId, locale]);
  return null;
}
