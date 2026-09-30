/** `pnpm payments:reconcile` — the same safety net as the cron endpoint, from a shell or a scheduled job. */
import { closeDb, db } from '../src/server/db/client';
import { reconcilePayments } from '../src/server/payments/service';

try {
  console.log(JSON.stringify(await reconcilePayments(db())));
} finally {
  await closeDb();
}
