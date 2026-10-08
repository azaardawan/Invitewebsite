/**
 * Runs first in the container. If settings are missing (e.g. Railway's first
 * automatic deploy, before variables are added), prints a plain list of what
 * to add instead of a stack trace, and stops.
 */
import { env } from '../src/server/env';

try {
  const e = env();
  console.log('[check-env] Settings OK.');
  // Optional extras that are typed but unusable are switched off rather than stopping the site; say so.
  if ((process.env.OWNER_WHATSAPP_PHONE || process.env.CALLMEBOT_API_KEY) && !(e.OWNER_WHATSAPP_PHONE && e.CALLMEBOT_API_KEY)) {
    // Say which one (never the values): missing, or present but not usable.
    const why = (name: 'OWNER_WHATSAPP_PHONE' | 'CALLMEBOT_API_KEY') => (!process.env[name]?.trim() ? `${name} is missing` : !e[name] ? `${name} is not usable` : null);
    const problems = [why('OWNER_WHATSAPP_PHONE'), why('CALLMEBOT_API_KEY')].filter(Boolean).join('; ');
    console.warn(
      `[check-env] WhatsApp notices to the owner are OFF (${problems}). Set the phone with its country code (e.g. +9647701234567) and the key CallMeBot sent you.`,
    );
  }
} catch (e) {
  console.error('\n================ Bahja cannot start yet ================');
  console.error((e as Error).message);
  if (!process.env.DATABASE_URL) console.error('  DATABASE_URL: add a PostgreSQL database to the project, then set DATABASE_URL=${{Postgres.DATABASE_URL}}');
  console.error('Add these in Railway → your service → Variables (see docs/runbooks/deploy.md), then redeploy.');
  console.error('=========================================================\n');
  process.exit(1);
}
