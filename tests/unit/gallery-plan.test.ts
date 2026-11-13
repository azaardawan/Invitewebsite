import { describe, expect, it } from 'vitest';
import { onFloor, openRooms, photoRooms, roomAt, route, type Point } from '@/theme-sdk/gallery3d/plan';
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
    // The front wing (rooms 1–2), the left wing (3–4), the right wing (5–6): the order packages sell them.
    expect(roomAt(PLAN, 0, -45).key).toBe('room2');
    expect(roomAt(PLAN, -20, 3).key).toBe('room3');
    expect(roomAt(PLAN, -40, -5).key).toBe('room4');
    expect(roomAt(PLAN, 20, 3).key).toBe('room5');
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

  it('keeps visitors in the building: the floor ends before the main entrance, and every walk stays on it', () => {
    expect(onFloor(PLAN, PLAN.start.x, PLAN.start.z)).toBe(true);
    // Out through the entrance at the south end of the hall, or through a wall: refused.
    expect(onFloor(PLAN, 0, 16)).toBe(false);
    expect(onFloor(PLAN, 0, -15.5 + 0)).toBe(true); // the front wing's doorway
    expect(onFloor(PLAN, 4, -15.5)).toBe(false); // the wall beside it
    expect(onFloor(PLAN, -60, 0)).toBe(false);
    // Every point of a walk to any photo's viewing spot, and the spots themselves, are on the floor.
    const views: Point[] = [];
    for (const [x, z] of [[-5.66, -17.9], [5.66, -29.1], [-5.66, -45], [-25, 5.66], [-40, -5.66], [25, 5.66], [44, -5.66], [-6.26, -21.6], [6.26, -40]] as Point[]) views.push([x, z]);
    for (const v of views) {
      expect(onFloor(PLAN, v[0], v[1]), `view ${v}`).toBe(true);
      const way: Point[] = [[PLAN.start.x, PLAN.start.z], ...route(PLAN, [PLAN.start.x, PLAN.start.z], v)];
      for (let i = 1; i < way.length; i++) {
        for (let t = 0; t <= 1; t += 0.05) {
          const x = way[i - 1]![0] + (way[i]![0] - way[i - 1]![0]) * t;
          const z = way[i - 1]![1] + (way[i]![1] - way[i - 1]![1]) * t;
          expect(onFloor(PLAN, x, z), `walk to ${v} at ${x.toFixed(1)},${z.toFixed(1)}`).toBe(true);
        }
      }
    }
  });

  it('opens the rooms with photos and the rooms on the way to them; the rest are walled off', () => {
    expect([...openRooms(PLAN, [])]).toEqual(['hall']);
    expect([...openRooms(PLAN, [0, 3])].sort()).toEqual(['hall', 'room1']);
    // A package with two rooms: the front wing.
    expect([...openRooms(PLAN, [0, 9, 15])].sort()).toEqual(['hall', 'room1', 'room2']);
    // Four rooms: and the left wing.
    expect([...openRooms(PLAN, [0, 8, 16, 24])].sort()).toEqual(['hall', 'room1', 'room2', 'room3', 'room4']);
    // Photos only in the room behind the left wing's first: that one stays open to walk through.
    expect([...openRooms(PLAN, [24, 25])].sort()).toEqual(['hall', 'room3', 'room4']);
  });
});
