'use client';

import { useState } from 'react';

/** Copy link, WhatsApp share/save and print. WhatsApp links open the app with a prepared message (no automated sending). */
export function ReceiptActions({
  url,
  shareText,
  confirmText,
  labels,
}: {
  url: string | null;
  shareText: string;
  confirmText: string;
  labels: { copyLink: string; copied: string; shareWhatsApp: string; saveWhatsApp: string; openInvitation: string; print: string };
}) {
  const [copied, setCopied] = useState(false);
  const btn = 'inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-medium';
  return (
    <div className="flex flex-wrap gap-3 print:hidden">
      {url ? (
        <>
          <button
            type="button"
            className={`${btn} border border-accent text-accent`}
            onClick={async () => {
              await navigator.clipboard.writeText(url);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            }}
          >
            {copied ? labels.copied : labels.copyLink}
          </button>
          <a className={`${btn} bg-accent text-accent-ink`} href={`https://wa.me/?text=${encodeURIComponent(shareText)}`} target="_blank" rel="noopener">
            {labels.shareWhatsApp}
          </a>
          <a className={`${btn} border border-line`} href={`https://wa.me/?text=${encodeURIComponent(confirmText)}`} target="_blank" rel="noopener">
            {labels.saveWhatsApp}
          </a>
          <a className={`${btn} border border-line`} href={url} target="_blank" rel="noopener">
            {labels.openInvitation}
          </a>
        </>
      ) : null}
      <button type="button" className={`${btn} border border-line`} onClick={() => window.print()}>
        {labels.print}
      </button>
    </div>
  );
}
