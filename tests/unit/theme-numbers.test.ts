import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { themeKeyByNumber, themeNumber } from '@/theme-registry';

const themesDir = path.resolve(import.meta.dirname, '../../themes');
const numbers = JSON.parse(readFileSync(path.join(themesDir, 'numbers.json'), 'utf8')) as Record<string, number>;

describe('theme numbers', () => {
  it('give every theme folder its own permanent number', () => {
    const folders = readdirSync(themesDir).filter((k) => !k.startsWith('.') && statSync(path.join(themesDir, k)).isDirectory());
    for (const key of folders) expect(numbers[key], `themes/numbers.json has no number for ${key}`).toBeTypeOf('number');
    const values = Object.values(numbers);
    expect(new Set(values).size).toBe(values.length);
  });

  it('look up both ways', () => {
    expect(themeNumber('olive-ring-box')).toBe(1);
    expect(themeKeyByNumber(2)).toBe('zaxo-watercolor');
    expect(themeKeyByNumber(9999)).toBeUndefined();
  });
});
