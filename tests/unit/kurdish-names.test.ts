import { describe, expect, it } from 'vitest';
import { withKurdishName } from '@/server/catalog/kurdish-names';

const list = {
  عادي: { ckb: 'ئاسایی', bdn: 'ئاسایی', approved: true },
  مميز: { ckb: 'تایبەت', bdn: 'تایبەت', approved: false },
};

describe('Kurdish for names typed in Admin', () => {
  it('fills only the missing dialect from an approved line', () => {
    expect(withKurdishName({ ar: 'عادي', en: 'Normal' }, list)).toEqual({ ar: 'عادي', en: 'Normal', ckb: 'ئاسایی', bdn: 'ئاسایی' });
    expect(withKurdishName({ ar: 'عادي', en: 'Normal', ckb: 'نۆرماڵ', bdn: null }, list)).toEqual({ ar: 'عادي', en: 'Normal', ckb: 'نۆرماڵ', bdn: 'ئاسایی' });
  });

  it("never replaces the owner's Kurdish, and ignores unapproved or unknown names", () => {
    expect(withKurdishName({ ar: 'عادي', en: 'Normal', ckb: 'نۆرماڵ', bdn: 'نۆرماڵ' }, list)).toBeNull();
    expect(withKurdishName({ ar: 'مميز', en: 'VIP' }, list)).toBeNull();
    expect(withKurdishName({ ar: 'ذهبي', en: 'Gold' }, list)).toBeNull();
  });
});
