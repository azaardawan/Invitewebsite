// The café's barista (owner, 2026-11-23): he stands behind the counter in the KOUP T-shirt and, when a visitor asks
// (the tour page's «Get a coffee» / «Get a cookie»), makes their coffee at the machine or fetches a cookie from the pile
// on the back counter and hands it over. The tour page moves him (src/components/tour/barista.ts) by his joints' names.
//
// He is drawn in the café's animation style after the owner's photo of him (owner, 2026-11-23: a photographed face
// didn't suit it); the shirt's prints are the owner's photos of the shirt (`models/shirt_front.jpg`, `shirt_back.jpg`).
import * as THREE from 'three';
import { root, mat, cyl, ball, rbox, group, shadowTex } from './lib.js';

const FI = -1.24;
const SKIN = '#e2b192';
const NAVY = '#222a3e';
const JEANS = '#3b3e45';

/** A joint: an empty group at (x, y, z) of its parent, named so the tour page can turn it. */
function joint(parent, name, x, y, z) {
  const j = new THREE.Group();
  j.name = name;
  j.position.set(x, y, z);
  parent.add(j);
  return j;
}

// The shirt: a soft T-shirt torso (a turned profile, flattened front to back).
const TORSO = [
  [0.188, -0.08],
  [0.192, 0.0],
  [0.182, 0.14],
  [0.188, 0.28],
  [0.198, 0.38],
  [0.2, 0.44],
  [0.188, 0.49],
  [0.15, 0.525],
  [0.09, 0.552],
  [0.06, 0.562],
];
const DEPTH = 0.6;
const radiusAt = (y) => {
  for (let i = 1; i < TORSO.length; i++) {
    const [r0, y0] = TORSO[i - 1],
      [r1, y1] = TORSO[i];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return TORSO[TORSO.length - 1][0];
};
/** A print laid on the shirt's curve (front: +z, back: −z), `w` × `h` m, its middle at height `y` of the torso. */
function print(tex, w, h, y, back) {
  const g = new THREE.PlaneGeometry(w, h, 16, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      yy = p.getY(i) + y;
    const a = radiusAt(yy);
    const z = DEPTH * a * Math.sqrt(Math.max(0, 1 - (x / a) ** 2)) + 0.003;
    p.setXYZ(i, back ? -x : x, yy, back ? -z : z);
  }
  g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat('#ffffff', { map: tex, rough: 0.9 }));
  m.name = 'BARISTA_print';
  return m;
}

/** The cookies' look (as the tour page's cookie): golden, with chocolate chips. */
export const COOKIE = '#c68a4c';
function cookie(parent, x, y, z, rx, ry) {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 20), mat(COOKIE, { rough: 0.9 }));
  c.position.set(x, y, z);
  c.rotation.set(rx, ry, 0);
  parent.add(c);
  for (let k = 0; k < 5; k++) {
    const a = k * 2.4 + x * 40,
      r = 0.012 + (k % 3) * 0.01;
    ball(0.007, mat('#3b2416'), Math.cos(a) * r, 0.006, Math.sin(a) * r, 1, 0.6, 1, c);
  }
}

async function loadTex(url) {
  const t = await new THREE.TextureLoader().loadAsync(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.userData.mimeType = 'image/jpeg';
  return t;
}

/** A turned shape (an arm, a sleeve) from its outline, top to bottom: `[radius, height]` pairs, closed at both ends. */
function turned(profile, material, open = false) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)).reverse();
  if (!open) {
    pts.unshift(new THREE.Vector2(0.0005, pts[0].y - 0.004));
    pts.push(new THREE.Vector2(0.0005, pts[pts.length - 1].y + 0.004));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 18), material);
  return m;
}

export async function barista() {
  const skin = mat(SKIN, { rough: 0.65 });
  const navy = mat(NAVY, { rough: 0.92 });
    const jeans = mat(JEANS, { rough: 0.95 });

  // He stands behind the counter's free end (between the card machine and the cake case), facing the customers.
  const b = group(0.62, FI, 6.12, Math.PI, 'BARISTA');
  // his own soft shadow, moving with him
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.006;
  sh.name = 'BARISTA_shadow';
  b.add(sh);

  // legs (dark jeans) and shoes, from the hips
  for (const [side, x] of [
    ['L', 0.095],
    ['R', -0.095],
  ]) {
    const leg = joint(b, `BARISTA_leg${side}`, x, 0.92, 0);
    leg.add(turned([[0.07, 0.04], [0.078, -0.05], [0.066, -0.42], [0.055, -0.5], [0.056, -0.62], [0.048, -0.84], [0.046, -0.86]], jeans));
    rbox(0.1, 0.075, 0.27, 0.035, mat('#2a2522', { rough: 0.6 }), 0, -0.92, 0.04, 0, leg);
    rbox(0.104, 0.02, 0.275, 0.008, mat('#e9e4da'), 0, -0.92, 0.04, 0, leg); // the soles
  }
  rbox(0.3, 0.18, 0.2, 0.08, jeans, 0, 0.8, 0, 0, b);

  // the torso (the shirt), turning at the waist: chest, then shoulders sloping to the neck
  const torso = joint(b, 'BARISTA_torso', 0, 0.95, 0);
  const shirt = new THREE.Mesh(
    new THREE.LatheGeometry(
      TORSO.map(([r, y]) => new THREE.Vector2(r, y)),
      32,
    ),
    navy,
  );
  shirt.scale.z = DEPTH;
  torso.add(shirt);
  const [front, back] = await Promise.all([loadTex('models/shirt_front.jpg'), loadTex('models/shirt_back.jpg')]);
  torso.add(print(front, 0.12, 0.082, 0.42, false));
  torso.add(print(back, 0.32, 0.307, 0.27, true));
  // the neck and the shirt's round collar
  const neck = turned([[0.05, 0.08], [0.052, 0.0], [0.058, -0.04]], skin);
  neck.position.y = 0.6;
  torso.add(neck);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.011, 8, 28), navy);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, 0.85, 1);
  collar.position.y = 0.566;
  torso.add(collar);

  // arms: a rounded shoulder (in the shirt), a short sleeve, a real upper arm, elbow, forearm and wrist, and a hand
  // with its fingers and thumb (a socket in each hand for a cup or a cookie)
  for (const [side, x] of [
    ['L', 0.158],
    ['R', -0.158],
  ]) {
    const sx = Math.sign(x);
    const arm = joint(torso, `BARISTA_arm${side}`, x, 0.462, 0);
    arm.rotation.z = sx * 0.11;
    // the sleeve: its rounded top tucked under the shirt's shoulder, hanging to just above the elbow
    const sleeve = turned([[0.0, 0.05], [0.03, 0.045], [0.052, 0.022], [0.06, -0.02], [0.059, -0.1], [0.058, -0.15], [0.056, -0.162]], navy);
    sleeve.name = `BARISTA_sleeve${side}`;
    arm.add(sleeve);
    // upper arm: the biceps' gentle swell, narrowing to the elbow
    arm.add(turned([[0.05, -0.04], [0.053, -0.1], [0.05, -0.16], [0.043, -0.24], [0.039, -0.285]], skin));
    const fore = joint(arm, `BARISTA_fore${side}`, 0, -0.28, 0);
    fore.rotation.x = -0.14;
    // forearm: fuller below the elbow, slim at the wrist
    fore.add(turned([[0.039, 0.012], [0.044, -0.045], [0.041, -0.1], [0.032, -0.19], [0.027, -0.235]], skin));
    // the hand, palm toward the body: palm, four fingers together (slightly curled) and the thumb in front
    const palm = rbox(0.03, 0.085, 0.07, 0.013, skin, 0, -0.31, 0.004, 0, fore);
    palm.name = `BARISTA_palm${side}`;
    const fingers = rbox(0.026, 0.07, 0.066, 0.012, skin, 0, -0.38, 0.002, 0, fore);
    fingers.rotation.z = -sx * 0.18;
    fingers.position.x = -sx * 0.006;
    const thumb = rbox(0.022, 0.05, 0.022, 0.01, skin, -sx * 0.004, -0.315, 0.04, 0, fore);
    thumb.rotation.x = 0.35;
    joint(fore, `BARISTA_hand${side}`, 0, -0.33, 0.04);
  }

  // the head: the barista as the owner's photo shows him (owner, 2026-11-23), drawn in the café's animation style (a
  // photographed face did not suit it): a long oval face, dark hair swept back and to the side with volume on top, a
  // full dark beard and moustache, thick straight brows, hazel-green eyes and the small mole on his right cheek.
  const head = joint(torso, 'BARISTA_head', 0, 0.578, 0.012);
  const HEAD = [[0, 0], [0.034, 0.004], [0.056, 0.022], [0.068, 0.05], [0.077, 0.085], [0.082, 0.12], [0.082, 0.15], [0.075, 0.18], [0.06, 0.205], [0.035, 0.223], [0, 0.23]];
  const SX = 0.9,
    SZ = 1.04;
  const face = mat(SKIN, { rough: 0.6 });
  const skull = turned(HEAD.slice().reverse(), face);
  skull.scale.set(SX, 1, SZ);
  head.add(skull);
  // where the face's surface is at height y, x across (to set the eyes, nose and mouth on it)
  const rAt = (y) => {
    for (let i = 1; i < HEAD.length; i++) if (y <= HEAD[i][1]) return HEAD[i - 1][0] + ((HEAD[i][0] - HEAD[i - 1][0]) * (y - HEAD[i - 1][1])) / (HEAD[i][1] - HEAD[i - 1][1]);
    return 0;
  };
  const zAt = (x, y, grow = 1) => SZ * Math.sqrt(Math.max(0, (rAt(y) * grow) ** 2 - (x / SX) ** 2));
  const dark = mat('#1d1512', { rough: 0.8 });
  // a piece of the head's own shape, a little proud of it (beard, hair), round the front (`phi0`…`phi1`, 0 = the front)
  const shell = (y0, y1, grow, phi0, phi1, material) => {
    const pts = HEAD.filter(([, y]) => y >= y0 && y <= y1).map(([r, y]) => new THREE.Vector2(r * grow, y));
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24, phi0, phi1 - phi0), material);
    m.scale.set(SX, 1, SZ);
    head.add(m);
    return m;
  };
  for (const s of [1, -1]) {
    ball(0.022, face, s * 0.074, 0.112, -0.006, 0.45, 1, 0.75, head); // ears
    const ex = s * 0.03,
      ey = 0.122;
    const white = ball(0.013, mat('#ffffff', { rough: 0.3 }), ex, ey, zAt(ex, ey) - 0.004, 1.1, 0.85, 0.5, head);
    white.name = 'BARISTA_eye';
    ball(0.0078, mat('#6e6b45', { rough: 0.25 }), ex, ey - 0.0005, zAt(ex, ey) + 0.0015, 1, 1.05, 0.5, head); // hazel-green
    ball(0.0042, mat('#1a1410'), ex, ey - 0.0005, zAt(ex, ey) + 0.004, 1, 1, 0.5, head); // pupil
    ball(0.0022, mat('#ffffff'), ex + 0.0028, ey + 0.003, zAt(ex, ey) + 0.0058, 1, 1, 0.6, head); // the eye's shine
    const brow = rbox(0.032, 0.009, 0.009, 0.004, dark, s * 0.03, 0.139, zAt(s * 0.03, 0.139) - 0.003, 0, head);
    brow.rotation.z = s * 0.06;
  }
  ball(0.0105, face, 0, 0.101, zAt(0, 0.101), 0.8, 1.25, 1.0, head); // the nose
  ball(0.0035, mat('#3a2a22'), -0.05, 0.094, zAt(-0.05, 0.094) + 0.0005, 1, 1, 0.5, head); // the mole on his right cheek
  // the full beard and moustache: jaw, chin and upper lip, its top edge low on the cheeks and rising to the ears
  const beardMat = mat('#2c211b', { rough: 0.95 });
  const beard = shell(0, 0.125, 1.06, -Math.PI * 0.6, Math.PI * 0.6, beardMat);
  {
    const p = beard.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.abs(Math.atan2(p.getX(i), p.getZ(i))) / Math.PI; // 0 the front, 0.5 the side
      // the moustache (front), the cheek line (lowest a little off the front), up to the sideburns (sides)
      const top = a < 0.1 ? 0.092 : a < 0.3 ? 0.092 - (a - 0.1) * 0.04 : 0.084 + (a - 0.3) * 0.13;
      if (p.getY(i) > top) p.setY(i, top);
    }
    beard.geometry.computeVertexNormals();
  }
  // the lips between moustache and beard
  ball(0.012, mat('#b9746a', { rough: 0.5 }), 0, 0.072, zAt(0, 0.072, 1.06) + 0.001, 1.45, 0.42, 0.45, head);
  // the hair: near-black, short at the sides, full on top, swept back and over to his left
  const hairMat = mat('#1f1713', { rough: 0.7 });
  // the crown, its edge following his hairline: nearly straight across the forehead, a little higher at the temples
  const top = new THREE.Mesh(
    new THREE.LatheGeometry(
      HEAD.filter(([, y]) => y >= 0.12).map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r * 1.065), y)),
      36,
    ),
    hairMat,
  );
  {
    const p = top.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.abs(Math.atan2(p.getX(i), p.getZ(i))) / Math.PI;
      const edge = a < 0.16 ? 0.162 + a * 0.04 : a < 0.4 ? 0.168 - (a - 0.16) * 0.21 : 0.118;
      if (p.getY(i) < edge) p.setY(i, edge);
    }
    top.geometry.computeVertexNormals();
  }
  top.scale.set(SX, 1.06, SZ);
  head.add(top);
  // the sides (short, behind the ears) and the back, down to the nape
  const sides = shell(0.035, 0.23, 1.05, Math.PI * 0.42, Math.PI * 1.58, hairMat);
  {
    const p = sides.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.abs(Math.atan2(p.getX(i), p.getZ(i))) / Math.PI; // 0.42 by the temple … 1 the back
      const low = a < 0.55 ? 0.11 : 0.11 - (a - 0.55) * 0.15;
      if (p.getY(i) < low) p.setY(i, low);
    }
    sides.geometry.computeVertexNormals();
  }
  // on top: full and high at the front, combed straight back and a little over to his left
  const lock = ball(0.05, hairMat, 0.01, 0.214, 0.012, 1.3, 0.45, 1.55, head);
  lock.rotation.set(-0.25, 0, -0.1);

  // where he works: the coffee machine (facing it) and the cookie pile on the back counter; the steam's place
  const station = (name, x, z, ry, y = FI) => {
    const o = new THREE.Object3D();
    o.name = name;
    o.position.set(x, y, z);
    o.rotation.y = ry;
    root.add(o);
  };
  station('BARISTA_coffee', 1.45, 6.05, Math.PI);
  station('BARISTA_cookies', 1.12, 7.72, 0.76);
  station('BARISTA_steam', 1.45, 5.45, 0, FI + 1.42);

  // the pile of cookies on the back counter, on a wooden board
  const pile = group(1.55, FI + 0.94, 8.12, 0, 'cookie_pile');
  cyl(0.15, 0.15, 0.02, mat('#a8743f', { rough: 0.6 }), 0, 0, 0, 28, pile);
  let k = 0;
  for (const [n, r, y] of [
    [7, 0.09, 0.026],
    [5, 0.055, 0.04],
    [3, 0.03, 0.054],
    [1, 0, 0.068],
  ])
    for (let i = 0; i < n; i++, k++) {
      const a = (i / n) * Math.PI * 2 + y * 30;
      cookie(pile, Math.cos(a) * r, y, Math.sin(a) * r, 0.18 * Math.sin(k * 1.7), k);
    }
}
