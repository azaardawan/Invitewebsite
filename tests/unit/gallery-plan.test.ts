import { describe, expect, it } from 'vitest';
import { openRooms, photoRooms, roomAt, route, type Point } from '@/theme-sdk/gallery3d/plan';
import { PLAN } from '../../themes/memory-museum/v1/plan';

/** The shortest distance from point p to the segment a–b. */
function distance(p: Point, a: Point, b: Point) {
  const vx = b[0] - a[0];
  const vz = b[1] - a[1];
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * vx + (p[1] - a[1]) * vz) / (vx * vx + vz * vz || 1)));
  return Math.hypot(a[0] + vx * t - p[0], a[1] + vz * t - p[1]);
}

describe('3D gallery floor plan (Memory Museum)', () => {
  it('knows which room a point is in', () => {
    expect(roomAt(PLAN, 0, 12).key).toBe('hall');
    expect(roomAt(PLAN, 0, -20).key).toBe('room1');
    expect(roomAt(PLAN, 20, 3).key).toBe('room2');
    expect(roomAt(PLAN, -40, -5).key).toBe('room6');
    expect(roomAt(PLAN, 0, -45).key).toBe('room4');
  });

  it('fills the rooms with photo places in the order packages sell them, eight each', () => {
    expect(photoRooms(PLAN).map((r) => [r.room.key, r.first])).toEqual([
      ['room1', 0],
      ['room2', 8],
      ['room3', 16],
      ['room4', 24],
      ['room5', 32],
      ['room6', 40],
    ]);
  });

  it('walks through every doorway on the way, never through a wall', () => {
    const way = route(PLAN, [0, 12.5], [0, -45]);
    // Through the hall's north doorway, then the doorway between the two north rooms.
    const crossings = way.filter(([x, z]) => Math.abs(x) < 0.01 && (Math.abs(z + 15.5) < 3 || Math.abs(z + 32.5) < 3.5));
    expect(crossings.length).toBeGreaterThanOrEqual(4);
    // Every step that crosses a wall line does it inside the doorway.
    const pts: Point[] = [[0, 12.5], ...way];
    for (let i = 1; i < pts.length; i++) {
      const [a, b] = [pts[i - 1]!, pts[i]!];
      for (const wall of [-15.5, -32.5]) {
        if ((a[1] - wall) * (b[1] - wall) < 0) {
          const x = a[0] + ((b[0] - a[0]) * (wall - a[1])) / (b[1] - a[1]);
          expect(Math.abs(x)).toBeLessThan(1.7);
        }
      }
    }
    expect(way.at(-1)).toEqual([0, -45]);
  });

  it('goes around the sculpture and the columns in the hall', () => {
    for (const [from, to] of [
      [[0, 12.5], [0, -20]],
      [[20, 0], [-20, 0]],
      [[0, -20], [20, 3]],
    ] as [Point, Point][]) {
      const pts: Point[] = [from, ...route(PLAN, from, to)];
      for (let i = 1; i < pts.length; i++) {
        for (const o of PLAN.obstacles) expect(distance([o.x, o.z], pts[i - 1]!, pts[i]!)).toBeGreaterThan(o.r + 0.5);
      }
    }
  });

  it('opens the rooms with photos and the rooms on the way to them; the rest are walled off', () => {
    expect([...openRooms(PLAN, [])]).toEqual(['hall']);
    expect([...openRooms(PLAN, [0, 3])].sort()).toEqual(['hall', 'room1']);
    // A package with two rooms: the first two galleries.
    expect([...openRooms(PLAN, [0, 9, 15])].sort()).toEqual(['hall', 'room1', 'room2']);
    // Photos only in the room behind the first: the first stays open to walk through.
    expect([...openRooms(PLAN, [24, 25])].sort()).toEqual(['hall', 'room1', 'room4']);
  });
});
