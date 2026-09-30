'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import type { FormAction } from './forms';
import { Field, FormStatus, SubmitButton } from './forms';

/** `enrollment` is null once 2FA is on (e.g. after the page refreshes following confirmation). */
export function TwoFactorSetup({
  action,
  enrollment,
}: {
  action: FormAction;
  enrollment: { qrSvg: string; secret: string } | null;
}) {
  const t = useTranslations('admin.setup2fa');
  const tAdmin = useTranslations('admin');
  const [state, formAction] = useActionState(action, {});

  if (state.ok && state.secrets) {
    return (
      <section aria-labelledby="recovery-heading" className="space-y-4">
        <h2 id="recovery-heading" className="text-lg font-semibold">
          {t('recoveryHeading')}
        </h2>
        <p className="text-sm text-muted">{t('recoveryIntro')}</p>
        <ul dir="ltr" className="grid grid-cols-2 gap-2 rounded-md border border-line bg-surface p-4 font-mono">
          {state.secrets.map((code) => (
            <li key={code} className="select-all">
              {code}
            </li>
          ))}
        </ul>
        {/* Full navigation so the new session cookie is used for the next page. */}
        <a href={state.next ?? '/admin'} className="inline-block rounded-md bg-accent px-4 py-2 text-sm text-accent-ink">
          {t('continue')}
        </a>
      </section>
    );
  }

  if (!enrollment) {
    return (
      <div className="space-y-4">
        <p className="text-sm">
          {t('heading')}: <strong>{tAdmin('users.enabled')}</strong>
        </p>
        <Link href="/admin" className="inline-block rounded-md bg-accent px-4 py-2 text-sm text-accent-ink">
          {tAdmin('nav.dashboard')}
        </Link>
      </div>
    );
  }

  const { qrSvg, secret } = enrollment;
  return (
    <form action={formAction} className="space-y-4">
      <p className="text-sm text-muted">{t('intro')}</p>
      <div
        className="mx-auto w-48 rounded-md bg-white p-2"
        role="img"
        aria-label="QR"
        dangerouslySetInnerHTML={{ __html: qrSvg }}
      />
      <p className="text-sm">
        {t('manualKey')}{' '}
        <code dir="ltr" className="select-all break-all font-mono">
          {secret}
        </code>
      </p>
      <Field label={t('code')} name="code" autoComplete="one-time-code" inputMode="numeric" dir="ltr" />
      <SubmitButton>{t('submit')}</SubmitButton>
      <FormStatus state={state} />
    </form>
  );
}
