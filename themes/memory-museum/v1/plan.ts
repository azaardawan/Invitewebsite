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
 * the right wall (5–8), which is also how the editor lays each room out.
 */
const spots = (...n: number[]) => n.map((i) => `ART_SPOT_${String(i).padStart(3, '0')}`);
const NEAR = { depth: 1.7, width: 3.6, height: 4.5, face: 0.21, approach: 9.5 } as const;
const FAR = { depth: 2.9, width: 3.6, height: 4.5, face: 1.21 } as const;
const SIDE = 11;

const rooms: GalleryRoom[] = [
  { key: 'hall', parent: null, spots: [] },
  // The front wing (north, straight ahead).
  { key: 'room1', parent: 'hall', sign: 'ROOM_TITLE_01', bounds: { minX: -SIDE, maxX: SIDE, minZ: -32.5, maxZ: -15.5 }, door: { x: 0, z: -15.5, axis: [0, -1], ...NEAR }, spots: spots(17, 18, 19, 20, 24, 23, 22, 21) },
  { key: 'room2', parent: 'room1', sign: 'ROOM_TITLE_02', bounds: { minX: -SIDE, maxX: SIDE, minZ: -51, maxZ: -32.5 }, door: { x: 0, z: -32.5, axis: [0, -1], ...FAR }, spots: spots(25, 26, 27, 28, 32, 31, 30, 29) },
  // The left wing (west).
  { key: 'room3', parent: 'hall', sign: 'ROOM_TITLE_05', bounds: { minX: -32.5, maxX: -15.5, minZ: -SIDE, maxZ: SIDE }, door: { x: -15.5, z: 0, axis: [-1, 0], ...NEAR }, spots: spots(4, 3, 2, 1, 5, 6, 7, 8) },
  { key: 'room4', parent: 'room3', sign: 'ROOM_TITLE_06', bounds: { minX: -51, maxX: -32.5, minZ: -SIDE, maxZ: SIDE }, door: { x: -32.5, z: 0, axis: [-1, 0], ...FAR }, spots: spots(12, 11, 10, 9, 13, 14, 15, 16) },
  // The right wing (east).
  { key: 'room5', parent: 'hall', sign: 'ROOM_TITLE_03', bounds: { minX: 15.5, maxX: 32.5, minZ: -SIDE, maxZ: SIDE }, door: { x: 15.5, z: 0, axis: [1, 0], ...NEAR }, spots: spots(37, 38, 39, 40, 36, 35, 34, 33) },
  { key: 'room6', parent: 'room5', sign: 'ROOM_TITLE_04', bounds: { minX: 32.5, maxX: 51, minZ: -SIDE, maxZ: SIDE }, door: { x: 32.5, z: 0, axis: [1, 0], ...FAR }, spots: spots(45, 46, 47, 48, 44, 43, 42, 41) },
];

export const PLAN: GalleryPlan = {
  rooms,
  start: { x: 0, z: 12.5, yaw: 0 },
  eye: 2.05,
  view: { distance: 5, phone: 3.7 },
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
