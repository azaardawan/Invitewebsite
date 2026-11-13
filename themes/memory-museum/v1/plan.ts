import type { GalleryPlan, GalleryRoom } from '@/theme-sdk';

/**
 * The museum model (`assets/museum.glb`, the owner's, 2026-11-13): a cross-shaped hall under a glass pyramid, and on
 * three sides two galleries in a row, eight photo spots each (2.04 × 2.74 m). Measured from the model: doorways are
 * 3.4 m wide and 4.4 m high; the hall's walls are 0.42 m thick, the walls between the galleries 2.42 m. The model is
 * about 1.25 × life size (its visitor figure is 2.24 m), hence the eye height.
 * The model's own example paintings (one embedded picture) were taken out of the file: they are never shown (every
 * spot shows a customer photo or is left out), and an embedded picture can't load under the site's security policy.
 *
 * Rooms are photo sets (manifest `photos.set`), in the order a package sells them: the three galleries next to the
 * hall first, then the three behind them. Each room's spots are in walking order: along one wall, back along the other.
 */
const spots = (...n: number[]) => n.map((i) => `ART_SPOT_${String(i).padStart(3, '0')}`);
const NEAR = { depth: 1.7, width: 3.6, height: 4.5, face: 0.21, approach: 9.5 } as const;
const FAR = { depth: 2.9, width: 3.6, height: 4.5, face: 1.21 } as const;
const SIDE = 11;

const rooms: GalleryRoom[] = [
  { key: 'hall', parent: null, spots: [] },
  { key: 'room1', parent: 'hall', sign: 'ROOM_TITLE_01', bounds: { minX: -SIDE, maxX: SIDE, minZ: -32.5, maxZ: -15.5 }, door: { x: 0, z: -15.5, axis: [0, -1], ...NEAR }, spots: spots(17, 18, 19, 20, 24, 23, 22, 21) },
  { key: 'room2', parent: 'hall', sign: 'ROOM_TITLE_03', bounds: { minX: 15.5, maxX: 32.5, minZ: -SIDE, maxZ: SIDE }, door: { x: 15.5, z: 0, axis: [1, 0], ...NEAR }, spots: spots(33, 34, 35, 36, 40, 39, 38, 37) },
  { key: 'room3', parent: 'hall', sign: 'ROOM_TITLE_05', bounds: { minX: -32.5, maxX: -15.5, minZ: -SIDE, maxZ: SIDE }, door: { x: -15.5, z: 0, axis: [-1, 0], ...NEAR }, spots: spots(4, 3, 2, 1, 5, 6, 7, 8) },
  { key: 'room4', parent: 'room1', sign: 'ROOM_TITLE_02', bounds: { minX: -SIDE, maxX: SIDE, minZ: -51, maxZ: -32.5 }, door: { x: 0, z: -32.5, axis: [0, -1], ...FAR }, spots: spots(25, 26, 27, 28, 32, 31, 30, 29) },
  { key: 'room5', parent: 'room2', sign: 'ROOM_TITLE_04', bounds: { minX: 32.5, maxX: 51, minZ: -SIDE, maxZ: SIDE }, door: { x: 32.5, z: 0, axis: [1, 0], ...FAR }, spots: spots(41, 42, 43, 44, 48, 47, 46, 45) },
  { key: 'room6', parent: 'room3', sign: 'ROOM_TITLE_06', bounds: { minX: -51, maxX: -32.5, minZ: -SIDE, maxZ: SIDE }, door: { x: -32.5, z: 0, axis: [-1, 0], ...FAR }, spots: spots(12, 11, 10, 9, 13, 14, 15, 16) },
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
  wallMaterial: 'Louvre pale limestone',
  screen: 'VIDEO_SURFACE_MAIN',
  light: { lamps: 0.0035, ambient: 0.75, exposure: 0.9 },
};

/** Photos per room (manifest `photos.set`) and rooms in the model. */
export const PER_ROOM = 8;
export const ROOMS = rooms.filter((r) => r.spots.length).map((r) => r.key);
/** A spot's shape (width ÷ height). */
export const SPOT_ASPECT = 2.04 / 2.74;
