import type { ReactNode } from 'react';
import { ActionForm, SubmitButton, type FormAction } from './forms';

/** Up/down buttons for reorderable lists (accessible alternative to drag-and-drop). */
export function MoveButtons({
  action,
  id,
  labels,
  extra,
}: {
  action: FormAction;
  id: string;
  labels: { up: string; down: string };
  extra?: Record<string, string>;
}) {
  return (
    <div className="flex gap-1">
      {(['up', 'down'] as const).map((d) => (
        <ActionForm key={d} action={action}>
          <input type="hidden" name="id" value={id} />
          <input type="hidden" name="direction" value={d} />
          {Object.entries(extra ?? {}).map(([k, v]) => (
            <input key={k} type="hidden" name={k} value={v} />
          ))}
          <SubmitButton tone="secondary">
            <span aria-hidden>{d === 'up' ? '↑' : '↓'}</span>
            <span className="sr-only">{labels[d]}</span>
          </SubmitButton>
        </ActionForm>
      ))}
    </div>
  );
}

const TONES: Record<string, string> = {
  ACTIVE: 'bg-success/10 text-success',
  READY_FOR_REVIEW: 'bg-accent/10 text-accent',
  DEVELOPMENT: 'bg-line text-ink',
  ARCHIVED: 'bg-line text-muted',
};

export function Badge({ status, children }: { status: string; children: ReactNode }) {
  return <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${TONES[status] ?? 'bg-line'}`}>{children}</span>;
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-line bg-surface p-4 ${className}`}>{children}</section>;
}

export function formatIqd(amount: number, locale: string) {
  return new Intl.NumberFormat(locale === 'ar' ? 'ar-IQ' : 'en-US', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount);
}
