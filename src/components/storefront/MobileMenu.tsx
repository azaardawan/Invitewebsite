'use client';

import { useEffect, useState } from 'react';
import { Link } from '@/i18n/navigation';
import { CurrencySwitcher } from './currency';

/** Full-screen menu for phones. Closes on Escape and after choosing a link. */
export function MobileMenu({ links, labels }: { links: { href: string; label: string }[]; labels: { menu: string; close: string; brand: string } }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open]);
  return (
    <>
      <button
        type="button"
        aria-label={labels.menu}
        aria-expanded={open}
        onClick={() => setOpen(true)}
        className="flex size-11 items-center justify-center rounded-full lg:hidden"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </svg>
      </button>
      {open ? (
        <div role="dialog" aria-modal="true" aria-label={labels.menu} className="fixed inset-0 z-50 flex flex-col bg-canvas px-6 py-5">
          <button
            type="button"
            aria-label={labels.close}
            onClick={() => setOpen(false)}
            className="flex size-11 items-center justify-center self-end rounded-full"
            autoFocus
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
          <nav className="mt-10 flex flex-col gap-2">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-display py-3 text-4xl text-heading">
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="mt-8">
            <CurrencySwitcher />
          </div>
          {/* The brand name, as in the header. */}
          <Link href="/" onClick={() => setOpen(false)} className="font-display mt-auto self-center pb-4 text-[44px] leading-none font-bold text-accent">
            {labels.brand}
          </Link>
        </div>
      ) : null}
    </>
  );
}
