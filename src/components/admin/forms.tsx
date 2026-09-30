'use client';

import { useActionState, type ReactNode } from 'react';
import { useFormStatus } from 'react-dom';
import { useTranslations } from 'next-intl';
import type { ActionState } from '@/app/admin/_actions/state';

export type FormAction = (state: ActionState, form: FormData) => Promise<ActionState>;

export function SubmitButton({ children, tone = 'primary' }: { children: ReactNode; tone?: 'primary' | 'secondary' | 'danger' }) {
  const { pending } = useFormStatus();
  const tones = {
    primary: 'bg-accent text-accent-ink',
    secondary: 'border border-line bg-surface text-ink',
    danger: 'border border-danger text-danger bg-surface',
  };
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`rounded-md px-4 py-2 text-sm font-medium disabled:opacity-60 ${tones[tone]}`}
    >
      {children}
    </button>
  );
}

export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  required = true,
  dir,
  inputMode,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  required?: boolean;
  dir?: 'ltr' | 'rtl';
  inputMode?: 'numeric' | 'text' | 'email';
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      <input
        name={name}
        type={type}
        required={required}
        autoComplete={autoComplete}
        dir={dir}
        inputMode={inputMode}
        defaultValue={defaultValue}
        className="w-full rounded-md border border-line bg-surface px-3 py-2 text-base"
      />
    </label>
  );
}

/** Turns `code` or `code (subject)` details into readable text using the readiness problem labels. */
function describeDetail(t: ReturnType<typeof useTranslations<'admin'>>, detail: string) {
  const m = /^([a-zA-Z]+)(?: \((.*)\))?$/.exec(detail);
  const key = `catalog.themes.problems.${m?.[1]}`;
  if (m && t.has(key as never)) return m[2] ? `${t(key as never)}: ${m[2]}` : t(key as never);
  return detail;
}

/** Shows the action's error or success message (translated from `admin.*` keys). */
export function FormStatus({ state }: { state: ActionState }) {
  const t = useTranslations('admin');
  if (state.error) {
    return (
      <div role="alert" className="text-sm text-danger">
        <p>{t(state.error as never)}</p>
        {state.details?.length ? (
          <ul className="mt-1 list-disc ps-5">
            {state.details.map((d) => (
              <li key={d}>{describeDetail(t, d)}</li>
            ))}
          </ul>
        ) : null}
      </div>
    );
  }
  if (state.message && state.ok) {
    return (
      <div role="status" className="text-sm text-success">
        <p>{t(state.message as never)}</p>
        {state.secret ? (
          <code dir="ltr" className="mt-1 block select-all rounded bg-canvas px-2 py-1 font-mono text-base text-ink">
            {state.secret}
          </code>
        ) : null}
      </div>
    );
  }
  return null;
}

/** A form bound to a server action, with inline status. */
export function ActionForm({
  action,
  children,
  className,
  confirmMessage,
}: {
  action: FormAction;
  children: ReactNode;
  className?: string;
  confirmMessage?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <form
      action={formAction}
      className={className}
      onSubmit={(e) => {
        if (confirmMessage && !window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      {children}
      <div className="mt-2" aria-live="polite">
        <FormStatus state={state} />
      </div>
    </form>
  );
}
