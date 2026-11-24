/**
 * The things a visitor is given in a café's tour (owner, 2026-11-23): a cup of coffee that empties sip by sip, a cookie
 * that goes bite by bite, and the visitor's own hands that hold them (seen at the bottom of the screen). Made here, in
 * the tours' soft animation style, so every café's barista hands over the same ones.
 */
import * as THREE from 'three';
import { HAND_POSES, type HandPose as BodyPose } from './character';

export type HandPose = BodyPose | 'open';

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
export type FPHand = THREE.Group & {
  userData: { sx: number; pose: (name: HandPose, dt: number) => void; aim: (elbow: THREE.Vector3) => void; grip: THREE.Vector3; pinch: THREE.Vector3 };
};

/**
 * The visitor's own hand (owner, 2026-11-24, the character skill): the same anatomy as the staff's (a palm with the
 * ball of the thumb, four fingers of two parts, an opposable thumb), with the wrist, forearm and sleeve going out of
 * the picture. Its origin is the wrist; its axes as theirs (−Y the fingers, +Z the thumb side, the palm's face toward
 * −sx·X). `right`: the right hand. `pose(name, dt)` eases the fingers to a pose (open to reach, grip a cup, pinch a
 * cookie); `grip` and `pinch` are the sockets where a held thing's holding point sits.
 */
export function makeFPHand(right: boolean): FPHand {
  const sx = right ? -1 : 1;
  const g = new THREE.Group() as FPHand;
  const skin = mat(SKIN, 0.62);
  const palm = new THREE.Mesh(new THREE.SphereGeometry(0.5, 18, 12), skin);
  palm.scale.set(0.028, 0.107, 0.078);
  palm.position.set(0, -0.051, 0.002);
  g.add(palm);
  const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), skin);
  thenar.scale.set(0.9, 1.4, 1);
  thenar.position.set(-sx * 0.006, -0.04, 0.022);
  g.add(thenar);
  const FING = [
    { z: 0.024, len: [0.044, 0.044], r: 0.0088 },
    { z: 0.008, len: [0.048, 0.048], r: 0.0092 },
    { z: -0.008, len: [0.045, 0.044], r: 0.0088 },
    { z: -0.023, len: [0.036, 0.034], r: 0.0075 },
  ];
  const seg = (len: number, r: number) => {
    const geo = new THREE.CapsuleGeometry(r, Math.max(0.001, len - r * 1.2), 4, 10);
    geo.translate(0, -len / 2, 0);
    return new THREE.Mesh(geo, skin);
  };
  const fingers = FING.map((f) => {
    const a = new THREE.Group();
    a.position.set(0, -0.095, f.z);
    a.add(seg(f.len[0]!, f.r));
    const b = new THREE.Group();
    b.position.y = -f.len[0]!;
    b.add(seg(f.len[1]!, f.r * 0.92));
    a.add(b);
    g.add(a);
    return [a, b] as const;
  });
  const ta = new THREE.Group();
  ta.position.set(-sx * 0.012, -0.028, 0.03);
  const taRest = new THREE.Euler(-0.5, 0, -sx * 0.25);
  const tma = seg(0.034, 0.011);
  ta.add(tma);
  const tb = new THREE.Group();
  tb.position.y = -0.036;
  tb.add(seg(0.028, 0.0095));
  ta.add(tb);
  g.add(ta);
  // the forearm and the sleeve, from the wrist back toward the elbow (out of the picture)
  // (narrowing to the wrist; turned each frame toward the elbow, out of the picture: `aim`)
  const foreGeo = new THREE.CylinderGeometry(0.036, 0.027, 0.26, 16);
  foreGeo.translate(0, 0.13, 0);
  const fore = new THREE.Mesh(foreGeo, skin);
  g.add(fore);
  const sleeveGeo = new THREE.CylinderGeometry(0.052, 0.046, 0.24, 18);
  sleeveGeo.translate(0, 0.34, 0);
  const sleeve = new THREE.Mesh(sleeveGeo, mat(SLEEVE, 0.95));
  g.add(sleeve);
  const up = new THREE.Vector3(0, 1, 0);
  const now = structuredClone(HAND_POSES.relaxed);
  const q = new THREE.Quaternion(),
    e = new THREE.Euler();
  g.userData = {
    sx,
    aim: (elbow) => {
      const d = elbow.clone().normalize();
      fore.quaternion.setFromUnitVectors(up, d);
      sleeve.quaternion.copy(fore.quaternion);
    },
    grip: new THREE.Vector3(-sx * 0.058, -0.062, 0),
    pinch: new THREE.Vector3(-sx * 0.022, -0.115, 0.03),
    pose: (name, dt) => {
      const want = name === 'open' ? OPEN : HAND_POSES[name];
      const k = dt > 0 ? 1 - Math.pow(0.5, dt / 0.06) : 1;
      now.f.forEach((f, i) => {
        f[0] += (want.f[i]![0] - f[0]) * k;
        f[1] += (want.f[i]![1] - f[1]) * k;
        fingers[i]![0].quaternion.setFromEuler(e.set(0, 0, -sx * f[0]));
        fingers[i]![1].quaternion.setFromEuler(e.set(0, 0, -sx * f[1]));
      });
      now.t[0] += (want.t[0] - now.t[0]) * k;
      now.t[1] += (want.t[1] - now.t[1]) * k;
      ta.quaternion.setFromEuler(taRest).multiply(q.setFromEuler(e.set(0, 0, -sx * now.t[0])));
      tb.quaternion.setFromEuler(e.set(-now.t[1] * 0.4, 0, -sx * now.t[1]));
    },
  };
  g.userData.pose('relaxed', 0);
  return g;
}
/** Fingers a little open, reaching for something. */
const OPEN = { f: [[0.18, 0.2], [0.2, 0.22], [0.24, 0.26], [0.3, 0.3]] as [number, number][], t: [0.05, 0.1] as [number, number] };

/** Frees what a prop made (its shapes; the shared materials stay for the next one). */
export function disposeProp(o: THREE.Object3D) {
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (m.isMesh) m.geometry.dispose();
  });
  o.removeFromParent();
}
