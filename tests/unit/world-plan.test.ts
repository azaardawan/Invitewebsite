import { describe, expect, it } from 'vitest';
import { floorAt, roomAt, surfaceHeight } from '@/theme-sdk/world3d/plan';
import { PHOTO_COUNT, planFor, tierOf } from '../../themes/pink-dreamhouse/v1/plan';

/** `<World3D>` walking rules, on the Pink Dreamhouse's plan (owner, 2026-11-19). */
describe('walking a 3D world', () => {
  const vvip = planFor('vvip');

  it('climbs the stairs step by step, and never falls into the stairwell or walks under the stairs', () => {
    // Up the stairs from the living room: each step a little higher.
    let y = 0;
    for (let z = 0.65; z <= 3.7; z += 0.2) {
      const next = floorAt(vvip, 0.9, z, y);
      expect(next).not.toBeNull();
      expect(next!).toBeGreaterThanOrEqual(y);
      y = next!;
    }
    expect(y).toBeGreaterThan(3.1);
    expect(floorAt(vvip, 0.9, 4.1, y)).toBeCloseTo(3.35);
    // Downstairs, under the stairs: no floor (the steps are there).
    expect(floorAt(vvip, 0.9, 2.2, 0)).toBeNull();
    // Upstairs, the stairwell: no floor either.
    expect(floorAt(vvip, 1.2, 2.2, 3.35)).toBeNull();
    // A ramp's height between its ends.
    expect(surfaceHeight(vvip.surfaces.find((s) => 'ramp' in s)!, 1, 2.175)).toBeCloseTo(1.675, 2);
  });

  it('keeps the secret suite closed until its door is open', () => {
    expect(floorAt(vvip, 9.2, 2.8, 3.35)).toBeNull();
    expect(floorAt(vvip, 9.2, 2.8, 3.35, new Set(['secretDoor']))).toBeCloseTo(3.35);
    // The cinema next to it is open.
    expect(floorAt(vvip, 7, 3, 3.35)).toBeCloseTo(3.35);
  });

  it('a smaller house has only its own rooms', () => {
    const basic = planFor('basic');
    expect(floorAt(basic, 11, 3, 0)).toBeNull();
    expect(floorAt(basic, 6, 3, 0)).toBe(0);
    expect(basic.photos).toHaveLength(PHOTO_COUNT.basic);
    expect(basic.screens).toHaveLength(0);
    const vip = planFor('vip');
    expect(vip.photos).toHaveLength(PHOTO_COUNT.vip);
    expect(vip.screens).toEqual(['VIDEO_KITCHEN_FRIDGE']);
    expect(floorAt(vip, 7, 3, 3.35)).toBeNull();
    expect(vvip.photos).toHaveLength(PHOTO_COUNT.vvip);
  });

  it('knows the room on each floor', () => {
    expect(roomAt(vvip, 2, 3, 0)?.key).toBe('living');
    expect(roomAt(vvip, 2, 3, 3.35)?.key).toBe('vanity');
    expect(roomAt(vvip, 11, 3, 3.35)?.key).toBe('secret');
  });

  it('a package’s house follows the photos it sells (or its videos without photos)', () => {
    expect(tierOf(6, 0, true)).toBe('basic');
    expect(tierOf(12, 1, true)).toBe('vip');
    expect(tierOf(24, 3, true)).toBe('vvip');
    expect(tierOf(0, 3, false)).toBe('vvip');
    expect(tierOf(0, 0, false)).toBe('basic');
  });
});

describe('a world drawn bigger than its model', () => {
  it('scales every place in the plan, but not the eye height', async () => {
    const { scaledPlan } = await import('@/theme-sdk/world3d/plan');
    const plan = { ...planFor('vvip'), scale: 2 };
    const big = scaledPlan(plan);
    expect(big.eye).toBe(plan.eye);
    expect(big.start.x).toBeCloseTo(plan.start.x * 2);
    expect(floorAt(big, 9.2 * 2, 2.8 * 2, 3.35 * 2, new Set(['secretDoor']))).toBeCloseTo(6.7);
    expect(scaledPlan({ ...plan, scale: 1 })).toEqual({ ...plan, scale: 1 });
  });
});
