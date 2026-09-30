import { getFormatter, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { requireAdmin } from '@/server/auth/guard';
import { listAdminUsers, listRoles } from '@/server/admin/users';
import { ActionForm, Field, SubmitButton } from '@/components/admin/forms';
import {
  createUserAction,
  resetPasswordAction,
  resetTwoFactorAction,
  saveRolesAction,
  setStatusAction,
} from '../../_actions/users';

export default async function UsersPage() {
  const { user: me } = await requireAdmin({ permission: 'users.manage' });
  const t = await getTranslations('admin');
  const format = await getFormatter();
  const [users, roles] = await Promise.all([listAdminUsers(db()), listRoles(db())]);
  const roleLabel = (key: string) =>
    ['OWNER', 'MANAGER', 'DESIGNER', 'SUPPORT'].includes(key) ? t(`roles.${key}` as never) : key;
  const confirm = t('users.confirm');

  return (
    <div className="max-w-5xl space-y-8">
      <h1 className="text-2xl font-semibold">{t('users.heading')}</h1>

      <ul className="space-y-4">
        {users.map((u) => (
          <li key={u.id} className="rounded-xl border border-line bg-surface p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-medium">
                {u.name} {u.id === me.id ? <span className="text-muted">{t('users.you')}</span> : null}
              </p>
              <p className="text-sm text-muted" dir="ltr">
                {u.email}
              </p>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-2 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-muted">{t('users.status')}</dt>
                <dd>{u.status === 'ACTIVE' ? t('users.active') : t('users.disabled')}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('users.twoFactor')}</dt>
                <dd>{u.totpEnabledAt ? t('users.enabled') : t('users.notEnabled')}</dd>
              </div>
              <div>
                <dt className="text-muted">{t('users.lastLogin')}</dt>
                <dd>{u.lastLoginAt ? format.dateTime(u.lastLoginAt, 'long') : t('users.never')}</dd>
              </div>
            </dl>

            <details className="mt-3">
              <summary className="cursor-pointer text-sm text-accent">
                {`${t('users.roles')}: ${u.roleKeys.map(roleLabel).join('، ')}`}
              </summary>
              <div className="mt-3 space-y-4">
                <ActionForm action={saveRolesAction} confirmMessage={confirm} className="space-y-2">
                  <input type="hidden" name="userId" value={u.id} />
                  <fieldset className="flex flex-wrap gap-4">
                    <legend className="sr-only">{t('users.roles')}</legend>
                    {roles.map((r) => (
                      <label key={r.id} className="flex items-center gap-2 text-sm">
                        <input type="checkbox" name="roles" value={r.key} defaultChecked={u.roleKeys.includes(r.key)} />
                        {roleLabel(r.key)}
                      </label>
                    ))}
                  </fieldset>
                  <Field label={t('users.reason')} name="reason" required={false} />
                  <SubmitButton tone="secondary">{t('users.saveRoles')}</SubmitButton>
                </ActionForm>

                {u.id !== me.id ? (
                  <div className="flex flex-wrap gap-3">
                    <ActionForm action={setStatusAction} confirmMessage={confirm}>
                      <input type="hidden" name="userId" value={u.id} />
                      <input type="hidden" name="status" value={u.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE'} />
                      <SubmitButton tone={u.status === 'ACTIVE' ? 'danger' : 'secondary'}>
                        {u.status === 'ACTIVE' ? t('users.disable') : t('users.enable')}
                      </SubmitButton>
                    </ActionForm>
                    <ActionForm action={resetTwoFactorAction} confirmMessage={confirm}>
                      <input type="hidden" name="userId" value={u.id} />
                      <SubmitButton tone="secondary">{t('users.reset2fa')}</SubmitButton>
                    </ActionForm>
                    <ActionForm action={resetPasswordAction} confirmMessage={confirm}>
                      <input type="hidden" name="userId" value={u.id} />
                      <SubmitButton tone="secondary">{t('users.resetPassword')}</SubmitButton>
                    </ActionForm>
                  </div>
                ) : null}
              </div>
            </details>
          </li>
        ))}
      </ul>

      <section aria-labelledby="create-user" className="rounded-xl border border-line bg-surface p-4">
        <h2 id="create-user" className="mb-4 text-lg font-semibold">
          {t('users.create')}
        </h2>
        <ActionForm action={createUserAction} className="max-w-md space-y-4">
          <Field label={t('users.name')} name="name" autoComplete="off" />
          <Field label={t('users.email')} name="email" type="email" autoComplete="off" dir="ltr" />
          <fieldset className="flex flex-wrap gap-4">
            <legend className="mb-1 text-sm font-medium">{t('users.roles')}</legend>
            {roles.map((r) => (
              <label key={r.id} className="flex items-center gap-2 text-sm">
                <input type="checkbox" name="roles" value={r.key} />
                {roleLabel(r.key)}
              </label>
            ))}
          </fieldset>
          <p className="text-xs text-muted">{t('users.createdHint')}</p>
          <SubmitButton>{t('users.createSubmit')}</SubmitButton>
        </ActionForm>
      </section>
    </div>
  );
}
