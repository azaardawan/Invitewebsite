import type { DrawerBuild, WorldPlan, WorldSurface, WorldThing } from '@/theme-sdk';

/**
 * The Pink Dreamhouse's plan (the owner's models, `assets/house-<tier>.glb`): a dollhouse of rooms 4.6 m wide and
 * 5.8 m deep, open at the front (z = 0) and with the back wall at z = 5.8. Three sizes, one model each (a smaller
 * package never downloads the bigger house):
 * - basic: the living room and the bedroom (ground floor);
 * - vip: and the kitchen, and upstairs (stairs in the living room) the vanity studio;
 * - vvip: and upstairs the cinema and the secret birthday suite (locked until every memory is found).
 */
export type Tier = 'basic' | 'vip' | 'vvip';
export const TIERS: readonly Tier[] = ['basic', 'vip', 'vvip'];

export const MODELS: Record<Tier, string> = {
  basic: new URL('./assets/house-basic.glb', import.meta.url).href,
  vip: new URL('./assets/house-vip.glb', import.meta.url).href,
  vvip: new URL('./assets/house-vvip.glb', import.meta.url).href,
};

/** The rooms in photo order, with the model's names, and how many photos each holds. */
export const ROOMS = [
  { key: 'living', node: 'LIVING', photos: 3, tier: 'basic', floor: 0 },
  { key: 'bedroom', node: 'BEDROOM', photos: 3, tier: 'basic', floor: 0 },
  { key: 'kitchen', node: 'KITCHEN', photos: 3, tier: 'vip', floor: 0 },
  { key: 'vanity', node: 'VANITY', photos: 3, tier: 'vip', floor: 1 },
  { key: 'cinema', node: 'CINEMA', photos: 6, tier: 'vvip', floor: 1 },
  { key: 'secret', node: 'SECRET', photos: 6, tier: 'vvip', floor: 1 },
] as const;
export type RoomKey = (typeof ROOMS)[number]['key'];

/** Photos fill sets of three (a room of three, or a half of the cinema or the suite). */
export const PHOTO_SET = 3;
export const PHOTO_ASPECT = 0.9;
/** The first photo place of each room. */
export const FIRST_PHOTO = ROOMS.map((_, i) => ROOMS.slice(0, i).reduce((n, r) => n + r.photos, 0));
export const PHOTO_COUNT: Record<Tier, number> = { basic: 6, vip: 12, vvip: 24 };

/** The drawers (each holds one of the customer's messages), in order, with their room. */
export const DRAWERS = [
  { node: 'INT_DRAWER_LIVING_01', knob: 'DRAWER_KNOB_LIVING_01', room: 'living' },
  { node: 'INT_DRAWER_BEDROOM_01', knob: 'DRAWER_KNOB_BEDROOM_01', room: 'bedroom' },
  { node: 'INT_DRAWER_KITCHEN_01', knob: 'DRAWER_KNOB_KITCHEN_01', room: 'kitchen' },
  { node: 'INT_DRAWER_VANITY_01', knob: 'DRAWER_KNOB_VANITY_01', room: 'vanity' },
  { node: 'INT_DRAWER_CINEMA_01', knob: 'DRAWER_KNOB_CINEMA_01', room: 'cinema' },
  { node: 'INT_DRAWER_CINEMA_02', knob: 'DRAWER_KNOB_CINEMA_02', room: 'cinema' },
  { node: 'INT_DRAWER_SECRET_01', knob: 'DRAWER_KNOB_SECRET_01', room: 'secret' },
  { node: 'INT_DRAWER_SECRET_02', knob: 'DRAWER_KNOB_SECRET_02', room: 'secret' },
] as const;
export const DRAWER_COUNT: Record<Tier, number> = { basic: 2, vip: 4, vvip: 8 };

/** The video screens, by video place: the fridge (VIP), the cinema and the suite (VVIP). */
export const SCREENS = ['VIDEO_KITCHEN_FRIDGE', 'VIDEO_CINEMA_MAIN', 'VIDEO_SECRET_MESSAGE'] as const;
export const VIDEO_COUNT: Record<Tier, number> = { basic: 0, vip: 1, vvip: 3 };

/** The default colours (the "Blush Cream" palette), by paint slot. */
export const BLUSH = { walls: '#f6b8cf', 'walls-light': '#fce0e9', accent: '#de709b', floor: '#ead7c5', trim: '#fff8f3', metal: '#c7a16a' } as const;
export type PaintSlot = keyof typeof BLUSH;

const EYE = 1.6;
const UP = 3.35;
const rect = (minX: number, maxX: number, minZ: number, maxZ: number) => ({ minX, maxX, minZ, maxZ });
const flat = (y: number, minX: number, maxX: number, minZ: number, maxZ: number): WorldSurface => ({ ...rect(minX, maxX, minZ, maxZ), y });
/** The doorway in a partition at `x` (between the jambs), on the floor at `y`. */
const doorway = (x: number, y: number) => flat(y, x - 0.42, x + 0.42, 2.32, 3.28);

/** The secret suite's door, in the doorway from the cinema: walked through only once it is open. */
const SECRET_GATE = doorway(9.2, UP);

const surfaces: Record<Tier, WorldSurface[]> = {
  basic: [flat(0, 0.32, 4.28, 0.45, 5.48), doorway(4.6, 0), flat(0, 4.92, 8.88, 0.45, 5.48)],
  vip: [],
  vvip: [],
};
// With the stairs (VIP and VVIP): the living room around them, the stairs themselves (a ramp), the landing upstairs.
const ground = [
  flat(0, 1.62, 4.28, 0.45, 5.48),
  flat(0, 0.32, 1.62, 0.45, 0.72),
  flat(0, 0.32, 1.62, 3.98, 5.48),
  doorway(4.6, 0),
  flat(0, 4.92, 8.88, 0.45, 5.48),
  doorway(9.2, 0),
  flat(0, 9.52, 13.48, 0.45, 5.48),
];
const stairs: WorldSurface[] = [
  { ...rect(0.42, 1.42, 0.6, 3.75), ramp: { z0: 0.6, y0: 0, z1: 3.75, y1: UP } },
  flat(UP, 0.46, 1.42, 3.7, 4.36),
];
// Upstairs, the vanity: clear of the stair rail (x 1.73–1.81, as far back as z 4.15) and the stairwell.
const vanity = [flat(UP, 1.86, 4.28, 0.45, 5.48), flat(UP, 0.32, 4.28, 4.3, 5.48)];
surfaces.vip = [...ground, ...stairs, ...vanity];
surfaces.vvip = [...ground, ...stairs, ...vanity, doorway(4.6, UP), flat(UP, 4.92, 8.88, 0.45, 5.48), flat(UP, 9.52, 13.48, 0.45, 5.48)];

/** Where the visitor starts (the living room, facing the photo wall), and where the stairs' taps take them. */
// From the open front of each room, so the whole room is in view.
const START = { x: 2.9, z: 0.5, y: 0, yaw: Math.PI };
const UPSTAIRS = { x: 3.0, z: 0.55, y: UP, yaw: Math.PI };
const DOWNSTAIRS = { x: 2.9, z: 0.5, y: 0, yaw: Math.PI };

/**
 * The drawers as real drawers (owner, 2026-11-19: the model's floated in the air and didn't look like drawers): each a
 * drawer in a housing standing on the floor or under its furniture. By drawer (the order of DRAWERS), in model metres.
 */
const DRAWER_PAINT = { front: 'accent', inside: 'walls-light', housing: 'trim', knob: 'metal' } as const;
const box = (min: [number, number, number], max: [number, number, number]) => ({ min, max });
const DRAWER_BUILDS: DrawerBuild[] = [
  // The coffee table's: under its top, between its legs.
  { drawer: box([2.55, 0.33, 2.25], [3.35, 0.48, 2.85]), housing: box([2.45, 0.31, 2.25], [3.45, 0.49, 3.0]), paint: DRAWER_PAINT },
  // The bedside cabinet's (the cabinet is drawn with it).
  { drawer: box([8.47, 0.55, 4.07], [8.99, 0.83, 4.62]), housing: box([8.4, 0.09, 4.07], [9.06, 0.91, 4.74]), hide: ['DECOR_BEDSIDE_CABINET'], paint: DRAWER_PAINT },
  // The kitchen cabinets' (under the counter).
  { drawer: box([12.62, 0.46, 4.99], [13.28, 0.7, 5.45]), housing: box([10.04, 0.04, 4.99], [13.64, 0.76, 5.55]), hide: ['DECOR_KITCHEN_CABINETS'], paint: DRAWER_PAINT },
  // Under the vanity's counter.
  { drawer: box([1.86, 3.89, 4.45], [2.56, 4.1, 4.98]), housing: box([1.8, 3.86, 4.45], [2.62, 4.13, 5.05]), paint: DRAWER_PAINT },
  // The cinema's chest of two drawers, against the wall by the suite.
  { drawer: box([8.45, 3.58, 1.07], [9.02, 3.92, 1.73]), housing: box([8.45, 3.35, 1.0], [9.1, 3.96, 1.8]), paint: DRAWER_PAINT },
  { drawer: box([8.45, 4.0, 1.07], [9.02, 4.33, 1.73]), housing: box([8.45, 3.96, 1.0], [9.1, 4.4, 1.8]), paint: DRAWER_PAINT },
  // The suite's chest of two drawers, against its side wall.
  { drawer: box([13.1, 3.58, 2.07], [13.68, 3.92, 2.73]), housing: box([13.1, 3.35, 2.0], [13.75, 3.96, 2.8]), paint: DRAWER_PAINT },
  { drawer: box([13.1, 4.0, 2.07], [13.68, 4.33, 2.73]), housing: box([13.1, 3.96, 2.0], [13.75, 4.4, 2.8]), paint: DRAWER_PAINT },
];
/** Which way each drawer slides out: towards the room's front, or (the two chests) into the room. */
const DRAWER_SLIDES: [number, number][] = [[0, -0.3], [0, -0.3], [0, -0.3], [0, -0.3], [-0.32, 0], [-0.32, 0], [-0.32, 0], [-0.32, 0]];

const things: WorldThing[] = [
  { key: 'gift', node: 'INT_BIRTHDAY_GIFT_LID', kind: 'lid', touch: ['DECOR_GIFT_BOX', 'DECOR_GIFT_RIBBON'] },
  ...DRAWERS.map((d, i): WorldThing => ({ key: `drawer${i + 1}`, node: d.node, with: [d.knob], kind: 'drawer', slide: DRAWER_SLIDES[i]!, build: DRAWER_BUILDS[i] })),
  { key: 'confetti', node: 'INT_BIRTHDAY_CONFETTI_SWITCH', kind: 'press' },
  { key: 'golden', node: 'INT_GOLDEN_BIRTHDAY_BUTTON', kind: 'press' },
  { key: 'cupcake', node: 'INT_KITCHEN_CUPCAKE', kind: 'lift' },
  { key: 'mirror', node: 'INT_VANITY_MIRROR', kind: 'glow', touch: ['DECOR_VANITY_MIRROR_FRAME'] },
  { key: 'projector', node: 'INT_CINEMA_PROJECTOR', kind: 'press' },
  { key: 'secretDoor', node: 'INT_SECRET_ROOM_DOOR', kind: 'door', gate: SECRET_GATE },
  { key: 'chest', node: 'DECOR_SECRET_CHEST_LID', kind: 'lid', touch: ['INT_SECRET_GOLDEN_CHEST'] },
  { key: 'finale', node: 'INT_SECRET_FINAL_BUTTON', kind: 'press' },
  { key: 'stairsUp', node: 'INT_STAIRS_UP_TRIGGER', kind: 'teleport', to: UPSTAIRS },
  { key: 'stairsDown', node: 'INT_STAIRS_DOWN_TRIGGER', kind: 'teleport', to: DOWNSTAIRS },
];

/** The name plates: each room's on its back wall, and the bedroom's over its doorway (both sides). */
const plates = (tier: Tier) => {
  const back = (key: RoomKey, x: number, y: number) => ({ key, at: [x, y, 5.522] as const, normal: [0, -1] as const, width: 1.3, height: 0.32 });
  const all = [
    back('living', 3.08, 2.89),
    back('bedroom', 6.9, 2.9),
    { key: 'bedroom', at: [4.512, 2.79, 2.795] as const, normal: [-1, 0] as const, width: 1.2, height: 0.34 },
    { key: 'bedroom', at: [4.728, 2.79, 2.795] as const, normal: [1, 0] as const, width: 1.2, height: 0.34 },
    back('kitchen', 11.75, 2.87),
    back('vanity', 2.38, 6.26),
    back('cinema', 7.0, 6.28),
    back('secret', 11.76, 6.31),
  ];
  return all.filter((t) => TIERS.indexOf(ROOMS.find((r) => r.key === t.key)!.tier) <= TIERS.indexOf(tier));
};

/** The ceilings: downstairs under the upper floor (round the stairwell), upstairs under the roof. */
function ceilingsOf(tier: Tier) {
  const c = (y: number, minX: number, maxX: number, minZ: number, maxZ: number) => ({ y, minX, maxX, minZ, maxZ });
  const DOWN = 3.185;
  const TOP = 6.57;
  const living = tier === 'basic' ? [c(DOWN, 0, 4.6, 0, 5.8)] : [c(DOWN, 0, 4.6, 0, 0.58), c(DOWN, 0, 4.6, 4.24, 5.8), c(DOWN, 0, 0.44, 0.58, 4.24), c(DOWN, 1.7, 4.6, 0.58, 4.24)];
  const ground = [...living, c(DOWN, 4.6, 9.2, 0, 5.8), ...(tier === 'basic' ? [] : [c(DOWN, 9.2, 13.8, 0, 5.8)])];
  const upper = tier === 'basic' ? [] : tier === 'vip' ? [c(TOP, 0, 4.6, 0, 5.8)] : [c(TOP, 0, 4.6, 0, 5.8), c(TOP, 4.6, 9.2, 0, 5.8), c(TOP, 9.2, 13.8, 0, 5.8)];
  return [...ground, ...upper];
}

const withPrefix = (prefix: string, names: string[]) => names.map((n) => prefix + n);

export function planFor(tier: Tier): WorldPlan {
  const rooms = ROOMS.filter((r) => TIERS.indexOf(r.tier) <= TIERS.indexOf(tier));
  return {
    // More spacious (owner, 2026-11-19): a wide view from each room's open front, so the visitor sees the room whole
    // (drawing the house bigger was tried: the furniture grows with it and crowds the view more).
    fov: 92,
    start: START,
    eye: EYE,
    surfaces: surfaces[tier],
    rooms: rooms.map((r) => {
      const column = [0, 1, 2, 0, 1, 2][ROOMS.indexOf(r)]!;
      return { key: r.key, y: r.floor ? UP : 0, rect: rect(column * 4.6, column * 4.6 + 4.6, 0, 5.8) };
    }),
    photos: rooms.flatMap((r) => Array.from({ length: r.photos }, (_, i) => `PHOTO_${r.node}_${String(i + 1).padStart(2, '0')}`)),
    photoParts: [
      { suffix: '_BORDER', role: 'frame' },
      { suffix: '_GLASS_EDGE', role: 'glass' },
    ],
    screens: SCREENS.slice(0, VIDEO_COUNT[tier]),
    texts: plates(tier),
    things,
    // The palette's six colours (the order matters: a mesh takes the first slot it matches).
    paint: {
      metal: ['FRONT_TRIM', 'PARTITION_GROUND_1_JAMB', 'PARTITION_GROUND_2_JAMB', 'PARTITION_UPPER_1_JAMB', 'PARTITION_UPPER_2_JAMB', 'UPPER_STAIR_RAIL', 'ROOF_GOLD_LINE', 'DRAWER_KNOB', 'NAMEPLATE_FRAME', 'DECOR_STAIR_RAIL_POST'],
      walls: ['WALL_LEFT', 'WALL_RIGHT', ...withPrefix('PARTITION_GROUND_', ['1_FRONT', '1_BACK', '1_LINTEL', '2_FRONT', '2_BACK', '2_LINTEL']), ...withPrefix('PARTITION_UPPER_', ['1_FRONT', '1_BACK', '1_LINTEL', '2_FRONT', '2_BACK', '2_LINTEL'])],
      // The roof is the ceiling upstairs: the light wall colour, not the accent.
      'walls-light': ['WALL_BACK', 'ROOF_TRIM'],
      accent: ['INT_DRAWER', 'DECOR_KITCHEN_UPPER_CABINET', 'DECOR_BED_HEADBOARD', 'DECOR_LIVING_SOFA_BACK', 'INT_SECRET_ROOM_DOOR'],
      floor: ['FLOOR_'],
      trim: ['FRONT_SILL', 'FRONT_COLUMN', 'CEILING_TRIM'],
    },
    // The ground floor's ceiling trim lies in the upper floor (it flickers there): left out under the upstairs rooms.
    // Less crowded (owner, 2026-11-19): no balloons; and the hearts and the kitchen's wall cupboards that covered photos.
    hidden: [
      'TEXT_ROOM',
      'TEXT_DOOR',
      'DECOR_BALLOON',
      'DECOR_VVIP_LIVING',
      'DECOR_WELCOME_HEART',
      'DECOR_BEDROOM_HEART',
      'DECOR_KITCHEN_UPPER_CABINET',
      ...(tier === 'basic' ? [] : ['CEILING_TRIM_01']),
      ...(tier === 'vvip' ? ['CEILING_TRIM_02', 'CEILING_TRIM_03'] : []),
    ],
    passThrough: ['RUG_', 'INT_STAIRS_', 'CAKE_FLAME', 'STAIR_STEP', 'STAIR_TREAD', 'DECOR_DOOR_BEDROOM_PLAQUE'],
    // Textured walls, ceilings and floors (owner, 2026-11-19).
    textures: { walls: { kind: 'plaster', size: 2.2 }, 'walls-light': { kind: 'plaster', size: 2.2 }, floor: { kind: 'tiles', size: 1.1 } },
    ceilings: { paint: 'walls-light', at: ceilingsOf(tier) },
    // Nothing drawn like code: round things smoothly round, soft things with soft edges.
    round: {
      spheres: ['CAKE_FLAME', 'DECOR_BEDROOM_STUFFED_TOY', 'DECOR_CINEMA_BEANBAG', 'DECOR_POPCORN', 'DECOR_MIRROR_BULB'],
      cylinders: [
        'DECOR_COFFEE_TABLE_LEG',
        'DECOR_CAKE_STAND',
        'DECOR_BIRTHDAY_CAKE',
        'CAKE_CANDLE',
        'DECOR_BEDROOM_LAMP',
        'DECOR_KITCHEN_SINK',
        'DECOR_KITCHEN_BISTRO_TABLE',
        'INT_KITCHEN_CUPCAKE',
        'DECOR_STAIR_RAIL_POST',
        'DECOR_VANITY_LEG',
        'DECOR_VANITY_STOOL',
        'DECOR_LIPSTICK',
        'FRONT_COLUMN',
      ],
      soft: ['DECOR_SOFA_CUSHION', 'DECOR_LIVING_SOFA', 'DECOR_BED_PILLOW', 'DECOR_BED_DUVET', 'DECOR_BED_MATTRESS', 'DECOR_BED_HEADBOARD'],
    },
    // The candles' flames as flames.
    glow: { CAKE_FLAME: '#ffc15c' },
    // The bedroom's photos clear of the bed's headboard (the side ones up, the middle one a little smaller).
    photoMoves: { PHOTO_BEDROOM_01: { dy: 0.42 }, PHOTO_BEDROOM_03: { dy: 0.42 }, PHOTO_BEDROOM_02: { scale: 0.86 } },
    sky: '#fbe7ef',
    light: { ambient: 1.25, sun: 1.1, exposure: 1.05 },
  };
}

/** The package's house: from how many photo places it sells (rooms), else from its videos. */
export function tierOf(photoPlaces: number, videoPlaces: number, hasPhotos: boolean): Tier {
  if (hasPhotos) return photoPlaces > PHOTO_COUNT.vip ? 'vvip' : photoPlaces > PHOTO_COUNT.basic ? 'vip' : 'basic';
  return videoPlaces > 1 ? 'vvip' : videoPlaces === 1 ? 'vip' : 'basic';
}
