import type { GalleryPlan, GalleryRoom } from '@/theme-sdk';

/**
 * The museum model (`assets/museum.glb`, the owner's, 2026-11-13): a cross-shaped hall under a glass pyramid, and on
 * three sides two galleries in a row, eight photo spots each (2.04 × 2.74 m). Measured from the model: doorways are
 * 3.4 m wide and 4.4 m high; the hall's walls are 0.42 m thick, the walls between the galleries 2.42 m. The model is
 * about 1.25 × life size (its visitor figure is 2.24 m), hence the eye height.
 * The model's own example paintings (one embedded picture) were taken out of the file: they are never shown (every
 * spot shows a customer photo or is left out), and an embedded picture can't load under the site's security policy.
 *
 * Rooms are photo sets (manifest `photos.set`), in the order packages sell them (owner, 2026-11-13): the museum has three
 * wings of two rooms; two rooms are the front wing (straight ahead from the entrance), four add the left wing, six are
 * the whole museum. Each room's spots are in walking order: along the left wall going in (places 1–4), then back along
 * the right wall (5–8), which is also how the editor lays each room out. Each room's plaque (its name and few words)
 * hangs on the wall ahead as a visitor walks in, beside the doorway on (front and side rooms) or in the middle (end rooms).
 */
const spots = (...n: number[]) => n.map((i) => `ART_SPOT_${String(i).padStart(3, '0')}`);
const NEAR = { depth: 1.7, width: 3.6, height: 4.5, face: 0.21, approach: 9.5 } as const;
const FAR = { depth: 2.9, width: 3.6, height: 4.5, face: 1.21 } as const;
const SIDE = 11;

const rooms: GalleryRoom[] = [
  { key: 'hall', parent: null, spots: [] },
  // The front wing (north, straight ahead).
  { key: 'room1', parent: 'hall', sign: 'ROOM_TITLE_01', plaque: { x: 6, z: -31.29, normal: [0, 1] }, bounds: { minX: -SIDE, maxX: SIDE, minZ: -32.5, maxZ: -15.5 }, door: { x: 0, z: -15.5, axis: [0, -1], ...NEAR }, spots: spots(17, 18, 19, 20, 24, 23, 22, 21) },
  { key: 'room2', parent: 'room1', sign: 'ROOM_TITLE_02', plaque: { x: 0, z: -49.29, normal: [0, 1] }, bounds: { minX: -SIDE, maxX: SIDE, minZ: -51, maxZ: -32.5 }, door: { x: 0, z: -32.5, axis: [0, -1], ...FAR }, spots: spots(25, 26, 27, 28, 32, 31, 30, 29) },
  // The left wing (west).
  { key: 'room3', parent: 'hall', sign: 'ROOM_TITLE_05', plaque: { x: -31.29, z: -6, normal: [1, 0] }, bounds: { minX: -32.5, maxX: -15.5, minZ: -SIDE, maxZ: SIDE }, door: { x: -15.5, z: 0, axis: [-1, 0], ...NEAR }, spots: spots(4, 3, 2, 1, 5, 6, 7, 8) },
  { key: 'room4', parent: 'room3', sign: 'ROOM_TITLE_06', plaque: { x: -49.29, z: 0, normal: [1, 0] }, bounds: { minX: -51, maxX: -32.5, minZ: -SIDE, maxZ: SIDE }, door: { x: -32.5, z: 0, axis: [-1, 0], ...FAR }, spots: spots(12, 11, 10, 9, 13, 14, 15, 16) },
  // The right wing (east).
  { key: 'room5', parent: 'hall', sign: 'ROOM_TITLE_03', plaque: { x: 31.29, z: 6, normal: [-1, 0] }, bounds: { minX: 15.5, maxX: 32.5, minZ: -SIDE, maxZ: SIDE }, door: { x: 15.5, z: 0, axis: [1, 0], ...NEAR }, spots: spots(37, 38, 39, 40, 36, 35, 34, 33) },
  { key: 'room6', parent: 'room5', sign: 'ROOM_TITLE_04', plaque: { x: 49.29, z: 0, normal: [-1, 0] }, bounds: { minX: 32.5, maxX: 51, minZ: -SIDE, maxZ: SIDE }, door: { x: 32.5, z: 0, axis: [1, 0], ...FAR }, spots: spots(45, 46, 47, 48, 44, 43, 42, 41) },
];

/** A rectangle, and its mirror image across the hall (the left and right wings are alike). */
const rect = (minX: number, maxX: number, minZ: number, maxZ: number) => ({ minX, maxX, minZ, maxZ });
const both = (r: ReturnType<typeof rect>) => [r, rect(-r.maxX, -r.minX, r.minZ, r.maxZ)];

/**
 * Where visitors may stand (measured from the model, 0.4 m clear of the walls). The main entrance at the south end of
 * the hall is an opening in the model, so the floor stops before it: nobody walks out of the museum.
 */
const FLOOR = [
  // The hall: its middle, the corridor ahead to the front wing, the entrance corridor behind, the arms to the side wings.
  rect(-7.6, 7.6, -7.6, 8.1),
  rect(-5.1, 5.1, -14.9, -7.6),
  rect(-5.1, 5.1, 7.6, 14.9),
  ...both(rect(7.6, 14.9, -5.1, 5.1)),
  // The front wing: its doorway, first room, the passage, second room.
  rect(-1.3, 1.3, -16.2, -14.8),
  rect(-10.3, 10.3, -30.9, -16.1),
  rect(-1.3, 1.3, -34.1, -30.8),
  rect(-10.3, 10.3, -48.9, -34.1),
  // The side wings (right, and mirrored left).
  ...both(rect(14.8, 16.2, -1.3, 1.3)),
  ...both(rect(16.1, 30.9, -10.3, 10.3)),
  ...both(rect(30.8, 34.1, -1.3, 1.3)),
  ...both(rect(34.1, 48.9, -10.3, 10.3)),
];

/** The inside of each gallery (its wall faces, measured from the model). */
const R = 10.79;
const INSIDE = {
  room1: rect(-R, R, -31.29, -15.71),
  room2: rect(-R, R, -49.29, -33.71),
  room3: rect(-31.29, -15.71, -R, R),
  room4: rect(-49.29, -33.71, -R, R),
  room5: rect(15.71, 31.29, -R, R),
  room6: rect(33.71, 49.29, -R, R),
};
/** The hall's parts round the glass pyramid (whose base is 7.4 m up and ±7.2 m wide). */
const HALL = {
  north: rect(-5.29, 5.29, -15.29, -8),
  south: rect(-5.29, 5.29, 8, 15.29),
  east: rect(8, 15.29, -5.29, 5.29),
  west: rect(-15.29, -8, -5.29, 5.29),
};
const PYRAMID = 7.4;

/**
 * Decoration and repairs (owner, 2026-11-13): the model has no ceilings outside the pyramid, open corners in the hall,
 * an open main entrance, hollow walls between a wing's two rooms and gaps above its doorways. All closed here, with
 * coffered ceilings, and the galleries' walls (and the hall's long walls) in Renaissance ornament.
 */
const DECOR: NonNullable<GalleryPlan['decor']> = {
  wallHeight: 8,
  ceilings: [
    ...Object.values(INSIDE).map((r) => ({ ...r, y: 8 })),
    ...Object.values(HALL).map((r) => ({ ...r, y: PYRAMID })),
    // The frame between the pyramid's base and the hall's corners.
    { ...rect(-8, 8, -8, -7.2), y: PYRAMID },
    { ...rect(-8, 8, 7.2, 8), y: PYRAMID },
    { ...rect(-8, -7.2, -7.2, 7.2), y: PYRAMID },
    { ...rect(7.2, 8, -7.2, 7.2), y: PYRAMID },
  ],
  walls: [
    ...Object.values(INSIDE).map((r) => ({ ...r, height: 8 })),
    { ...HALL.north, height: PYRAMID, sides: ['e', 'w'] as const },
    { ...HALL.south, height: PYRAMID, sides: ['e', 'w'] as const },
    { ...HALL.east, height: PYRAMID, sides: ['n', 's'] as const },
    { ...HALL.west, height: PYRAMID, sides: ['n', 's'] as const },
  ],
  fills: [
    // The hall's four open corners, where a corridor meets an arm.
    ...[-1, 1].flatMap((sx) =>
      [-1, 1].flatMap((sz) => [
        { ...rect(Math.min(sx * 5.1, sx * 8.4), Math.max(sx * 5.1, sx * 8.4), Math.min(sz * 8, sz * 8.4), Math.max(sz * 8, sz * 8.4)), maxY: 8 },
        { ...rect(Math.min(sx * 8, sx * 8.4), Math.max(sx * 8, sx * 8.4), Math.min(sz * 5.1, sz * 8.4), Math.max(sz * 5.1, sz * 8.4)), maxY: 8 },
      ]),
    ),
    // The main entrance (an opening in the model): closed, with a pair of doors drawn on it.
    { ...rect(-2.95, 2.95, 15.3, 15.9), maxY: 8 },
  ],
  doors: [{ x: 0, z: 15.29, normal: [0, -1], width: 5.3, height: 5.6 }],
  doorways: true,
  floorMaterial: 'Smoked oak parquet',
  // The model lights the first room of each wing; the rooms behind get a lamp of the same strength.
  lampHeight: 5.8,
  lamps: [
    { x: 0, y: 5.8, z: -41.5, intensity: 320 },
    { x: -41.5, y: 5.8, z: 0, intensity: 320 },
    { x: 41.5, y: 5.8, z: 0, intensity: 320 },
  ],
  sky: '#a9c1cb',
  // Not so flat, not so bland (owner, 2026-11-14): plaster walls with faint stone courses (0.6 m), marble floor tiles (0.9 m).
  surfaces: {
    walls: { materials: ['Louvre pale limestone'], size: 2.4, rows: 4 },
    floors: { materials: ['Smoked oak parquet', 'Courtyard marble'], size: 1.8 },
  },
  // A customer's wall colour (colour choice) replaces the warm cream of these.
  // (The hall's columns, «Gallery plaster», stay cream.)
  tint: { walls: ['Louvre pale limestone'], trim: ['Carved warm limestone'] },
};

export const PLAN: GalleryPlan = {
  rooms,
  floor: FLOOR,
  decor: DECOR,
  start: { x: 0, z: 12.5, yaw: 0 },
  eye: 2.05,
  // On a phone the design's panels cover the bottom of the screen: stand further back and look level, so the photo
  // and its card stay above them.
  view: { distance: 5, phone: 4.4, tilt: { computer: 0, phone: -0.1 } },
  // The sculpture in the middle of the hall and its four columns.
  obstacles: [
    { x: 0, z: 0, r: 0.8 },
    { x: 4.75, z: 4.5, r: 0.7 },
    { x: -4.75, z: 4.5, r: 0.7 },
    { x: 4.75, z: -4.5, r: 0.7 },
    { x: -4.75, z: -4.5, r: 0.7 },
  ],
  hidden: ['VISITOR SCALE FIGURE'],
  passThrough: ['COUR NAPOL', 'ROOM_TITLE', 'ART_SPOT', 'VIDEO_SURFACE'],
  frames: ['ARTWORK FRAMES'],
  // The model's small plaques under the spots: the design draws its own labels there (each photo's title and words).
  plaques: 'Gallery sign enamel',
  wallMaterial: 'Louvre pale limestone',
  screen: 'VIDEO_SURFACE_MAIN',
  light: { lamps: 0.0035, ambient: 0.75, exposure: 0.9 },
};

/** Photos per room (manifest `photos.set`), rooms per wing, and the rooms in the model (in place order). */
export const PER_ROOM = 8;
export const PER_WING = 2;
export const ROOMS = rooms.filter((r) => r.spots.length).map((r) => r.key);
/** A spot's shape (width ÷ height). */
export const SPOT_ASPECT = 2.04 / 2.74;
