// The café's barista (owner, 2026-11-23): he stands behind the counter in the KOUP T-shirt and, when a visitor asks
// (the tour page's «Get a coffee» / «Get a cookie»), makes their coffee at the machine or fetches a cookie from the pile
// on the back counter and hands it over. The tour page moves him (src/components/tour/barista.ts) by his joints' names.
//
// He is drawn in the café's animation style after the owner's photo of him (owner, 2026-11-23: a photographed face
// didn't suit it); the shirt's prints are the owner's photos of the shirt (`models/shirt_front.jpg`, `shirt_back.jpg`).
import * as THREE from 'three';
import { root, mat, cyl, ball, group } from './lib.js';
import { person, eyes } from './people.js';

const FI = -1.24;
const SKIN = '#e2b192';
const NAVY = '#222a3e';
const JEANS = '#3b3e45';

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
  // He stands behind the counter's free end (between the card machine and the cake case), facing the customers.
  const { head } = await person('BARISTA', 0.62, 6.12, Math.PI, NAVY, ['models/shirt_front.jpg', 'models/shirt_back.jpg'], SKIN);
  // the head: the barista as the owner's photo shows him (owner, 2026-11-23), drawn in the café's animation style (a
  // photographed face did not suit it): a long oval face, dark hair swept back and to the side with volume on top, a
  // full dark beard and moustache, thick straight brows, hazel-green eyes and the small mole on his right cheek.
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
  for (const s of [1, -1]) ball(0.022, face, s * 0.074, 0.112, -0.006, 0.45, 1, 0.75, head); // ears
  // hazel-green eyes with lids that blink, thick straight brows
  eyes(head, 'BARISTA', zAt, { ex: 0.03, ey: 0.122, iris: '#6e6b45', lid: SKIN, brow: [0.032, 0.009, 0.06, '#1d1512'], browY: 0.139 });
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
  ball(0.012, mat('#b9746a', { rough: 0.5 }), 0, 0.072, zAt(0, 0.072, 1.06) + 0.001, 1.45, 0.42, 0.45, head).name = 'BARISTA_mouth';
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
  station('BARISTA_coffee', 1.45, 5.96, Math.PI);
  station('BARISTA_cookies', 1.12, 7.72, 0.76);
  // (the machine's places, the cups and the syrup bottles: bar.js)
  station('BARISTA_handout', 0.64, 5.5, 0, FI + 1.0);
  // the top of the cookie pile (he takes the one lying there)
  station('BARISTA_pile', 1.55, 8.12, 0, FI + 0.94 + 0.081);

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

/**
 * The second member of staff (owner, 2026-11-23): the same KOUP T-shirt in olive green, a different (cartoon) young man
 * with short curly hair, who goes round the café with a cloth, wiping the tables. His round is the named points
 * `CLEANER_stop_<n>` (in order, looping): where he stands, the way he faces (+Z), and `wipe` (seconds; 0 = he walks on).
 */
export async function cleaner() {
  const OLIVE = '#5e6842';
  const SKIN2 = '#c98e6a';
  const { head, skin } = await person('CLEANER', -1.3, 1.15, Math.PI, OLIVE, ['models/shirt_front_olive.jpg', 'models/shirt_back_olive.jpg'], SKIN2);
  // a round, friendly face (one smooth turned shape)
  const HEAD = [[0, 0], [0.04, 0.004], [0.062, 0.022], [0.074, 0.05], [0.082, 0.085], [0.086, 0.12], [0.085, 0.15], [0.077, 0.18], [0.061, 0.204], [0.036, 0.22], [0, 0.226]];
  const SX = 0.93,
    SZ = 1.02;
  const skull = turned(HEAD.slice().reverse(), skin);
  skull.scale.set(SX, 1, SZ);
  head.add(skull);
  const rAt = (y) => {
    for (let i = 1; i < HEAD.length; i++) if (y <= HEAD[i][1]) return HEAD[i - 1][0] + ((HEAD[i][0] - HEAD[i - 1][0]) * (y - HEAD[i - 1][1])) / (HEAD[i][1] - HEAD[i - 1][1]);
    return 0;
  };
  const zAt = (x, y) => SZ * Math.sqrt(Math.max(0, rAt(y) ** 2 - (x / SX) ** 2));
  for (const s of [1, -1]) ball(0.023, skin, s * 0.079, 0.108, -0.006, 0.45, 1, 0.75, head); // ears
  // brown eyes with lids that blink, cheerful raised brows
  eyes(head, 'CLEANER', zAt, { ex: 0.031, ey: 0.12, iris: '#3a2416', lid: SKIN2, brow: [0.028, 0.007, -0.18, '#1c1411'], browY: 0.142 });
  ball(0.012, skin, 0, 0.099, zAt(0, 0.099), 0.95, 1.05, 1.05, head); // the nose
  // a wide, happy smile
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.021, 0.0034, 6, 16, Math.PI * 0.8), mat('#7d3329', { rough: 0.5 }));
  smile.rotation.z = Math.PI + Math.PI * 0.1;
  smile.position.set(0, 0.076, zAt(0, 0.07) - 0.002);
  smile.scale.set(1.1, 0.8, 0.6);
  smile.name = 'CLEANER_mouth';
  head.add(smile);
  // short black curly hair: a close cap, covered in small curls
  const hair = mat('#1a1411', { rough: 0.85 });
  const cap = new THREE.Mesh(new THREE.LatheGeometry(HEAD.filter(([, y]) => y >= 0.1).map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r * 1.04), y)), 28), hair);
  {
    const p = cap.geometry.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const a = Math.abs(Math.atan2(p.getX(i), p.getZ(i))) / Math.PI;
      const edge = a < 0.3 ? 0.17 : a < 0.5 ? 0.17 - (a - 0.3) * 0.3 : 0.11 - (a - 0.5) * 0.06;
      if (p.getY(i) < edge) p.setY(i, edge);
    }
    cap.geometry.computeVertexNormals();
  }
  cap.scale.set(SX, 1, SZ);
  head.add(cap);
  const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
  const curls = [];
  for (let i = 0; i < 46; i++) {
    // curls over the top and the back (golden angle, so they spread evenly)
    const t = i / 46;
    const yy = 0.16 + (0.226 - 0.16) * Math.sqrt(1 - t) + 0.004;
    const a = i * 2.39996;
    const front = Math.cos(a) > 0.55 && yy < 0.19; // keep the forehead clear
    if (front) continue;
    const r = rAt(Math.min(0.222, yy)) * 1.04;
    curls.push(new THREE.SphereGeometry(0.014, 8, 6).scale(1, 0.8, 1).translate(Math.sin(a) * r * SX, yy, Math.cos(a) * r * SZ));
  }
  // one shape for all the curls (one draw on a phone)
  head.add(new THREE.Mesh(mergeGeometries(curls), hair));
  // his cloth, in his right hand (light blue)
  // his cloth, folded in his right palm (light blue): under the palm's face, so it is between his hand and a table
  const wrist = root.getObjectByName('CLEANER_wristR');
  const cloth = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.1, 0.085), mat('#8fc3d6', { rough: 0.95 }));
  cloth.position.set(0.022, -0.06, 0.0); // the right hand's palm faces +x
  cloth.name = 'CLEANER_cloth';
  wrist.add(cloth);

  // his round (FI, the main floor): the middle room's tables, the tall table, the lounge's coffee table, and back
  const stops = [
    [-1.3, 1.15, Math.PI, 5], // the first round table (facing it, north)
    [0.3, 1.15, 0, 0],
    [0.3, 2.35, 0, 0],
    [-1.3, 2.35, 0, 5], // the second round table (south)
    [0.3, 2.35, 0, 0],
    [0.3, -0.25, 0, 0],
    [-2.45, -0.4, Math.PI, 6], // the long walnut table
    [0.35, -0.3, 0, 0],
    [1.15, -1.3, Math.PI / 2, 4], // the tall table by the window
    [0.3, -2.4, 0, 0],
    [-1.0, -3.2, 0, 0],
    [-1.0, -5.5, 0, 0],
    [-1.85, -5.5, -Math.PI / 2, 5], // the lounge's coffee table, between the sofas
    [-1.0, -5.5, 0, 0],
    [-1.0, -3.2, 0, 0],
    [0.3, -0.25, 0, 0],
    [0.3, 1.15, 0, 0],
  ];
  stops.forEach(([x, z, ry, wipe], i) => {
    const o = new THREE.Object3D();
    o.name = `CLEANER_stop_${i}`;
    o.position.set(x, FI, z);
    o.rotation.y = ry;
    o.userData = { wipe };
    root.add(o);
  });
}
