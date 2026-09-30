'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';

type State = { error?: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

const inputCls =
  'w-full rounded-2xl border border-line bg-surface px-4 py-3.5 text-base text-ink outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/15 aria-[invalid=true]:border-danger';

/** Contact details + terms, then the order is created (and payment follows, M6). */
export function CheckoutForm({
  action,
  token,
  idempotencyKey,
}: {
  action: (prev: State, form: FormData) => Promise<State>;
  token: string;
  idempotencyKey: string;
}) {
  const t = useTranslations('store');
  const [state, formAction, pending] = useActionState(action, {});
  const v = state.values ?? {};
  const fe = state.fieldErrors ?? {};
  const field = (name: 'name' | 'phone' | 'email', props: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div className="flex flex-col gap-2">
      <label htmlFor={`c-${name}`} className="text-[15px] font-medium text-heading">
        {t(name)}
      </label>
      <input
        id={`c-${name}`}
        name={name}
        required
        defaultValue={v[name] ?? ''}
        aria-invalid={fe[name] ? true : undefined}
        className={inputCls}
        {...props}
      />
      {fe[name] ? <p className="text-sm text-danger">{t(`fieldErrors.${fe[name]}` as 'fieldErrors.required')}</p> : null}
    </div>
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="token" value={token} />
      <input type="hidden" name="idempotencyKey" value={idempotencyKey} />
      {state.error ? (
        <p role="alert" className="rounded-2xl bg-danger/10 px-4 py-3 text-sm text-danger">
          {t(state.error as 'errors.generic')}
        </p>
      ) : null}
      {field('name', { type: 'text', autoComplete: 'name', minLength: 2, maxLength: 80, dir: 'auto' })}
      {field('phone', { type: 'tel', autoComplete: 'tel', inputMode: 'tel', dir: 'ltr', placeholder: '07XX XXX XXXX' })}
      {field('email', { type: 'email', autoComplete: 'email', dir: 'ltr', maxLength: 254 })}
      <label className="flex items-start gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="terms" required className="mt-1 size-5 shrink-0 accent-[#6e1f33]" />
        <span>{t('acceptTerms')}</span>
      </label>
      <button
        type="submit"
        disabled={pending}
        className="inline-flex h-[56px] items-center justify-center rounded-full bg-accent px-9 text-base font-semibold text-accent-ink shadow-[0_10px_22px_rgb(110_31_51/0.25)] transition hover:bg-accent-deep disabled:opacity-60"
      >
        {pending ? t('placing') : t('placeOrder')}
      </button>
      <p className="text-sm leading-relaxed text-muted">{t('paymentSoon')}</p>
    </form>
  );
}
