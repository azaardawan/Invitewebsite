/**
 * The plan of a walkable 3D world (`<World3D>`): a small building of rooms on one or more floors, whose model has
 * photo places, video screens, name plates and things a visitor can tap (drawers, a gift, a door, stairs). A design
 * describes its own model with one of these (metres, the model's coordinates; y is up; a yaw of 0 looks towards −z).
 *
 * Pure functions only (no three.js), so walking rules can be tested without a browser.
 */

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };

/**
 * Somewhere a visitor may stand: a flat floor at height `y`, or a ramp (stairs) rising along z from `z0` (height `y0`)
 * to `z1` (height `y1`). Rectangles are already kept clear of the walls.
 */
export type WorldSurface = Rect & ({ y: number } | { ramp: { z0: number; y0: number; z1: number; y1: number } });

export type WorldRoom = { key: string; rect: Rect; y: number };

/**
 * What a tap on part of the model does (the design decides what it means, through `onTap`; the world only moves it):
 * - `drawer`: slides out by `[dx, dz]` and back; `lid`: tips open on its back edge; `lift`: rises and turns;
 * - `press`: a button that dips when pressed; `glow`: shines while on;
 * - `door`: opens out of the way, and its `gate` (part of the floor) can be walked through only then;
 * - `teleport`: takes the visitor to `to` (accessible stairs: a tap instead of a climb).
 * `with`: other meshes (name prefixes) that move with it (a drawer's knob); `touch`: meshes that answer a tap for it
 * without moving (a chest's body, when its lid opens).
 */
type ThingBase = { key: string; node: string; with?: readonly string[]; touch?: readonly string[] };
export type WorldThing =
  | (ThingBase & { kind: 'drawer'; slide: readonly [number, number] })
  | (ThingBase & { kind: 'lid' | 'lift' | 'press' | 'glow' })
  | (ThingBase & { kind: 'door'; gate: WorldSurface })
  | (ThingBase & { kind: 'teleport'; to: { x: number; z: number; y: number; yaw: number } });

/** A name written on the model: a plate at `at` (its middle), facing `normal` ([x, z]), `width` × `height` metres. */
export type WorldText = { key: string; at: readonly [number, number, number]; normal: readonly [number, number]; width: number; height: number };

export type WorldPlan = {
  start: { x: number; z: number; y: number; yaw: number };
  /** Eye height above the floor. */
  eye: number;
  surfaces: readonly WorldSurface[];
  rooms: readonly WorldRoom[];
  /**
   * The model's photo meshes, by photo place; `photoParts`: meshes that go with each (the photo's name + `suffix`): its
   * `frame` (drawn in the design's frame colour) or a `glass` in front of it (drawn clear).
   */
  photos: readonly string[];
  photoParts?: readonly { suffix: string; role: 'frame' | 'glass' }[];
  /** The model's video screens, by video place. */
  screens: readonly string[];
  texts: readonly WorldText[];
  things: readonly WorldThing[];
  /** Colour slots (a design's colour sets) → the meshes (name prefixes) painted in that colour. */
  paint?: Readonly<Record<string, readonly string[]>>;
  /** Meshes (name prefixes) left out of the scene, and meshes a visitor can walk through (rugs, thin strings). */
  hidden?: readonly string[];
  passThrough?: readonly string[];
  /** The sky colour seen through openings, and the light. */
  sky: string;
  light: { ambient: number; sun: number; exposure: number };
};

/** How far up or down a visitor steps without stairs. */
export const STEP = 0.45;

/** The height of a surface at (x, z) (inside it), or null outside it. */
export function surfaceHeight(s: WorldSurface, x: number, z: number): number | null {
  if (x < s.minX || x > s.maxX || z < s.minZ || z > s.maxZ) return null;
  if ('y' in s) return s.y;
  const { z0, y0, z1, y1 } = s.ramp;
  const t = Math.min(1, Math.max(0, (z - z0) / (z1 - z0)));
  return y0 + (y1 - y0) * t;
}

/**
 * Where a visitor at height `y` stands after stepping to (x, z): the floor there within a step of `y` (the nearest
 * when floors overlap, e.g. under the stairs), or null where they can't stand. `open`: gates (doors) that are open.
 */
export function floorAt(plan: Pick<WorldPlan, 'surfaces' | 'things'>, x: number, z: number, y: number, open: ReadonlySet<string> = new Set()): number | null {
  const gates = plan.things.filter((t): t is Extract<WorldThing, { kind: 'door' }> => t.kind === 'door' && open.has(t.key)).map((t) => t.gate);
  let best: number | null = null;
  for (const s of [...plan.surfaces, ...gates]) {
    const h = surfaceHeight(s, x, z);
    if (h === null || Math.abs(h - y) > STEP) continue;
    if (best === null || Math.abs(h - y) < Math.abs(best - y)) best = h;
  }
  return best;
}

/** The room at (x, z) on the floor nearest height `y`, or null (stairs, doorways). */
export function roomAt(plan: Pick<WorldPlan, 'rooms'>, x: number, z: number, y: number): WorldRoom | null {
  let best: WorldRoom | null = null;
  for (const r of plan.rooms) {
    const { rect } = r;
    if (x < rect.minX || x > rect.maxX || z < rect.minZ || z > rect.maxZ || Math.abs(r.y - y) > 1.5) continue;
    if (!best || Math.abs(r.y - y) < Math.abs(best.y - y)) best = r;
  }
  return best;
}
