import { describe, expect, it } from 'vitest';
import { formatDisplayPrice, formatIqdIn, iqdToUsd } from '@/lib/currency';

describe('display currency', () => {
  it('converts IQD to approximate USD with the owner rate', () => {
    expect(iqdToUsd(131000, 1310)).toBe(100);
    expect(formatDisplayPrice(75000, 'USD', 1310, 'en', 'en-US')).toBe('≈ $57');
    expect(formatDisplayPrice(6550, 'USD', 1310, 'en', 'en-US')).toBe('≈ $5.00');
  });

  it('falls back to IQD when no rate is set or IQD is chosen', () => {
    expect(formatDisplayPrice(75000, 'USD', null, 'en', 'en-US')).toContain('75,000');
    expect(formatDisplayPrice(75000, 'IQD', 1310, 'en', 'en-US')).toContain('IQD');
  });

  it('writes the dinar in the visitor language (Kurdish has its own word)', () => {
    expect(formatIqdIn(25000, 'ckb')).toBe('٢٥٬٠٠٠ دینار');
    expect(formatIqdIn(25000, 'bdn')).toBe('٢٥٬٠٠٠ دینار');
    expect(formatIqdIn(25000, 'ar')).toContain('د.ع');
    expect(formatIqdIn(25000, 'en')).toContain('IQD');
  });
});
