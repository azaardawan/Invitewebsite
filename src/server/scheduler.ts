import 'server-only';
import { db } from '@/server/db/client';
import { runHousekeeping } from '@/server/housekeeping';
import { reconcilePayments } from '@/server/payments/service';
import { onlinePaymentsEnabled } from '@/server/payments/wayl';
import { deliverPaidOrders } from '@/server/notify/customer';

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

let delivering = false;
async function deliver() {
  if (delivering) return;
  delivering = true;
  try {
    const r = await deliverPaidOrders(db());
    if (r.delivered) log('scheduler.deliver', { result: r });
  } catch (e) {
    console.error(JSON.stringify({ level: 'error', msg: 'scheduler.deliver_failed', error: String(e) }));
  } finally {
    delivering = false;
  }
}

/**
 * Runs the after-payment delivery now (the customer's WhatsApp messages and the link-preview picture), a few seconds
 * after an order is paid (so the payment's transaction has committed). Does nothing where the scheduler is off (tests).
 */
export function deliverSoon() {
  if (!started) return;
  setTimeout(() => void deliver(), 3_000).unref();
}

/**
 * Background jobs inside the web process (one container, so no separate worker or cron service):
 * housekeeping daily, the WAYL payment safety net every 10 minutes when online payment is on, and the after-payment
 * delivery every minute (it also runs right after each payment). Every job is idempotent, so a restart or a second
 * replica only repeats harmless work.
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
  setInterval(() => void deliver(), MINUTE).unref();
}
