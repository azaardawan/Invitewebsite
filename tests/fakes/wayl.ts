import type { CreateLinkInput, WaylClient, WaylLink } from '@/server/payments/wayl';
import { WaylError } from '@/server/payments/wayl';

type Stored = WaylLink & { input: CreateLinkInput };

/** In-memory WAYL with the same behaviour the platform relies on. */
export function fakeWayl() {
  const links = new Map<string, Stored>();
  let n = 0;
  let failNextCreate: number | null = null;
  const view = (s: Stored): WaylLink => ({ referenceId: s.referenceId, id: s.id, total: s.total, currency: s.currency, status: s.status, url: s.url, completedAt: s.completedAt, raw: { data: { ...s, input: undefined } } });
  const client: WaylClient = {
    async createLink(input) {
      if (failNextCreate !== null) {
        const status = failNextCreate;
        failNextCreate = null;
        throw new WaylError('fake failure', status || null);
      }
      if (links.has(input.referenceId)) throw new WaylError('duplicate referenceId', 409);
      const s: Stored = { referenceId: input.referenceId, id: `lnk_${++n}`, total: input.totalIqd, currency: 'IQD', status: 'Created', url: `https://pay.test/${n}`, completedAt: null, raw: null, input };
      links.set(input.referenceId, s);
      return view(s);
    },
    async getLink(ref) {
      const s = links.get(ref);
      return s ? view(s) : null;
    },
    async invalidateIfPending(ref) {
      const s = links.get(ref);
      if (s && (s.status === 'Created' || s.status === 'Pending')) s.status = 'Cancelled';
    },
    async verifyAuthKey() {
      return true;
    },
  };
  return {
    client,
    links,
    pay(ref: string, patch: Partial<Pick<WaylLink, 'total' | 'currency'>> = {}) {
      const s = links.get(ref)!;
      Object.assign(s, { status: 'Complete', completedAt: new Date().toISOString() }, patch);
    },
    /** 0 = unreachable, otherwise an HTTP status. */
    failNextCreate(status: number) {
      failNextCreate = status;
    },
  };
}
