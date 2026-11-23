/**
 * The things a visitor is given in a café's tour (owner, 2026-11-23): a cup of coffee that empties sip by sip, a cookie
 * that goes bite by bite, and the visitor's own hands that hold them (seen at the bottom of the screen). Made here, in
 * the tours' soft animation style, so every café's barista hands over the same ones.
 */
import * as THREE from 'three';

export const SIPS = 5;
export const BITES = 5;

const SKIN = '#d3a386';
const SLEEVE = '#8d8f94';

let latte: THREE.CanvasTexture | null = null;
/** The coffee's top: a latte with a heart of milk foam. */
function latteTexture() {
  if (latte) return latte;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 10, 64, 64, 64);
  grd.addColorStop(0, '#c08a5c');
  grd.addColorStop(0.75, '#9c6338');
  grd.addColorStop(1, '#6e3f20');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  g.fillStyle = '#f3e6d3';
  g.beginPath();
  g.moveTo(64, 92);
  g.bezierCurveTo(30, 66, 34, 36, 54, 40);
  g.bezierCurveTo(60, 41, 63, 46, 64, 52);
  g.bezierCurveTo(65, 46, 68, 41, 74, 40);
  g.bezierCurveTo(94, 36, 98, 66, 64, 92);
  g.fill();
  latte = new THREE.CanvasTexture(c);
  latte.colorSpace = THREE.SRGBColorSpace;
  return latte;
}

const mats = new Map<string, THREE.MeshStandardMaterial>();
function mat(color: string, rough = 0.6, metal = 0) {
  const key = `${color}/${rough}/${metal}`;
  let m = mats.get(key);
  if (!m) mats.set(key, (m = new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })));
  return m;
}

// ---------- the cup ----------
const CUP_H = 0.085;
const CUP_R0 = 0.03;
const CUP_R1 = 0.043;
const WALL = 0.004;

export type Cup = THREE.Group & { userData: { setLevel: (f: number) => void } };

/** A white ceramic cup of coffee with its handle (on its +x side), 8.5 cm tall; `setLevel(1)` full … `0` empty. */
export function makeCup(): Cup {
  const g = new THREE.Group() as Cup;
  const outer = [
    new THREE.Vector2(0.0001, 0),
    new THREE.Vector2(CUP_R0 - 0.004, 0),
    new THREE.Vector2(CUP_R0, 0.004),
    new THREE.Vector2(CUP_R1, CUP_H),
    new THREE.Vector2(CUP_R1 - WALL, CUP_H),
    new THREE.Vector2(CUP_R0 - WALL, WALL + 0.004),
    new THREE.Vector2(0.0001, WALL + 0.004),
  ];
  const body = new THREE.Mesh(new THREE.LatheGeometry(outer, 28), mat('#f7f5f0', 0.35));
  g.add(body);
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.0055, 8, 18, Math.PI * 1.15), mat('#f7f5f0', 0.35));
  handle.rotation.z = -Math.PI * 0.575;
  handle.position.set(CUP_R1 - 0.004, CUP_H * 0.52, 0);
  g.add(handle);
  // the coffee: a disc that sinks as it is drunk (its foam heart on top)
  const coffee = new THREE.Mesh(new THREE.CircleGeometry(1, 32), new THREE.MeshStandardMaterial({ map: latteTexture(), roughness: 0.35 }));
  coffee.rotation.x = -Math.PI / 2;
  g.add(coffee);
  // what is left at the bottom of an empty cup
  const stain = new THREE.Mesh(new THREE.CircleGeometry(CUP_R0 - WALL - 0.001, 24), mat('#5a3420', 0.3));
  stain.rotation.x = -Math.PI / 2;
  stain.position.y = WALL + 0.0045;
  stain.visible = false;
  g.add(stain);
  g.userData.setLevel = (f: number) => {
    const level = Math.max(0, Math.min(1, f));
    coffee.visible = level > 0.001;
    stain.visible = !coffee.visible;
    const y = WALL + 0.005 + (CUP_H - 0.017 - WALL) * level;
    const r = CUP_R0 - WALL + ((CUP_R1 - CUP_R0) * (y - WALL)) / (CUP_H - WALL) - 0.0005;
    coffee.position.y = y;
    coffee.scale.setScalar(r);
  };
  g.userData.setLevel(1);
  return g;
}

// ---------- the cookie ----------
const COOKIE_R = 0.045;
const COOKIE_T = 0.011;
/** Where each bite is taken (from the top down: the hand holds the cookie at the bottom), and how big it is. */
const BITE_AT: [number, number, number][] = [
  [0.012, COOKIE_R + 0.006, 0.025],
  [-0.021, COOKIE_R * 0.52, 0.026],
  [0.021, COOKIE_R * 0.2, 0.027],
  [-0.006, -COOKIE_R * 0.12, 0.028],
];
/** The cookie's outline once `bites` bites are taken: seen from a point near its bottom, the nearest edge each way. */
function cookieOutline(bites: number): THREE.Vector2[] {
  const o = new THREE.Vector2(0, -COOKIE_R * 0.85);
  const pts: THREE.Vector2[] = [];
  const n = 80;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const dx = Math.cos(a),
      dy = Math.sin(a);
    // out of the round cookie
    const b = o.x * dx + o.y * dy;
    let t = -b + Math.sqrt(b * b - (o.lengthSq() - COOKIE_R * COOKIE_R));
    // into a bite
    for (const [cx, cy, r] of BITE_AT.slice(0, bites)) {
      const ox = o.x - cx,
        oy = o.y - cy;
      const bb = ox * dx + oy * dy;
      const disc = bb * bb - (ox * ox + oy * oy - r * r);
      if (disc <= 0) continue;
      const t0 = -bb - Math.sqrt(disc);
      if (t0 > 0 && t0 < t) t = t0;
    }
    pts.push(new THREE.Vector2(o.x + dx * t, o.y + dy * t));
  }
  return pts;
}
const CHIPS: [number, number][] = [
  [0.015, 0.025],
  [-0.018, 0.02],
  [0.002, 0.004],
  [0.025, -0.008],
  [-0.026, -0.012],
  [-0.004, -0.024],
  [0.017, -0.03],
  [-0.008, 0.036],
];
const insideCookie = (x: number, y: number, bites: number) =>
  x * x + y * y < (COOKIE_R - 0.004) ** 2 && BITE_AT.slice(0, bites).every(([cx, cy, r]) => (x - cx) ** 2 + (y - cy) ** 2 > (r + 0.003) ** 2);

export type Cookie = THREE.Group & { userData: { setBites: (n: number) => void } };

/** A golden chocolate-chip cookie, 9 cm across, standing in its XY plane (facing +z); `setBites(n)` takes n bites. */
export function makeCookie(): Cookie {
  const g = new THREE.Group() as Cookie;
  const dough = mat('#c68a4c', 0.85);
  const chip = mat('#3b2416', 0.5);
  let body: THREE.Mesh | null = null;
  const chips: THREE.Mesh[] = [];
  for (const [x, y] of CHIPS)
    for (const side of [1, -1]) {
      const c = new THREE.Mesh(new THREE.SphereGeometry(0.0055, 8, 6), chip);
      c.position.set(x, y, (side * COOKIE_T) / 2 + side * 0.0012);
      c.scale.set(1, 1, 0.55);
      g.add(c);
      chips.push(c);
    }
  g.userData.setBites = (bites: number) => {
    if (body) {
      g.remove(body);
      body.geometry.dispose();
      body = null;
    }
    g.visible = bites < BITES;
    if (!g.visible) return;
    const shape = new THREE.Shape(cookieOutline(bites));
    const geo = new THREE.ExtrudeGeometry(shape, { depth: COOKIE_T - 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 2, curveSegments: 4 });
    geo.translate(0, 0, -(COOKIE_T - 0.004) / 2);
    body = new THREE.Mesh(geo, dough);
    g.add(body);
    let k = 0;
    for (const [x, y] of CHIPS) {
      const on = insideCookie(x, y, bites);
      chips[k++]!.visible = on;
      chips[k++]!.visible = on;
    }
  };
  g.userData.setBites(0);
  return g;
}

// ---------- the visitor's hands ----------
function capsule(r: number, len: number, m: THREE.Material) {
  return new THREE.Mesh(new THREE.CapsuleGeometry(r, len, 4, 10), m);
}

/**
 * The visitor's hand holding a cup (round its body, the fingers across its front) or a cookie (pinched at its bottom),
 * with the wrist and a bit of sleeve going down out of the picture. `side` 1: the right hand, −1: the left.
 * The hand is placed round a thing at the group's origin (a cup standing on it, a cookie centred on it).
 */
export function makeHand(side: 1 | -1, grip: 'cup' | 'cookie'): THREE.Group {
  const g = new THREE.Group();
  const skin = mat(SKIN, 0.7);
  const add = (m: THREE.Object3D, x: number, y: number, z: number, rx = 0, ry = 0, rz = 0) => {
    m.position.set(x * side, y, z);
    m.rotation.set(rx, ry * side, rz * side);
    g.add(m);
    return m;
  };
  if (grip === 'cup') {
    // the palm on the cup's outer side, four fingers curling across its front, the thumb over the top edge
    add(new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.082, 0.07), skin), 0.058, 0.04, 0.004);
    for (let i = 0; i < 4; i++) {
      const f = capsule(0.0085, 0.05, skin);
      add(f, 0.024, 0.066 - i * 0.017, 0.038, 0, 0, Math.PI / 2 + 0.12 * side);
    }
    add(capsule(0.009, 0.034, skin), 0.035, 0.074, -0.012, 0.4, 0, 0.9);
    // the wrist and the sleeve, toward the bottom corner of the picture
    add(capsule(0.024, 0.12, skin), 0.09, -0.04, 0.03, 0.5, 0, 0.55);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.04, 0.16, 16), mat(SLEEVE, 0.95)), 0.15, -0.14, 0.08, 0.5, 0, 0.55);
  } else {
    // thumb in front, two fingers behind: the cookie held at its bottom edge
    add(new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.065, 0.028), skin), 0.012, -0.072, -0.012, 0.15, 0, -0.25);
    add(capsule(0.0095, 0.03, skin), 0.004, -0.046, 0.013, 0.2, 0, -0.35);
    for (let i = 0; i < 3; i++) add(capsule(0.0088, 0.036, skin), -0.012 + i * 0.016, -0.04, -0.016, -0.3, 0, -0.15);
    add(capsule(0.022, 0.12, skin), 0.05, -0.15, 0.0, 0.25, 0, -0.45);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.038, 0.16, 16), mat(SLEEVE, 0.95)), 0.1, -0.26, 0.02, 0.25, 0, -0.45);
  }
  return g;
}

/** Frees what a prop made (its shapes; the shared materials stay for the next one). */
export function disposeProp(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.isMesh) m.geometry.dispose();
  });
  o.removeFromParent();
}
