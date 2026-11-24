import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { notesFor, NOTES, slotOf, type Menu } from '@/components/tour/menu';

/** KOUP's menu in its tour (owner, 2026-11-24): from koupofficial.com/azadi, with how each drink is made. */
const menu = JSON.parse(readFileSync(join(process.cwd(), 'tours/koupup/menu.json'), 'utf8')) as Menu;

describe("KOUP's menu", () => {
  it('has every item of the café, each in one of its categories, at a price in dinars', () => {
    expect(menu.items.length).toBe(54);
    const cats = new Set(menu.categories.map((c) => c.id));
    for (const i of menu.items) {
      expect(cats.has(i.cat)).toBe(true);
      expect(i.price % 250).toBe(0);
      expect(i.price).toBeGreaterThan(0);
    }
    // a few as the café prices them
    const price = (name: string) => menu.items.find((i) => i.name === name)?.price;
    expect(price('Single Espresso')).toBe(2500);
    expect(price('Caramel Latte')).toBe(4500);
    expect(price('Vanilia Latte Diet')).toBe(5500);
    expect(price('Iced Matcha Flavored Latte')).toBe(6500);
    expect(price('Cookies')).toBe(3000);
  });

  it('makes every drink with what the bar has, in a cup of its kind, filling it in order', () => {
    for (const i of menu.items) {
      if (i.cup === 'cookie') {
        expect(i.make).toEqual([]);
        continue;
      }
      expect(['espresso', 'hot', 'iced']).toContain(i.cup);
      expect(i.make.length).toBeGreaterThan(0);
      let level = 0;
      for (const s of i.make) {
        if ('b' in s && s.b) expect(menu.bottles[s.b], `${i.name}: ${s.b}`).toBeTruthy();
        if ('to' in s && !(s.s === 'syrup' && s.into === 'jug')) {
          // each pour fills the cup further (never past its rim)
          expect(s.to, `${i.name}`).toBeGreaterThanOrEqual(level);
          expect(s.to).toBeLessThanOrEqual(1);
          level = s.to;
        }
        if ('c' in s && s.c) expect(s.c).toMatch(/^#[0-9a-f]{6}$/i);
      }
      // a drink ends up nearly full
      expect(level, i.name).toBeGreaterThan(0.5);
      // iced drinks are cold: no steam, no hot water
      if (i.cup === 'iced') expect(i.make.some((s) => s.s === 'steam' || s.s === 'water')).toBe(false);
    }
  });

  it('shows every item with its own photo', () => {
    const cells = menu.items.map((i) => i.photo);
    expect(new Set(cells).size).toBe(cells.length);
    expect(Math.max(...cells)).toBeLessThan(menu.cols * Math.ceil(menu.items.length / menu.cols));
  });

  it('puts drinks in one hand and something to eat in the other', () => {
    expect(slotOf(menu.items.find((i) => i.cup === 'cookie')!)).toBe('cookie');
    expect(slotOf(menu.items.find((i) => i.cup === 'iced')!)).toBe('coffee');
  });
});

describe('paying in dinars', () => {
  it('pays the exact price with the fewest notes', () => {
    expect(notesFor(4500)).toEqual([1000, 1000, 1000, 1000, 500]);
    expect(notesFor(5000)).toEqual([5000]);
    expect(notesFor(6500)).toEqual([5000, 1000, 500]);
    expect(notesFor(2500)).toEqual([1000, 1000, 500]);
    for (const i of menu.items) expect(notesFor(i.price).reduce((a, b) => a + b, 0)).toBe(i.price);
    for (const n of notesFor(37750)) expect(NOTES).toContain(n);
  });
});
