# Payments (WAYL) runbook

## Configuration

| Variable | Where | Notes |
|---|---|---|
| `WAYL_API_KEY` | hosting env (secret) | Merchant key from the WAYL dashboard. Without it, orders are created and the team collects payment manually. |
| `WAYL_ENV` | hosting env | `test` (no real money) or `live`. Production refuses to start with a key and `test`. |
| `WAYL_API_BASE_URL` | hosting env | Default `https://api.thewayl.com`. |
| `CRON_SECRET` | hosting env (secret) | 32+ random characters, for the reconciliation call. |
| `APP_URL` | hosting env | Must be the public URL (`https://bahjaaa.com`); WAYL sends webhooks and redirects there. |

## Manual mode (no WAYL key)

- Customers confirm their order, then see your payment instructions and a WhatsApp button on their receipt. These are set in Admin → Website settings; the WhatsApp message includes the order number and amount.
- When the money arrives, open Admin → Orders and use **Mark as paid manually** with a reason. The invoice number is assigned and the invitation is published.
- Unpaid orders never expire automatically in manual mode.

## Checks

- `pnpm wayl:check`: verifies the key, creates a 1,000 IQD **test** link, reads it back and cancels it. It refuses to run with `WAYL_ENV=live`.
- `pnpm payments:reconcile`: re-checks open payments and expires unpaid orders past 48 hours. Schedule it every 10 minutes, or call `POST /api/cron/reconcile-payments` with `Authorization: Bearer $CRON_SECRET`.

## Everyday situations

- **A customer paid but the order still says "Awaiting payment".** Open Admin → Orders, find the order and press **Check with WAYL**. If WAYL confirms the payment, the order is marked paid and the invitation is published.
- **The check reports a payment that doesn't match.** The amount or currency reported by WAYL differs from the order. It is not accepted automatically; the difference is shown on the order and recorded in the audit log. Investigate it in the WAYL dashboard.
- **Paid another way (cash or transfer).** Use **Mark as paid manually** with a reason. It needs the `payments.override` permission and is audited.
- **Refunds.** Handle them in the WAYL dashboard for now; in-app refunds come later.

## Going live

1. The WAYL store is verified (links can't be created before that).
2. Set `WAYL_ENV=live`, the live `WAYL_API_KEY` and `APP_URL=https://bahjaaa.com`.
3. Make one real small payment, then check that the receipt shows the invoice and that the invitation link opens.
