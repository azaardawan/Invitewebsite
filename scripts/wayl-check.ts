/**
 * `pnpm wayl:check` — confirms the configured WAYL key works, then creates a
 * 1,000 IQD TEST-mode link, reads it back by reference and cancels it.
 * No money moves. Refuses to run with WAYL_ENV=live.
 */
import { randomBytes } from 'node:crypto';
import { env } from '../src/server/env';
import { waylClient } from '../src/server/payments/wayl';

const e = env();
const client = waylClient();
if (!client) {
  console.error('WAYL_API_KEY is not set in this environment.');
  process.exit(1);
}
if (e.WAYL_ENV !== 'test') {
  console.error('Refusing to create links with WAYL_ENV=live. Use WAYL_ENV=test for this check.');
  process.exit(1);
}
console.log(`API: ${e.WAYL_API_BASE_URL}`);
console.log(`Key valid: ${await client.verifyAuthKey()}`);
const ref = `BAHJA-CHECK-${randomBytes(4).toString('hex').toUpperCase()}`;
const link = await client.createLink({
  referenceId: ref,
  totalIqd: 1000,
  env: 'test',
  label: 'Bahja integration check',
  webhookUrl: `${e.APP_URL.replace(/\/$/, '')}/api/webhooks/wayl`,
  webhookSecret: randomBytes(16).toString('hex'),
  redirectionUrl: `${e.APP_URL.replace(/\/$/, '')}/`,
  linkExpiresIn: '10m',
});
console.log('Created test link:', { referenceId: link.referenceId, status: link.status, total: link.total, url: link.url });
const back = await client.getLink(ref);
console.log('Read back by reference:', back ? { status: back.status, total: back.total, currency: back.currency } : null);
await client.invalidateIfPending(ref);
console.log('After cancel:', (await client.getLink(ref))?.status);
