/**
 * The opening's layout, in a 1920 × 1080 artboard (generated from the design mock-up; positions are image centres).
 * Each key is [time, x, y, scale %, opacity %, rotation °] on the opening's own clock (0 → 3): 0–2 the camera flies to
 * Delal Bridge and through its arch, 2–2.3 a wall of falling leaves covers the screen, the scene changes behind it at
 * 2.32 and the leaves fall away to reveal the gateway and the card by 3. `pkeys` are a phone's (portrait) keys.
 * Scale % is of the layer's design size in BASE (the shipped files may be smaller).
 */
export type Key = readonly [number, number, number, number, number, number];
export type Layer = {
  n: string;
  file: string | null;
  group: 'world' | 'invite' | 'trees';
  kind: 'image' | 'haze' | 'wall';
  keys: readonly Key[];
  pkeys?: readonly Key[];
  flip?: boolean;
  shadow?: readonly [number, number, number, number];
};

export const BASE: Record<string, readonly [number, number]> = {
  sky: [1672, 941],
  'cloud-a': [1574, 587],
  'cloud-b': [1235, 451],
  'mountains-far': [2172, 272],
  hills: [2172, 370],
  river: [2600, 300],
  bridge: [2158, 626],
  'tree-left': [708, 1024],
  'tree-right': [712, 1024],
  bushes: [2172, 348],
  arch: [1494, 847],
  garland: [2158, 705],
  'pillar-left': [345, 1757],
  'pillar-right': [371, 1758],
  'card-paper': [1443, 1011],
  'leaf-1': [481, 259],
  'leaf-2': [488, 438],
  'leaf-3': [320, 213],
  'leaf-4': [465, 276],
  'leaf-5': [363, 288],
};

export const LAYERS: readonly Layer[] = [
  {
    n: 'cloud_a',
    file: 'cloud-a',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 420, 230, 45.0, 100, 0],
      [0.5, 400, 141, 46.7, 100, 0],
      [1, 347, -52, 51.1, 100, 0],
      [1.5, 242, -337, 59.9, 100, 0],
      [2, 80, -635, 73.3, 100, 0],
    ],
  },
  {
    n: 'cloud_b',
    file: 'cloud-b',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 1500, 170, 50.0, 100, 0],
      [0.5, 1520, 79, 51.9, 100, 0],
      [1, 1573, -120, 56.8, 100, 0],
      [1.5, 1678, -417, 66.5, 100, 0],
      [2, 1840, -733, 81.5, 100, 0],
    ],
  },
  {
    n: 'cloud_c',
    file: 'cloud-a',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 1660, 430, 30.0, 90, 0],
      [0.5, 1678, 355, 30.7, 90, 0],
      [1, 1723, 198, 32.7, 90, 0],
      [1.5, 1814, -13, 36.6, 90, 0],
      [2, 1954, -200, 42.6, 90, 0],
    ],
    flip: true,
  },
  {
    n: 'cloud_d',
    file: 'cloud-b',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 260, 480, 30.0, 90, 0],
      [0.5, 243, 407, 30.7, 90, 0],
      [1, 197, 253, 32.7, 90, 0],
      [1.5, 106, 48, 36.6, 90, 0],
      [2, -34, -129, 42.6, 90, 0],
    ],
    flip: true,
  },
  {
    n: 'mountains_far',
    file: 'mountains-far',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 960, 930, 95.0, 100, 0],
      [0.5, 960, 867, 103.3, 100, 0],
      [1, 960, 738, 124.9, 100, 0],
      [1.5, 960, 585, 168.2, 100, 0],
      [2, 960, 488, 234.6, 100, 0],
    ],
  },
  {
    n: 'haze',
    file: null,
    group: 'world',
    kind: 'haze',
    keys: [
      [0, 960, 925, 100.0, 70, 0],
      [0.5, 960, 861, 110.0, 70, 0],
      [1, 960, 731, 136.0, 70, 0],
      [1.5, 960, 573, 188.0, 70, 0],
      [2, 960, 470, 268.0, 70, 0],
    ],
  },
  {
    n: 'river',
    file: 'river',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 960, 1110, 100.0, 100, 0],
      [0.5, 960, 1080, 120.0, 100, 0],
      [1, 960, 1040, 172.0, 100, 0],
      [1.5, 960, 1061, 276.0, 100, 0],
      [2, 960, 1233, 436.0, 100, 0],
    ],
  },
  {
    n: 'bridge',
    file: 'bridge',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 960, 925, 55.0, 100, 0],
      [0.5, 960, 857, 68.8, 100, 0],
      [1, 960, 717, 104.5, 100, 0],
      [1.5, 960, 539, 176.0, 100, 0],
      [2, 960, 405, 286.0, 100, 0],
    ],
    shadow: [0, 10, 18, 0.25],
  },
  {
    n: 'mountains_near',
    file: 'hills',
    group: 'world',
    kind: 'image',
    keys: [
      [0, 1019, 906, 105.0, 100, 0],
      [0.5, 1037, 830, 137.8, 100, 0],
      [1, 1085, 670, 223.1, 100, 0],
      [1.5, 1181, 453, 393.8, 100, 0],
      [2, 1329, 259, 656.2, 100, 0],
    ],
  },
  {
    n: 'wall',
    file: null,
    group: 'invite',
    kind: 'wall',
    keys: [[0, 960, 540, 100, 100, 0]],
  },
  {
    n: 'card_paper',
    file: 'card-paper',
    group: 'invite',
    kind: 'image',
    keys: [
      [3, 960, 650, 60, 100, 0],
      [4, 960, 545, 146, 100, 0],
    ],
    shadow: [0, 14, 30, 0.3],
  },
  {
    n: 'pillar_left',
    file: 'pillar-left',
    group: 'invite',
    kind: 'image',
    keys: [
      [3, 412, 1231, 62, 100, 0],
      [4, -420, 1231, 95, 100, 0],
    ],
    shadow: [0, 16, 26, 0.38],
  },
  {
    n: 'pillar_right',
    file: 'pillar-right',
    group: 'invite',
    kind: 'image',
    keys: [
      [3, 1510, 1235, 62, 100, 0],
      [4, 2340, 1235, 95, 100, 0],
    ],
    shadow: [0, 16, 26, 0.38],
  },
  {
    n: 'arch_top',
    file: 'arch',
    group: 'invite',
    kind: 'image',
    keys: [
      [3, 960, 400, 92, 100, 0],
      [4, 960, -520, 190, 100, 0],
    ],
    shadow: [0, 16, 26, 0.38],
  },
  {
    n: 'garland',
    file: 'garland',
    group: 'invite',
    kind: 'image',
    keys: [
      [2.5, 960, -350, 64, 100, 0],
      [3, 960, 300, 64, 100, 0],
      [4, 960, -560, 110, 100, 0],
    ],
    shadow: [0, 12, 16, 0.3],
  },
  {
    n: 'trees_left',
    file: 'tree-left',
    group: 'trees',
    kind: 'image',
    keys: [
      [1.5, -600, 540, 140, 100, 0],
      [2, 380, 540, 140, 100, 0],
      [2.6, 380, 540, 140, 100, 0],
      [3, -600, 540, 140, 100, 0],
    ],
  },
  {
    n: 'trees_right',
    file: 'tree-right',
    group: 'trees',
    kind: 'image',
    keys: [
      [1.5, 2520, 540, 140, 100, 0],
      [2, 1540, 540, 140, 100, 0],
      [2.6, 1540, 540, 140, 100, 0],
      [3, 2520, 540, 140, 100, 0],
    ],
  },
  {
    n: 'bushes',
    file: 'bushes',
    group: 'trees',
    kind: 'image',
    keys: [
      [1.5, 960, 1300, 100, 100, 0],
      [2, 960, 940, 100, 100, 0],
      [2.6, 960, 940, 100, 100, 0],
      [3, 960, 1300, 100, 100, 0],
    ],
  },
];

export const GROUPS: Partial<Record<Layer['group'], readonly (readonly [number, number])[]>> = {
  invite: [
    [0, 0],
    [2.31, 0],
    [2.33, 100],
  ],
  trees: [
    [0, 100],
    [2.31, 100],
    [2.33, 0],
  ],
};

/** Opening clock: the end (the gateway and the card) and the moment the scene changes behind the leaves. */
export const T_END = 3;
export const T_SWITCH = 2.32;
