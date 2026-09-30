import type { ReactNode } from 'react';

export function AuthCard({ title, brand, children }: { title: string; brand: string; children: ReactNode }) {
  return (
    <main className="flex min-h-dvh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <p className="mb-6 text-center text-lg font-semibold text-accent">{brand}</p>
        <section className="rounded-xl border border-line bg-surface p-6 shadow-sm">
          <h1 className="mb-4 text-xl font-semibold">{title}</h1>
          {children}
        </section>
      </div>
    </main>
  );
}
