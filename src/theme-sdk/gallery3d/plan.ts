/**
 * The floor plan of a walkable 3D gallery (`<Gallery3D>`): which rooms the model has, how they connect through
 * doorways, which wall spots in each room hold the customer's photos, and where a visitor starts. A design describes
 * its own model with one of these (in metres, the model's coordinates; y is up, a yaw of 0 looks towards −z).
 *
 * Pure functions only (no three.js), so routes can be tested without a browser.
 */

export type GalleryDoor = {
  /** The doorway's centre on the floor. */
  x: number;
  z: number;
  /** The direction from the room's parent into the room: [1, 0], [-1, 0], [0, 1] or [0, -1]. */
  axis: readonly [number, number];
  /** How far before and after the doorway's centre a visitor walks straight (half the wall's thickness plus room to turn). */
  depth: number;
  /** The opening's width and height, and how far the parent's side of the wall is from the centre (to close it). */
  width: number;
  height: number;
  face: number;
  /** A point this far back from the doorway, in the parent, that walks pass through (keeps them clear of the parent's corners). */
  approach?: number;
};

export type GalleryRoom = {
  key: string;
  /** The room a visitor comes from (null for the first room, where visitors start: it has no doorway). */
  parent: string | null;
  /** The room's floor (not needed for the first room: every point outside the other rooms is in it). */
  bounds?: { minX: number; maxX: number; minZ: number; maxZ: number };
  door?: GalleryDoor;
  /** The model's mesh names of the wall spots that hold photos, in the order the photo places fill them. */
  spots: readonly string[];
  /** The model's mesh for the room's name (drawn on it), if any. */
  sign?: string;
  /**
   * Where the room's own plaque hangs (its name and few words, `<Gallery3D rooms>`): a point on a wall and the wall's
   * direction into the room, [x, z]. Usually the wall a visitor faces on walking in.
   */
  plaque?: { x: number; z: number; normal: readonly [number, number] };
};

export type GalleryPlan = {
  /** The first is where visitors start. Photo places fill the rooms that have spots, in this order. */
  rooms: readonly GalleryRoom[];
  start: { x: number; z: number; yaw: number };
  /** Eye height. */
  eye: number;
  /**
   * How far from a photo a visitor stands to look at it (on a computer, and on a phone held upright), and how much of
   * the way up to the photo's middle the camera tilts there (default 0.45; less, or below 0, keeps the photo higher on
   * the screen, clear of the design's panels at the bottom).
   */
  view: { distance: number; phone: number; tilt?: { computer: number; phone: number } };
  /**
   * Where a visitor may stand, as rectangles (already kept clear of the walls): the rooms, corridors and doorways.
   * Steps off it are refused, so nobody walks out of the building through an opening in the model. Without it, only
   * the model's walls stop visitors.
   */
  floor?: readonly { minX: number; maxX: number; minZ: number; maxZ: number }[];
  /** Round things in the way (columns, a sculpture) that walks go around. */
  obstacles: readonly { x: number; z: number; r: number }[];
  /** Meshes (name prefixes) left out of the scene, e.g. a figure that only shows the model's scale. */
  hidden: readonly string[];
  /** Meshes (name prefixes) a visitor can walk through (glass, pictures, signs). */
  passThrough: readonly string[];
  /** Meshes (name prefixes) with the frames and labels around the spots: a spot without a photo loses its frame too. */
  frames: readonly string[];
  /** The model's material of the small plaques under the spots: hidden, the gallery draws each photo's label there. */
  plaques?: string;
  /** The model's material used to close a doorway to a room that is not shown. */
  wallMaterial: string;
  /**
   * Decoration and repairs drawn over the model (`./decor.ts`): coffered ceilings, ornamented walls, blocks closing the
   * model's openings, its doorways closed round their openings, a pair of doors, extra lamps, the sky colour.
   */
  decor?: import('./decor').DecorSpec;
  /** The screen mesh (`<Gallery3D screen>`), if the model has one. */
  screen?: string;
  /** Light: how strongly to use the model's own lamps, the soft light everywhere, and the exposure. */
  light: { lamps: number; ambient: number; exposure: number };
};

export type Point = readonly [number, number];
export type { DecorSpec } from './decor';

/** The room a floor point is in (the first room when it is in no other room's bounds). */
export function roomAt(plan: GalleryPlan, x: number, z: number): GalleryRoom {
  for (const r of plan.rooms) {
    const b = r.bounds;
    if (b && x >= b.minX && x <= b.maxX && z >= b.minZ && z <= b.maxZ) return r;
  }
  return plan.rooms[0]!;
}

function byKey(plan: GalleryPlan, key: string | null): GalleryRoom | undefined {
  return key ? plan.rooms.find((r) => r.key === key) : undefined;
}

/** Whether a visitor may stand at (x, z): inside one of the plan's floor rectangles (anywhere without a floor). */
export function onFloor(plan: GalleryPlan, x: number, z: number): boolean {
  if (!plan.floor?.length) return true;
  return plan.floor.some((r) => x >= r.minX && x <= r.maxX && z >= r.minZ && z <= r.maxZ);
}

/** The rooms from the first room down to `room` (walks go through every doorway between them). */
export function roomChain(plan: GalleryPlan, room: GalleryRoom): GalleryRoom[] {
  const chain: GalleryRoom[] = [];
  for (let r: GalleryRoom | undefined = room; r; r = byKey(plan, r.parent)) chain.unshift(r);
  return chain;
}

/** The points a visitor walks through, beside a doorway, on the way in (or reversed, out). */
function doorPoints(door: GalleryDoor): Point[] {
  const [ax, az] = door.axis;
  const at = (d: number): Point => [door.x + ax * d, door.z + az * d];
  return [...(door.approach ? [at(-door.approach)] : []), at(-door.depth), at(door.depth)];
}

/** A point beside an obstacle when the straight way from `a` to `b` would pass through it, else null. */
function detour(a: Point, b: Point, o: { x: number; z: number; r: number }): Point | null {
  const [ax, az] = a;
  const vx = b[0] - ax;
  const vz = b[1] - az;
  const len2 = vx * vx + vz * vz;
  if (!len2) return null;
  const t = ((o.x - ax) * vx + (o.z - az) * vz) / len2;
  if (t <= 0 || t >= 1) return null;
  let cx = ax + vx * t - o.x;
  let cz = az + vz * t - o.z;
  const clear = o.r + 1.8;
  const d = Math.hypot(cx, cz);
  if (d >= clear) return null;
  if (d < 1e-3) [cx, cz] = [-vz, vx]; // straight through the middle: go round on the left
  const n = Math.hypot(cx, cz);
  return [o.x + (cx / n) * (clear + 0.5), o.z + (cz / n) * (clear + 0.5)];
}

/**
 * The way from one floor point to another: through every doorway between their rooms (out of the rooms of the first,
 * into the rooms of the second) and around the obstacles. Ends at `to`; does not include `from`.
 */
export function route(plan: GalleryPlan, from: Point, to: Point): Point[] {
  const a = roomChain(plan, roomAt(plan, from[0], from[1]));
  const b = roomChain(plan, roomAt(plan, to[0], to[1]));
  let shared = 0;
  while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++;
  const way: Point[] = [];
  for (let i = a.length - 1; i >= shared; i--) way.push(...doorPoints(a[i]!.door!).reverse());
  for (let i = shared; i < b.length; i++) way.push(...doorPoints(b[i]!.door!));
  way.push(to);

  const out: Point[] = [];
  let prev = from;
  for (const next of way) {
    for (const o of plan.obstacles) {
      const p = detour(prev, next, o);
      if (p) {
        out.push(p);
        prev = p;
      }
    }
    out.push(next);
    prev = next;
  }
  return out;
}

/** The rooms that hold photo places, in place order, with the first place of each. */
export function photoRooms(plan: GalleryPlan): { room: GalleryRoom; first: number }[] {
  let first = 0;
  return plan.rooms
    .filter((r) => r.spots.length > 0)
    .map((room) => {
      const entry = { room, first };
      first += room.spots.length;
      return entry;
    });
}

/**
 * Which rooms are open: a room with at least one photo, and every room on the way to one. Rooms with no photo behind
 * them are closed (their doorway walled up), so a package that sells fewer rooms shows a smaller gallery.
 */
export function openRooms(plan: GalleryPlan, photoIndexes: readonly number[]): Set<string> {
  const open = new Set<string>([plan.rooms[0]!.key]);
  for (const { room, first } of photoRooms(plan)) {
    if (!photoIndexes.some((i) => i >= first && i < first + room.spots.length)) continue;
    for (const r of roomChain(plan, room)) open.add(r.key);
  }
  return open;
}
