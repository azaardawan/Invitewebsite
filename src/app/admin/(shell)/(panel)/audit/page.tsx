import { and, desc, eq, like, lt, type SQL } from 'drizzle-orm';
import { getFormatter, getTranslations } from 'next-intl/server';
import { db } from '@/server/db/client';
import { adminUsers, auditLogs } from '@/server/db/schema';
import { requireAdmin } from '@/server/auth/guard';

const PAGE_SIZE = 50;

export default async function AuditPage({ searchParams }: PageProps<'/admin/audit'>) {
  await requireAdmin({ permission: 'audit.view' });
  const t = await getTranslations('admin.audit');
  const format = await getFormatter();
  const params = await searchParams;
  const action = typeof params.action === 'string' ? params.action.slice(0, 100) : '';
  const before = typeof params.before === 'string' && /^\d+$/.test(params.before) ? Number(params.before) : null;

  const where: SQL[] = [];
  if (action) where.push(like(auditLogs.action, `${action.replace(/[%_\\]/g, '\\$&')}%`));
  if (before) where.push(lt(auditLogs.id, before));

  const rows = await db()
    .select({ log: auditLogs, actorName: adminUsers.name })
    .from(auditLogs)
    .leftJoin(adminUsers, eq(adminUsers.id, auditLogs.actorAdminId))
    .where(where.length ? and(...where) : undefined)
    .orderBy(desc(auditLogs.id))
    .limit(PAGE_SIZE);

  const last = rows.at(-1);

  return (
    <div className="max-w-5xl space-y-4">
      <h1 className="text-2xl font-semibold">{t('heading')}</h1>
      <p className="text-muted">{t('intro')}</p>
      <form className="flex items-end gap-2" method="get">
        <label className="block">
          <span className="mb-1 block text-sm">{t('filter')}</span>
          <input name="action" defaultValue={action} dir="ltr" className="rounded-md border border-line bg-surface px-3 py-2" />
        </label>
        <button className="rounded-md border border-line bg-surface px-4 py-2 text-sm">{t('apply')}</button>
      </form>

      {rows.length === 0 ? (
        <p className="text-muted">{t('empty')}</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="w-full text-sm">
            <thead className="bg-canvas text-start">
              <tr>
                <th className="px-3 py-2 text-start">{t('time')}</th>
                <th className="px-3 py-2 text-start">{t('actor')}</th>
                <th className="px-3 py-2 text-start">{t('action')}</th>
                <th className="px-3 py-2 text-start">{t('object')}</th>
                <th className="px-3 py-2 text-start">{t('details')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(({ log, actorName }) => (
                <tr key={log.id} className="border-t border-line align-top">
                  <td className="whitespace-nowrap px-3 py-2">{format.dateTime(log.at, 'long')}</td>
                  <td className="px-3 py-2">{actorName ?? t('system')}</td>
                  <td className="px-3 py-2 font-mono" dir="ltr">
                    {log.action}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs" dir="ltr">
                    {log.objectType}
                    {log.objectId ? ` · ${log.objectId.slice(0, 8)}` : ''}
                  </td>
                  <td className="px-3 py-2 text-xs" dir="ltr">
                    {log.before || log.after ? (
                      <code className="break-all">
                        {log.before ? JSON.stringify(log.before) : '∅'} → {log.after ? JSON.stringify(log.after) : '∅'}
                      </code>
                    ) : null}
                    {log.reason ? <p dir="auto">{log.reason}</p> : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {rows.length === PAGE_SIZE && last ? (
        <a
          className="inline-block text-sm text-accent underline"
          href={`/admin/audit?${new URLSearchParams({ ...(action ? { action } : {}), before: String(last.log.id) })}`}
        >
          {t('older')}
        </a>
      ) : null}
    </div>
  );
}
