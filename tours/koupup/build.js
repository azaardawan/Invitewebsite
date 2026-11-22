// KOUPUP café, rebuilt from the owner's 3D scan (21_11_2026.glb) in the scan's own coordinates (metres, Y up), so
// every wall, opening, step and piece of furniture is where the scan has it. Animation style: soft shapes, flat colours.
import * as THREE from 'three';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { root, mat, slab, rbox, cyl, rod, ball, add, group, tileTex, speckleTex, plasterTex, woodTex, stripesTex, drawTex, GLASS, wallPicture, contactShadow, rr, rnd } from './lib.js';
import * as F from './furniture.js';
const { C, M } = F;

// ---------------- measured levels ----------------
const FI = -1.24; // inside floor
const FT = -1.45; // terrace and its pavement
const CI = 1.9; // inside ceiling
const COVE = 1.62; // the lower band round each room's ceiling (with its LED strip)
const CT = 1.65; // terrace ceiling
const CB = 1.55; // back area ceiling
const CW = 1.2; // toilets' ceiling
const XW = -4.1; // inside face of the west wall
const XF = 2.1; // inside face of the front (east) wall; its outside face is at 2.3
const ZN = -11.2; // inside face of the north wall
const ZS = 11.5; // inside face of the south wall
const XEDGE = 5.6; // the terrace's edge, above the street
/** The street: it falls to the south and away from the café. */
const streetY = (x, z) => -2.5 - 0.09 * (x - 6) - 0.022 * (z + 15);

// ---------------- materials ----------------
const tex = {
  tileCream: tileTex('#f0e6d3', '#d8cab0', ['#fffaf0', '#e0d2ba']),
  tileTaupe: tileTex('#8b8276', '#6f675d', ['#9d9488', '#7a7268']),
  terrazzo: speckleTex('#ddd4c4', ['#b9ae9c', '#f2ece1', '#a89c88', '#c7bba7'], 4000),
  asphalt: speckleTex('#55585d', ['#3f4246', '#6a6d72', '#4b4e52'], 6000),
  concrete: speckleTex('#b9b4aa', ['#a29d93', '#cfcac0'], 3000),
  plasterIn: plasterTex('#f4e5c3'),
  plasterOut: plasterTex('#eceae4'),
  plasterGrey: plasterTex('#d9d6cf'),
  ceiling: plasterTex('#f8edd5'),
  stone: speckleTex('#d3cabb', ['#bfb4a2', '#e2dacd'], 2500),
};
const W = {
  inner: mat('#ffffff', { map: tex.plasterIn }),
  outer: mat('#ffffff', { map: tex.plasterOut }),
  grey: mat('#ffffff', { map: tex.plasterGrey }),
  ceiling: mat('#ffffff', { map: tex.ceiling }),
  floorCream: mat('#ffffff', { map: tex.tileCream, rough: 0.55 }),
  floorTaupe: mat('#ffffff', { map: tex.tileTaupe, rough: 0.6 }),
  terrazzo: mat('#ffffff', { map: tex.terrazzo, rough: 0.8 }),
  asphalt: mat('#ffffff', { map: tex.asphalt, rough: 0.95 }),
  concrete: mat('#ffffff', { map: tex.concrete, rough: 0.95 }),
  stone: mat('#ffffff', { map: tex.stone, rough: 0.9 }),
  frame: mat('#22262a', { rough: 0.5, metal: 0.3 }),
  led: mat('#fff0cf', { emissive: '#ffe8b8', ei: 2.0 }),
  downlight: mat('#ffffff', { emissive: '#fff6e6', ei: 1.6 }),
};

// ---------------- the building ----------------
// Foundation (the café stands on a raised ground floor).
slab(-4.3, 2.3, -3.4, FI - 0.02, -11.4, 11.7, W.grey, 'foundation', 2);
// Inside floors: cream porcelain in the rooms, taupe in the bar and toilets.
slab(XW, XF, FI - 0.02, FI, ZN, 4.6, W.floorCream, 'floor_rooms', 0.6);
slab(XW, XF, FI - 0.02, FI, 4.6, ZS, W.floorTaupe, 'floor_back', 0.6);

// Walls.
slab(-4.3, XW, FI, CI + 0.15, -11.4, 11.7, W.inner, 'wall_west', 2);
slab(-4.3, 2.3, FI, CI + 0.15, -11.4, ZN, W.inner, 'wall_north', 2);
slab(-4.3, 2.3, FI, CI + 0.15, ZS, 11.7, W.inner, 'wall_south', 2);

// The front: glass along the north lounge, a window, the glass door, the bar's window.
function front(z0, z1, y0, y1, name) {
  slab(XF, 2.3, y0, y1, z0, z1, W.outer, name, 2);
}
const glassPane = (z0, z1, y0, y1) => {
  slab(XF + 0.08, XF + 0.11, y0, y1, z0, z1, GLASS(), 'glass');
  // frame
  slab(XF + 0.05, XF + 0.14, y0 - 0.04, y0 + 0.02, z0, z1, W.frame, 'frame');
  slab(XF + 0.05, XF + 0.14, y1 - 0.02, y1 + 0.04, z0, z1, W.frame, 'frame');
  slab(XF + 0.05, XF + 0.14, y0, y1, z0, z0 + 0.06, W.frame, 'frame');
  slab(XF + 0.05, XF + 0.14, y0, y1, z1 - 0.06, z1, W.frame, 'frame');
};
front(-11.4, -11.0, FT, CI + 0.15, 'front_corner');
front(-11.0, -3.4, FT, FI + 0.05, 'front_curb');
front(-11.0, -3.4, 1.6, CI + 0.15, 'front_header');
for (let k = 0; k < 4; k++) {
  const z0 = -11.0 + k * 1.9;
  glassPane(z0, z0 + 1.9, FI + 0.05, 1.6);
}
front(-3.4, -2.6, FT, CI + 0.15, 'front_pier');
front(-2.6, 2.8, FT, -0.3, 'front_sill');
front(-2.6, 2.8, 1.05, CI + 0.15, 'front_head');
glassPane(-2.6, 2.8, -0.3, 1.05);
front(2.8, 3.7, FT, CI + 0.15, 'front_pier');
// The entrance: an open glass door (a frame and the door leaf turned back against the wall).
front(3.7, 4.7, 0.95, CI + 0.15, 'door_head');
slab(XF, 2.34, FT, 0.95, 3.7, 3.76, W.frame, 'door_frame');
slab(XF, 2.34, FT, 0.95, 4.64, 4.7, W.frame, 'door_frame');
slab(XF, 2.34, 0.89, 0.95, 3.7, 4.7, W.frame, 'door_frame');
{
  const leaf = new THREE.Group();
  leaf.position.set(2.34, FT, 4.7);
  leaf.rotation.y = -Math.PI / 2 + 0.1;
  add(leaf);
  rbox(0.05, 2.3, 0.04, 0.01, W.frame, 0.025, 0, 0.02, 0, leaf);
  rbox(0.05, 2.3, 0.04, 0.01, W.frame, 0.9, 0, 0.02, 0, leaf);
  rbox(0.92, 0.05, 0.04, 0.01, W.frame, 0.46, 2.25, 0.02, 0, leaf);
  rbox(0.92, 0.05, 0.04, 0.01, W.frame, 0.46, 0, 0.02, 0, leaf);
  const g = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.2, 0.012), GLASS());
  g.position.set(0.46, 1.15, 0.02);
  leaf.add(g);
  rbox(0.03, 0.5, 0.05, 0.01, mat('#b5b7b8', { rough: 0.3, metal: 0.8 }), 0.82, 0.85, 0.06, 0, leaf);
}
// the step up at the door
slab(XF, 2.3, FT, FI, 3.7, 4.7, W.stone, 'door_step', 1);
front(4.7, 5.7, FT, CI + 0.15, 'front_pier');
front(5.7, 8.2, FT, -0.1, 'front_sill');
front(5.7, 8.2, 0.95, CI + 0.15, 'front_head');
glassPane(5.7, 8.2, -0.1, 0.95);
front(8.2, 11.7, FT, CI + 0.15, 'front_south');

// Ceilings: a raised middle with a lower band round each room and a warm LED line where they meet.
slab(XW, XF, CI, CI + 0.15, ZN, 4.6, W.ceiling, 'ceiling', 2);
function cove(x0, x1, z0, z1) {
  const b = 0.35;
  slab(x0, x1, COVE, CI, z0, z0 + b, W.ceiling, 'cove', 2);
  slab(x0, x1, COVE, CI, z1 - b, z1, W.ceiling, 'cove', 2);
  slab(x0, x0 + b, COVE, CI, z0 + b, z1 - b, W.ceiling, 'cove', 2);
  slab(x1 - b, x1, COVE, CI, z0 + b, z1 - b, W.ceiling, 'cove', 2);
  // LED strips on the band's inner edge
  slab(x0 + b, x1 - b, COVE - 0.03, COVE - 0.005, z0 + b - 0.02, z0 + b, W.led, 'led');
  slab(x0 + b, x1 - b, COVE - 0.03, COVE - 0.005, z1 - b, z1 - b + 0.02, W.led, 'led');
  slab(x0 + b - 0.02, x0 + b, COVE - 0.03, COVE - 0.005, z0 + b, z1 - b, W.led, 'led');
  slab(x1 - b, x1 - b + 0.02, COVE - 0.03, COVE - 0.005, z0 + b, z1 - b, W.led, 'led');
}
cove(XW, XF, ZN, -3.2);
cove(XW, XF, -3.2, 4.6);
function downlight(x, z, y = CI) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 20), W.downlight);
  m.position.set(x, y - 0.006, z);
  m.name = 'NOCOLLIDE_light';
  add(m);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.01, 6, 20), mat('#d7d2c8'));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(x, y - 0.008, z);
  ring.name = 'NOCOLLIDE_light';
  add(ring);
}
for (const x of [-2.9, -0.6, 1.0]) for (const z of [-10.3, -7.6, -4.6]) downlight(x, z);
for (const x of [-2.9, -0.6, 1.0]) for (const z of [-2.2, 0.8, 3.6]) downlight(x, z);

// Between the north lounge and the middle room: open, with a beam and two short walls.
slab(XW, XF, 1.5, CI, -3.35, -3.05, W.ceiling, 'beam');
slab(XW, -3.75, FI, CI, -3.35, -3.05, W.inner, 'pier');
slab(1.6, XF, FI, CI, -3.35, -3.05, W.inner, 'pier');
// Into the back area: a beam, then its lower ceiling.
slab(XW, XF, CB, CI, 4.5, 4.7, W.ceiling, 'beam');
slab(XW, XF, CB, CI + 0.15, 4.7, ZS, W.ceiling, 'ceiling_back', 2);
for (const [x, z] of [
  [-0.3, 6.8],
  [1.2, 6.8],
  [-3.2, 6.6],
])
  downlight(x, z, CB);
slab(XW, XF, CB - 0.03, CB - 0.005, 4.7, 4.72, W.led, 'led');

// The corridor to the toilets (west), the bar (east), the back wall with its wooden door.
slab(-2.45, -2.3, FI, CB, 5.9, 8.6, W.inner, 'wall_corridor', 2);
slab(-1.3, XF, FI, CB, 8.6, 8.75, W.inner, 'wall_back', 2);
{
  // the dark brown door behind the bar (owner's photo), between the drinks fridge and the syrup counter
  const door = rbox(0.85, 2.05, 0.04, 0.01, mat('#4f3b2e', { rough: 0.7 }), 0.78, FI, 8.58);
  door.name = 'door_store';
  cyl(0.025, 0.025, 0.04, mat('#c3c4c2', { metal: 0.8, rough: 0.3 }), 0.45, FI + 1.0, 8.55, 12).rotation.x = Math.PI / 2;
}
// Toilets: two small rooms with their doors open.
// their front wall, with a doorway into each (doors open against the inside wall)
for (const [x0, x1] of [
  [XW, -3.7],
  [-2.95, -2.4],
  [-1.65, -1.3],
])
  slab(x0, x1, FI, CB, 8.6, 8.75, W.inner, 'wall_wc_front', 2);
for (const [x0, x1] of [
  [-3.7, -2.95],
  [-2.4, -1.65],
]) {
  slab(x0, x1, FI + 2.05, CB, 8.6, 8.75, W.inner, 'wall_wc_front', 2);
  rbox(0.04, 2.02, 0.72, 0.01, F.M.woodLight, x0 + 0.04, FI, 8.75 + 0.38, 0, undefined, 'door_wc');
}
slab(-2.75, -2.6, FI, CB, 8.75, ZS, W.inner, 'wall_wc_mid', 2);
slab(-1.45, -1.3, FI, CB, 8.75, ZS, W.inner, 'wall_wc_east', 2);
slab(XW, -1.3, CW, CB, 8.75, ZS, W.ceiling, 'ceiling_wc', 2);
downlight(-3.4, 10.1, CW);
downlight(-2.0, 10.1, CW);
for (const [cx, name] of [
  [-3.3, 'wc_a'],
  [-2.0, 'wc_b'],
]) {
  const g = group(cx, FI, 11.15, Math.PI, name);
  rbox(0.38, 0.4, 0.5, 0.12, mat('#fbfbf8', { rough: 0.3 }), 0, 0, 0.05, 0, g);
  rbox(0.38, 0.35, 0.18, 0.05, mat('#fbfbf8', { rough: 0.3 }), 0, 0.38, -0.2, 0, g);
  rbox(0.4, 0.04, 0.45, 0.04, mat('#f0efe9', { rough: 0.3 }), 0, 0.4, 0.07, 0, g);
}
rbox(0.4, 0.15, 0.32, 0.06, mat('#fbfbf8', { rough: 0.3 }), -3.85, FI + 0.75, 9.6);
rbox(0.4, 0.15, 0.32, 0.06, mat('#fbfbf8', { rough: 0.3 }), -1.65, FI + 0.75, 9.6);

// ---------------- the terrace, its roof and the street ----------------
const STAIRS = [
  { z0: -3.9, z1: -2.3 },
  { z0: 9.95, z1: 11.75 },
];
// Terrace platform (stone pavement), cut where the two stairs go down.
function platform(x0, x1, z0, z1) {
  slab(x0, x1, -3.5, FT, z0, z1, W.terrazzo, 'terrace', 1);
}
platform(2.3, XEDGE, -15.5, -3.9);
platform(2.3, 4.4, -3.9, -2.3);
platform(2.3, XEDGE, -2.3, 9.95);
platform(2.3, 4.4, 9.95, 11.75);
// The two staircases down to the street: 8 steps each.
for (const s of STAIRS) {
  const zc = (s.z0 + s.z1) / 2;
  const bottom = streetY(6.6, zc);
  const n = 8,
    rise = (FT - bottom) / n,
    run = (6.6 - 4.4) / n;
  for (let i = 0; i < n; i++) {
    const top = FT - (i + 1) * rise;
    slab(4.4 + i * run, 4.4 + (i + 1) * run, bottom - 0.4, top, s.z0, s.z1, W.stone, 'step', 1);
    slab(4.4 + i * run, 4.4 + i * run + 0.03, top - 0.01, top + 0.008, s.z0, s.z1, mat('#b6ab98'), 'NOCOLLIDE_nosing');
  }
  // side walls of the stairs where the terrace is beside them
}
// Terrace roof (and the café's upper floor above it).
slab(2.3, 4.7, CT, 1.9, -11.75, 11.75, W.ceiling, 'terrace_roof', 2);
slab(4.6, 4.72, 1.45, 1.95, -11.75, 11.75, W.outer, 'roof_fascia', 2);
// track lights along the terrace ceiling
for (const [z0, z1] of [
  [-10.5, -4],
  [-1.5, 3],
  [5, 10.5],
]) {
  slab(3.28, 3.32, CT - 0.04, CT, z0, z1, W.frame, 'NOCOLLIDE_track');
  for (let z = z0 + 0.6; z < z1; z += 1.4) {
    const s = cyl(0.035, 0.045, 0.13, W.frame, 3.3, CT - 0.17, z, 14, undefined, 'NOCOLLIDE_spot');
    s.rotation.z = 0.5;
    const lamp = cyl(0.03, 0.03, 0.005, W.downlight, 3.3, CT - 0.175, z, 14, undefined, 'NOCOLLIDE_spot');
    lamp.rotation.z = 0.5;
  }
}
// Terrace south end wall.
slab(2.3, 4.7, FT, 1.9, 11.55, 11.75, W.outer, 'terrace_end', 2);
// The corner pillar with KOUP on it.
slab(2.9, 4.0, FT, CT, -11.75, -11.3, W.outer, 'pillar_koup', 1);

// Upper floor of the building (above the café, seen from the street).
slab(-4.3, 2.3, 1.9, 4.9, -11.75, 11.75, W.outer, 'upper', 2);
slab(-4.3, 4.75, 4.9, 5.1, -11.85, 11.85, W.grey, 'roof', 2);
for (let z = -10.2; z < 10.5; z += 2.6) {
  slab(2.3, 2.34, 2.7, 4.2, z, z + 1.3, mat('#4a5a66', { rough: 0.3 }), 'upper_window');
  slab(2.3, 2.38, 2.62, 2.7, z - 0.06, z + 1.36, W.outer, 'upper_sill');
}

// Street level: the lower pavement, the road, and the paving south of the terrace.
function slope(x0, x1, z0, z1, material, lift = 0, name = 'street', tile = 2) {
  const nx = Math.ceil((x1 - x0) / 1),
    nz = Math.ceil((z1 - z0) / 1);
  const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, nx, nz);
  g.rotateX(-Math.PI / 2);
  const p = g.attributes.position,
    uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + (x0 + x1) / 2,
      z = p.getZ(i) + (z0 + z1) / 2;
    p.setXYZ(i, x, streetY(x, z) + lift, z);
    uv.setXY(i, x / tile, z / tile);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, material);
  m.name = name;
  return add(m);
}
slope(XEDGE, 7.0, -16, 15.5, W.concrete, 0.12, 'pavement_low');
// curb face
for (let z = -16; z < 15.5; z += 1) {
  const y0 = streetY(7, z),
    y1 = streetY(7, z + 1);
  slab(6.98, 7.04, Math.min(y0, y1) - 0.1, Math.max(y0, y1) + 0.12, z, z + 1, mat('#cfcac0'), 'curb');
}
slope(7.0, 13.5, -16, 15.5, W.asphalt, 0, 'road');
// lane markings
for (let z = -15; z < 15; z += 3) {
  const m = slope(10.15, 10.3, z, z + 1.6, mat('#e9e6dc'), 0.01, 'NOCOLLIDE_line', 1);
  m.renderOrder = 1;
}
slope(-4.3, XEDGE, 11.75, 15.5, W.concrete, 0.12, 'paving_south');
slope(-4.3, 2.3, -16, -11.4, W.concrete, 0.12, 'paving_north');
// The terrace's face above the street (a white wall).
for (const [z0, z1] of [
  [-15.5, -3.9],
  [-2.3, 9.95],
]) {
  slab(XEDGE - 0.02, XEDGE + 0.02, -3.5, FT - 0.01, z0, z1, W.grey, 'terrace_face', 2);
}
slab(2.3, XEDGE, -3.5, FT - 0.01, -15.55, -15.5, W.outer, 'terrace_face', 2);

// The sky, and ground far away (never walked on).
{
  const sky = drawTex(64, 512, (g, w, h) => {
    const grd = g.createLinearGradient(0, 0, 0, h);
    grd.addColorStop(0, '#7fb4e6');
    grd.addColorStop(0.45, '#bcd9f2');
    grd.addColorStop(0.5, '#f3e9da');
    grd.addColorStop(1, '#e8dccb');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
  });
  const m = new THREE.Mesh(new THREE.SphereGeometry(80, 32, 16), mat('#ffffff', { map: sky, basic: true, side: THREE.DoubleSide }));
  m.name = 'NOCOLLIDE_sky';
  add(m);
  const ground = new THREE.Mesh(new THREE.CircleGeometry(75, 48), mat('#cdbfa8', { rough: 1 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -3.6;
  ground.name = 'NOCOLLIDE_ground';
  add(ground);
}
// Invisible walls: visitors stay on this street.
for (const [x0, x1, z0, z1] of [
  [13.4, 13.5, -16, 15.5],
  [-4.3, 13.5, -16.1, -16],
  [-4.3, 13.5, 15.5, 15.6],
])
  slab(x0, x1, -4, 3, z0, z1, mat('#000000'), 'COLLIDER_bounds');

// ---------------- signs ----------------
export async function signs() {
  const font = await new FontLoader().loadAsync('serif.json');
  const teal = mat('#24393f', { rough: 0.5 });
  const word = (text, size, material) => {
    const g = new TextGeometry(text, { font, size, depth: 0.02, curveSegments: 3 });
    g.computeBoundingBox();
    g.translate(-(g.boundingBox.max.x + g.boundingBox.min.x) / 2, 0, 0);
    return new THREE.Mesh(g, material);
  };
  // KOUP on the lounge's north wall (owner: KOUP, not KOUPUP)
  const k = word('KOUP', 0.24, teal);
  k.position.set(-0.9, FI + 1.78, ZN + 0.005);
  k.name = 'NOCOLLIDE_sign';
  add(k);
  // K O U P down the corner pillar, facing the terrace
  'KOUP'.split('').forEach((ch, i) => {
    const l = word(ch, 0.3, mat('#1c1c1c', { rough: 0.5 }));
    l.position.set(3.45, CT - 0.55 - i * 0.48, -11.3 + 0.005);
    l.name = 'NOCOLLIDE_sign';
    add(l);
  });
  // کوپ on the middle room's west wall
  await new FontFace('ar', 'url(arabic.woff2)', { weight: '100 900' }).load().then((f) => document.fonts.add(f));
  const ar = drawTex(512, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.fillStyle = '#1f1f1f';
    g.font = '800 170px ar';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = 'rtl';
    g.fillText('کوپ', w / 2, h / 2 + 10);
  });
  ar.userData.mimeType = 'image/png';
  wallPicture(ar, 0.9, 0.45, XW + 0.01, FI + 1.65, 1.6, '+x', 'NOCOLLIDE_sign', true);
}
