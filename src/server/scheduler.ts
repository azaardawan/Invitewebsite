import 'server-only';
import { db } from '@/server/db/client';
import { runHousekeeping } from '@/server/housekeeping';
import { reconcilePayments } from '@/server/payments/service';
import { onlinePaymentsEnabled } from '@/server/payments/wayl';

const MINUTE = 60_000;
let started = false;

function log(msg: string, extra: Record<string, unknown> = {}) {
  console.log(JSON.stringify({ level: 'info', msg, ...extra }));
}

async function guarded(name: string, fn: () => Promise<unknown>) {
  try {
    log(`scheduler.${name}`, { result: await fn() });
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', msg: `scheduler.${name}_failed`, error: String(e) }));
  }
}

/**
 * Background jobs inside the web process (one container, so no separate worker or cron service):
 * housekeeping daily, and the WAYL payment safety net every 10 minutes when online payment is on.
 * Every job is idempotent, so a restart or a second replica only repeats harmless work.
 */
export function startScheduler() {
  if (started || process.env.DISABLE_SCHEDULER === '1') return;
  started = true;
  const housekeeping = () => guarded('housekeeping', () => runHousekeeping(db()));
  setTimeout(housekeeping, 2 * MINUTE).unref();
  setInterval(housekeeping, 24 * 60 * MINUTE).unref();
  setInterval(() => {
    if (onlinePaymentsEnabled()) void guarded('reconcile', () => reconcilePayments(db()));
  }, 10 * MINUTE).unref();
}
