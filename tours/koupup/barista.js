// The café's barista (owner, 2026-11-23): he stands behind the counter in the KOUP T-shirt and, when a visitor asks
// (the tour page's «Get a coffee» / «Get a cookie»), makes their coffee at the machine or fetches a cookie from the pile
// on the back counter and hands it over. The tour page moves him (src/components/tour/barista.ts) by his joints' names.
//
// His face is the owner's scan of him (`models/barista_face.glb`: a photo-textured face and the back of the head), drawn
// as photographed; the shirt's prints are the owner's photos of the shirt (`models/shirt_front.jpg`, `shirt_back.jpg`).
import * as THREE from 'three';
import { root, mat, cyl, ball, rbox, group, shadowTex } from './lib.js';

const FI = -1.24;
const SKIN = '#c79478';
const NAVY = '#222a3e';
const JEANS = '#3b3e45';

/** A rounded limb hanging down from its joint (y 0) to `len`, `r0` thick at the joint and `r1` at the end. */
function limb(r0, r1, len, material, name) {
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = -Math.PI / 2 + (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0005, Math.cos(a) * r1), -len + r1 + Math.sin(a) * r1));
  }
  for (let i = 0; i <= 6; i++) {
    const a = (i / 6) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(0.0005, Math.cos(a) * r0), -r0 + Math.sin(a) * r0));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 16), material);
  if (name) m.name = name;
  return m;
}

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
  [0.196, -0.08],
  [0.2, 0.0],
  [0.19, 0.14],
  [0.198, 0.28],
  [0.214, 0.4],
  [0.212, 0.48],
  [0.18, 0.54],
  [0.11, 0.575],
  [0.065, 0.585],
];
const DEPTH = 0.58;
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

export async function barista() {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { SimplifyModifier } = await import('three/addons/modifiers/SimplifyModifier.js');
  const { mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
  const skin = mat(SKIN, { rough: 0.7 });
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
    ['L', 0.1],
    ['R', -0.1],
  ]) {
    const leg = joint(b, `BARISTA_leg${side}`, x, 0.92, 0);
    leg.add(limb(0.075, 0.054, 0.85, jeans));
    rbox(0.105, 0.075, 0.27, 0.035, mat('#2a2522', { rough: 0.6 }), 0, -0.92, 0.04, 0, leg);
    rbox(0.108, 0.02, 0.275, 0.008, mat('#e9e4da'), 0, -0.92, 0.04, 0, leg); // the soles
  }
  rbox(0.3, 0.18, 0.2, 0.08, jeans, 0, 0.8, 0, 0, b);

  // the torso (the shirt), turning at the waist
  const torso = joint(b, 'BARISTA_torso', 0, 0.95, 0);
  const shirt = new THREE.Mesh(
    new THREE.LatheGeometry(
      TORSO.map(([r, y]) => new THREE.Vector2(r, y)),
      28,
    ),
    navy,
  );
  shirt.scale.z = DEPTH;
  torso.add(shirt);
  const [front, back] = await Promise.all([loadTex('models/shirt_front.jpg'), loadTex('models/shirt_back.jpg')]);
  torso.add(print(front, 0.12, 0.082, 0.43, false));
  torso.add(print(back, 0.34, 0.326, 0.29, true));
  // the neck and the shirt's round collar
  const neck = limb(0.06, 0.058, 0.1, skin);
  neck.position.y = 0.65;
  torso.add(neck);
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.066, 0.012, 8, 28), navy);
  collar.rotation.x = Math.PI / 2;
  collar.scale.set(1, 0.8, 1);
  collar.position.y = 0.578;
  torso.add(collar);

  // arms: short navy sleeves, bare arms, hands (a socket in each hand for a cup or a cookie)
  for (const [side, x] of [
    ['L', 0.212],
    ['R', -0.212],
  ]) {
    const arm = joint(torso, `BARISTA_arm${side}`, x, 0.5, 0);
    arm.rotation.z = Math.sign(x) * 0.1;
    arm.add(limb(0.046, 0.04, 0.3, skin));
    const sleeve = limb(0.058, 0.056, 0.17, navy);
    sleeve.position.y = 0.014;
    arm.add(sleeve);
    const fore = joint(arm, `BARISTA_fore${side}`, 0, -0.28, 0);
    fore.rotation.x = -0.12;
    fore.add(limb(0.04, 0.032, 0.25, skin));
    const hand = ball(0.042, skin, 0, -0.27, 0.005, 0.72, 1.2, 0.5, fore);
    hand.name = `BARISTA_palm${side}`;
    ball(0.018, skin, -Math.sign(x) * 0.028, -0.245, 0.02, 1, 1.6, 1, fore); // the thumb
    joint(fore, `BARISTA_hand${side}`, 0, -0.3, 0.035);
  }

  // the head: the owner's scan (the face as photographed, the back of the head), on the neck
  const head = joint(torso, 'BARISTA_head', 0, 0.63, 0.008);
  const scan = await new GLTFLoader().loadAsync('models/barista_face.glb');
  scan.scene.updateMatrixWorld(true);
  const S = 0.9; // the scan is 26 cm from chin to crown: a little large for his frame
  scan.scene.traverse((o) => {
    if (!o.isMesh) return;
    let g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'uv'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(o.matrixWorld);
    g = mergeVertices(g, 1e-5);
    const isFace = /face/i.test(o.name);
    // lighter: fewer points (the face keeps its texture coordinates)
    g = new SimplifyModifier().modify(g, Math.floor(g.attributes.position.count * (isFace ? 0.7 : 0.85)));
    g.scale(S, S, S);
    g.translate(0, -0.035, 0);
    let m;
    if (isFace) {
      g.computeVertexNormals();
      const map = o.material.map;
      map.userData.mimeType = 'image/jpeg';
      // fully metallic and rough with a picture: the tour draws it as photographed (unlit), like a scan
      m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map, metalness: 1, roughness: 1 }));
    } else {
      // the back of the head faces inwards in the scan: turned out, and coloured: hair, then the nape (skin) below
      const idx = g.index.array;
      for (let i = 0; i < idx.length; i += 3) [idx[i + 1], idx[i + 2]] = [idx[i + 2], idx[i + 1]];
      g.computeVertexNormals();
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      const hair = new THREE.Color('#241a15').convertSRGBToLinear();
      const nape = new THREE.Color('#d6a88c').convertSRGBToLinear();
      const c = new THREE.Color();
      for (let i = 0; i < p.count; i++) {
        // the hairline: higher at the sides (by the ears), lowest in the middle of the nape
        const line = 0.025 + Math.abs(p.getX(i)) * 0.5;
        const t = THREE.MathUtils.smoothstep(p.getY(i), line - 0.012, line + 0.012);
        c.copy(nape).lerp(hair, t).toArray(col, i * 3);
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85 }));
    }
    m.name = isFace ? 'BARISTA_face' : 'BARISTA_hair';
    head.add(m);
  });

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
