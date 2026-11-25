import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { GAP, fingerPoints, fitGrip, holdIn, surfaceDistance, thumbPoints, type GripShape, type Hold } from '@/components/tour/grip';
import { holdingQuat } from '@/components/tour/character';

/** Hands that fit what they hold (owner, 2026-11-25): each finger stops at the surface, a few millimetres off it. */
const CUPS: Record<string, GripShape> = {
  espresso: { type: 'cyl', r0: 0.022, r1: 0.03, h: 0.058, hold: 0.058 * 0.48 },
  hot: { type: 'cyl', r0: 0.03, r1: 0.045, h: 0.11, hold: 0.11 * 0.48 },
  iced: { type: 'cyl', r0: 0.032, r1: 0.047, h: 0.13, hold: 0.13 * 0.48 },
  pitcher: { type: 'cyl', r0: 0.04, r1: 0.04, h: 0.06, hold: 0.05 },
  bottle: { type: 'cyl', r0: 0.032, r1: 0.032, h: 0.17, hold: 0.135 },
  jar: { type: 'cyl', r0: 0.045, r1: 0.045, h: 0.1, hold: 0.065 },
};

const least = (shape: GripShape, fit: ReturnType<typeof fitGrip>, sx: number, n?: Hold) => {
  let worst = Infinity;
  const all = [...fit.f.map((f, i) => fingerPoints(sx, i, f[0], f[1])), thumbPoints(sx, fit.t[0], fit.t[1], fit.ts)];
  for (const chain of all) for (const x of chain) worst = Math.min(worst, surfaceDistance(shape, fit.socket, x.p, n) - x.r);
  return worst;
};

describe('fitted grips', () => {
  for (const [name, shape] of Object.entries(CUPS))
    for (const sx of [1, -1])
      it(`${name} (${sx === 1 ? 'left' : 'right'} hand): no finger inside, the fingers close on it`, () => {
        const fit = fitGrip(sx, shape);
        expect(least(shape, fit, sx)).toBeGreaterThanOrEqual(GAP - 1e-6);
        // the fingers curl (they hold it), the palm sits against it
        for (const f of fit.f) expect(f[0] + f[1]).toBeGreaterThan(0.5);
        expect(Math.abs(fit.socket.x)).toBeLessThan(0.016 + (shape.type === 'cyl' ? shape.r1 : 0) + 0.012);
      });

  it('closes tighter on a small cup than on a wide one, and puts a wide one further from the palm', () => {
    const small = fitGrip(-1, CUPS.espresso!),
      wide = fitGrip(-1, CUPS.iced!);
    expect(small.f[1]![0] + small.f[1]![1]).toBeGreaterThan(wide.f[1]![0] + wide.f[1]![1]);
    expect(Math.abs(wide.socket.x)).toBeGreaterThan(Math.abs(small.socket.x));
  });

  it('pinches a cookie and notes between the thumb and fingers, no finger in them', () => {
    for (const sx of [1, -1])
      for (const [t, hold] of [
        [0.011, -0.03],
        [0.005, 0.012],
      ] as const) {
        const shape: GripShape = { type: 'slab', t, R: 0.045 };
        // a staff hand (turned as `holdingQuat`) holding it upright, facing ahead
        const how = holdIn(holdingQuat(sx, 'cookie'), new THREE.Quaternion(), new THREE.Vector3(0, hold, 0));
        const fit = fitGrip(sx, shape, how);
        expect(least(shape, fit, sx, how)).toBeGreaterThanOrEqual(GAP - 1e-6);
        if (process.env.GRIP_PRINT) process.stderr.write(`slab ${t} ${sx} ${fit.f.map((f) => f.map((x) => x.toFixed(2)).join('/')).join(' ')} thumb ${fit.t.map((x) => x.toFixed(2)).join('/')} least ${least(shape, fit, sx, how).toFixed(4)}\n`);
      }
  });
});

if (process.env.GRIP_PRINT)
  for (const [name, shape] of Object.entries(CUPS)) {
    const fit = fitGrip(-1, shape);
    console.log(name, fit.socket.toArray().map((x) => x.toFixed(4)), fit.f.map((f) => f.map((x) => x.toFixed(2)).join('/')).join(' '), 'thumb', fit.t.map((x) => x.toFixed(2)).join('/'), 'least', least(shape, fit, -1).toFixed(4));
  }
if (process.env.GRIP_PRINT) {
  for (const [name, shape] of Object.entries(CUPS)) {
    const fit = fitGrip(-1, shape);
    const per = [...fit.f.map((f, i) => fingerPoints(-1, i, f[0], f[1])), thumbPoints(-1, fit.t[0], fit.t[1], fit.ts)].map((c) => Math.min(...c.map((x) => surfaceDistance(shape, fit.socket, x.p) - x.r)).toFixed(4));
    console.log('per', name, per.join(' '));
  }
}
