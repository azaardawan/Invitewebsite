/**
 * Stand-in for the WAYL API during e2e tests, following the official spec
 * (docs/vendor/wayl-openapi.v1.json): create/read/invalidate links, plus a
 * fake hosted payment page that "pays", sends the signed webhook and
 * redirects back like WAYL does.
 */
import { createHmac } from 'node:crypto';
import { createServer } from 'node:http';

const PORT = Number(process.env.WAYL_MOCK_PORT ?? 3101);
type Link = { referenceId: string; id: string; code: string; total: number; currency: string; status: string; completedAt: string | null; createdAt: string; webhookUrl: string; webhookSecret: string; redirectionUrl: string; env: string };
const byRef = new Map<string, Link>();
const byCode = new Map<string, Link>();
let n = 0;

const view = (l: Link) => ({
  referenceId: l.referenceId,
  id: l.id,
  code: l.code,
  total: String(l.total),
  currency: l.currency,
  status: l.status,
  paymentMethod: l.status === 'Complete' ? 'card' : null,
  completedAt: l.completedAt,
  createdAt: l.createdAt,
  updatedAt: new Date().toISOString(),
  url: `http://localhost:${PORT}/pay/${l.code}`,
  webhookUrl: l.webhookUrl,
  redirectionUrl: l.redirectionUrl,
});

function body(req: import('node:http').IncomingMessage): Promise<string> {
  return new Promise((resolve) => {
    let b = '';
    req.on('data', (c) => (b += c));
    req.on('end', () => resolve(b));
  });
}

createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`);
  const json = (status: number, data: unknown) => {
    res.writeHead(status, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data));
  };
  if (url.pathname === '/health') return json(200, { ok: true });

  if (url.pathname.startsWith('/api/')) {
    if (req.headers['x-wayl-authentication'] !== 'mock-key') return json(401, { message: 'Unauthorized' });
    if (url.pathname === '/api/v1/verify-auth-key') return json(200, { data: {}, message: 'ok' });
    if (req.method === 'POST' && url.pathname === '/api/v1/links') {
      const i = JSON.parse(await body(req));
      if (byRef.has(i.referenceId)) return json(400, { message: 'referenceId must be unique' });
      const l: Link = { referenceId: i.referenceId, id: `lnk_${++n}`, code: `C${n}${Math.random().toString(36).slice(2, 8)}`, total: i.total, currency: i.currency, status: 'Created', completedAt: null, createdAt: new Date().toISOString(), webhookUrl: i.webhookUrl, webhookSecret: i.webhookSecret, redirectionUrl: i.redirectionUrl, env: i.env };
      byRef.set(l.referenceId, l);
      byCode.set(l.code, l);
      return json(201, { data: view(l), message: 'created' });
    }
    const m = url.pathname.match(/^\/api\/v1\/links\/([^/]+)(\/invalidate-if-pending)?$/);
    if (m) {
      const l = byRef.get(decodeURIComponent(m[1]!));
      if (!l) return json(404, { message: 'Not found' });
      if (m[2] && req.method === 'POST') {
        if (l.status === 'Created' || l.status === 'Pending') l.status = 'Cancelled';
        return json(201, { data: view(l), message: 'ok' });
      }
      return json(200, { data: view(l), message: 'ok' });
    }
    return json(404, { message: 'Not found' });
  }

  const pay = url.pathname.match(/^\/pay\/([^/]+)$/);
  const l = pay ? byCode.get(pay[1]!) : undefined;
  if (pay && l && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(`<!doctype html><title>WAYL (mock)</title><h1>WAYL test payment</h1><p>${l.total} IQD · ${l.referenceId}</p>
      <form method="post"><button name="result" value="pay">Pay (mock)</button> <button name="result" value="cancel">Cancel (mock)</button></form>`);
  }
  if (pay && l && req.method === 'POST') {
    const result = new URLSearchParams(await body(req)).get('result');
    if (result === 'pay' && l.status !== 'Cancelled') {
      l.status = 'Complete';
      l.completedAt = new Date().toISOString();
      const raw = JSON.stringify({ ...view(l), event: 'order.completed' });
      const sig = createHmac('sha256', l.webhookSecret).update(raw).digest('hex');
      await fetch(l.webhookUrl, { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-wayl-signature-256': sig }, body: raw }).catch(() => {});
      const back = new URL(l.redirectionUrl);
      back.searchParams.set('referenceId', l.referenceId);
      back.searchParams.set('orderid', l.id);
      res.writeHead(303, { Location: back.toString() });
      return res.end();
    }
    res.writeHead(303, { Location: l.redirectionUrl });
    return res.end();
  }
  res.writeHead(404);
  res.end();
}).listen(PORT, () => console.log(`WAYL mock on ${PORT}`));
