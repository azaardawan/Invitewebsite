'use client';

import { useEffect, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { useRouter } from 'next/navigation';

/** Submit button that shows progress while the WAYL page is being prepared. */
export function PayButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex h-[54px] w-full items-center justify-center rounded-full bg-accent px-8 text-base font-semibold text-accent-ink shadow-[0_10px_22px_rgb(110_31_51/0.25)] transition hover:bg-accent-deep disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

/**
 * After returning from WAYL the redirect proves nothing, so the page re-checks
 * with the server every few seconds until the payment is confirmed (about a
 * minute), then explains that confirmation can take longer.
 */
export function ConfirmingPayment({ confirming, slow }: { confirming: string; slow: string }) {
  const router = useRouter();
  const [tries, setTries] = useState(0);
  const done = tries >= 15;
  useEffect(() => {
    if (done) return;
    const t = setTimeout(() => {
      router.refresh();
      setTries((n) => n + 1);
    }, 4000);
    return () => clearTimeout(t);
  }, [tries, done, router]);
  return (
    <div role="status" className="flex items-center gap-3 rounded-2xl bg-blush px-4 py-4 text-sm">
      {!done ? <span aria-hidden className="size-5 shrink-0 animate-spin rounded-full border-2 border-accent border-t-transparent" /> : null}
      <span>{done ? slow : confirming}</span>
    </div>
  );
}
