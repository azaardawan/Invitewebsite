'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

/** The couple's «remove» on one guest photo (asks first). */
export function RemoveGuestPhoto({ url, label, confirm }: { url: string; label: string; confirm: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      aria-label={label}
      onClick={async () => {
        if (!window.confirm(confirm)) return;
        setBusy(true);
        const res = await fetch(url, { method: 'DELETE' });
        setBusy(false);
        if (res.ok) router.refresh();
      }}
      className="absolute top-1 end-1 flex size-7 items-center justify-center rounded-full bg-white text-accent shadow disabled:opacity-50"
    >
      ×
    </button>
  );
}
