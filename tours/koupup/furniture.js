// The café's furniture and things, each built at the floor (y = 0) of its own group, facing +z (its front).
import * as THREE from 'three';
import { ball, contactShadow, cyl, group, mat, rbox, rod, rnd, rr, weaveTex, woodTex, drawTex, GLASS, add } from './lib.js';

export const C = {
  olive: '#7c7f52',
  oliveDark: '#5f6340',
  navy: '#2f3b52',
  black: '#2b2d31',
  leatherBrown: '#8a5a3c',
  cognac: '#b4744a',
  peach: '#e0a888',
  cream: '#ece2cf',
  linen: '#e3d8c3',
  frame: '#1f2124',
  wood: '#b98a5c',
  woodDark: '#7d5638',
  woodLight: '#d7b48a',
  leaf: '#4f8a3c',
  leafDark: '#3c6e30',
  leafLight: '#7aa84f',
  white: '#f6f3ec',
  terracotta: '#c0704a',
};
const T = {
  wood: woodTex('#b98a5c', '#7a5232', '#d9b68c'),
  woodLight: woodTex('#d7b48a', '#a77e55', '#efd5b0'),
  woodDark: woodTex('#7d5638', '#55361f', '#9a6e4a'),
  weave: weaveTex('#c29a64', '#8f6a3e'),
  weaveDark: weaveTex('#8f6a3e', '#5e4426'),
};
export const M = {
  wood: mat('#ffffff', { map: T.wood }),
  woodLight: mat('#ffffff', { map: T.woodLight }),
  woodDark: mat('#ffffff', { map: T.woodDark }),
  weave: mat('#ffffff', { map: T.weave }),
  weaveDark: mat('#ffffff', { map: T.weaveDark }),
  frame: mat(C.frame, { rough: 0.45, metal: 0.4 }),
};

/** At (x, z) on a floor at y, turned `ry` (0 = facing +z). */
const at = (x, y, z, ry, name) => group(x, y, z, ry, name);

// ---------- seats ----------
/** The low lounge chair of the place: a thin black tube frame and one soft folded cushion (seat and back). */
export function loungeChair(x, y, z, ry, color) {
  const g = at(x, y, z, ry, 'lounge_chair');
  const c = mat(color, { rough: 0.7 });
  // frame: two side sledges and cross bars
  for (const sx of [-0.36, 0.36]) {
    rod([sx, 0.02, 0.38], [sx, 0.02, -0.4], 0.015, M.frame, g);
    rod([sx, 0.02, 0.38], [sx, 0.32, 0.3], 0.015, M.frame, g);
    rod([sx, 0.32, 0.3], [sx, 0.3, -0.2], 0.015, M.frame, g);
    rod([sx, 0.3, -0.2], [sx, 0.72, -0.42], 0.015, M.frame, g);
    rod([sx, 0.02, -0.4], [sx, 0.3, -0.2], 0.015, M.frame, g);
  }
  rod([-0.36, 0.02, 0.38], [0.36, 0.02, 0.38], 0.015, M.frame, g);
  rod([-0.36, 0.72, -0.42], [0.36, 0.72, -0.42], 0.015, M.frame, g);
  // cushion
  // one thick, soft cushion folded over the frame: a sloping seat and a reclined back (a sling chair)
  const seat = rbox(0.72, 0.2, 0.7, 0.09, c, 0, 0.2, 0.08, 0, g);
  seat.rotation.x = -0.15; // its front a little higher
  const back = rbox(0.72, 0.18, 0.66, 0.09, c, 0, 0, 0, 0, g);
  back.position.set(0, 0.56, -0.42);
  back.rotation.x = 0.98; // leaning back
  // a pillow at the top
  const pillow = rbox(0.6, 0.13, 0.24, 0.06, mat(color, { rough: 0.9 }), 0, 0, 0, 0, g);
  pillow.position.set(0, 0.86, -0.62);
  pillow.rotation.x = 0.98;
  contactShadow(0.75, 0.8, x, y, z, ry);
  return g;
}

/** A soft upholstered armchair (the rounded, padded ones). */
export function armchair(x, y, z, ry, color, w = 0.82) {
  const g = at(x, y, z, ry, 'armchair');
  const c = mat(color, { rough: 0.85 });
  rbox(w, 0.38, 0.8, 0.12, c, 0, 0, 0, 0, g);
  rbox(w, 0.42, 0.22, 0.1, c, 0, 0.3, -0.3, 0, g).rotation.x = -0.12;
  rbox(0.18, 0.28, 0.72, 0.08, c, -w / 2 + 0.08, 0.3, 0.02, 0, g);
  rbox(0.18, 0.28, 0.72, 0.08, c, w / 2 - 0.08, 0.3, 0.02, 0, g);
  rbox(w - 0.3, 0.12, 0.55, 0.06, mat(color, { rough: 0.9 }), 0, 0.37, 0.08, 0, g);
  contactShadow(w, 0.85, x, y, z, ry);
  return g;
}

/** The puffy low sofa (like a Togo): rolls of cushion, no legs. */
export function puffySofa(x, y, z, ry, color, len = 1.3, depth = 0.95) {
  const g = at(x, y, z, ry, 'sofa');
  const c = mat(color, { rough: 0.92 });
  rbox(len, 0.36, depth, 0.16, c, 0, 0, 0.05, 0, g);
  const back = rbox(len, 0.5, 0.3, 0.14, c, 0, 0.18, -depth / 2 + 0.12, 0, g);
  back.rotation.x = -0.22;
  // the pleats
  for (let i = 1; i < 5; i++) rbox(0.03, 0.02, depth - 0.2, 0.01, mat('#cdbfa6'), -len / 2 + (len * i) / 5, 0.355, 0.12, 0, g);
  contactShadow(len, depth, x, y, z, ry);
  return g;
}

/** A sculpted wooden chair with a round back (at the long desks). */
export function roundChair(x, y, z, ry) {
  const g = at(x, y, z, ry, 'round_chair');
  cyl(0.22, 0.22, 0.05, M.woodLight, 0, 0.44, 0, 28, g);
  const back = cyl(0.24, 0.24, 0.05, M.woodLight, 0, 0, 0, 28, g);
  back.rotation.x = Math.PI / 2 - 0.15;
  back.position.set(0, 0.78, -0.2);
  for (const [lx, lz] of [
    [-0.15, 0.13],
    [0.15, 0.13],
    [0, -0.17],
  ])
    rod([lx, 0, lz], [lx * 0.6, 0.45, lz * 0.6], 0.025, M.woodLight, g);
  contactShadow(0.45, 0.45, x, y, z, ry);
  return g;
}

/** A simple stool. */
export function stool(x, y, z, color = C.woodLight) {
  const g = at(x, y, z, 0, 'stool');
  cyl(0.18, 0.15, 0.45, color === C.woodLight ? M.woodLight : mat(color), 0, 0, 0, 20, g);
  contactShadow(0.36, 0.36, x, y, z);
  return g;
}

// ---------- tables ----------
/** A live-edge wooden table: a thick wavy slab on sculpted legs. */
export function liveEdgeTable(x, y, z, ry, len, width, height = 0.76, thick = 0.07) {
  const g = at(x, y, z, ry, 'table');
  const s = new THREE.Shape();
  const n = 14;
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([-len / 2 + (len * i) / n, width / 2 + rr(-0.04, 0.05)]);
  for (let i = n; i >= 0; i--) pts.push([-len / 2 + (len * i) / n, -width / 2 + rr(-0.05, 0.04)]);
  s.moveTo(pts[0][0], pts[0][1]);
  s.splineThru(pts.slice(1).map(([a, b]) => new THREE.Vector2(a, b)));
  const geo = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 3, curveSegments: 8 });
  geo.rotateX(-Math.PI / 2);
  // world-sized wood grain
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / 1.2, uv.getY(i) / 1.2);
  const top = new THREE.Mesh(geo, M.wood);
  top.position.y = height - thick;
  g.add(top);
  // two sculpted legs (slabs of root wood)
  for (const lx of [-len / 2 + 0.35, len / 2 - 0.35]) {
    rbox(0.16, height - thick, width * 0.7, 0.06, M.woodDark, lx, 0, 0, 0, g);
  }
  contactShadow(len, width, x, y, z, ry);
  return g;
}

export function boxTable(x, y, z, ry, w, d, h, material = M.wood, r = 0.03) {
  const g = at(x, y, z, ry, 'table');
  rbox(w, h, d, r, material, 0, 0, 0, 0, g);
  contactShadow(w, d, x, y, z, ry);
  return g;
}

/** A small square table on a black metal frame (terrace). */
export function frameTable(x, y, z, ry, w = 0.5, h = 0.45, top = M.woodLight) {
  const g = at(x, y, z, ry, 'side_table');
  rbox(w, 0.03, w, 0.01, top, 0, h - 0.03, 0, 0, g);
  for (const [a, b] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    rod([(a * w) / 2.2, 0, (b * w) / 2.2], [(a * w) / 2.2, h - 0.03, (b * w) / 2.2], 0.012, M.frame, g);
  contactShadow(w, w, x, y, z, ry);
  return g;
}

export function roundTable(x, y, z, r, h, material) {
  const g = at(x, y, z, 0, 'round_table');
  cyl(r, r, 0.04, material, 0, h - 0.04, 0, 32, g);
  cyl(0.04, 0.04, h - 0.04, M.frame, 0, 0, 0, 12, g);
  cyl(r * 0.6, r * 0.6, 0.02, M.frame, 0, 0, 0, 24, g);
  contactShadow(r * 2, r * 2, x, y, z);
  return g;
}

// ---------- plants ----------
const leafGeo = new THREE.SphereGeometry(1, 10, 6);
function leaf(g, len, wid, color, pos, yaw, tilt) {
  const m = new THREE.Mesh(leafGeo, mat(color, { rough: 0.7, side: THREE.DoubleSide }));
  m.scale.set(wid, 0.012, len / 2);
  const holder = new THREE.Group();
  holder.position.set(...pos);
  holder.rotation.set(0, yaw, 0);
  const inner = new THREE.Group();
  inner.rotation.x = -tilt;
  m.position.z = len / 2;
  m.name = 'NOCOLLIDE_leaf';
  inner.add(m);
  holder.add(inner);
  g.add(holder);
  return holder;
}
export function pot(g, kind, r, h) {
  if (kind === 'basket') cyl(r, r * 0.85, h, M.weave, 0, 0, 0, 24, g, 'pot');
  else if (kind === 'terracotta') cyl(r, r * 0.75, h, mat(C.terracotta), 0, 0, 0, 24, g, 'pot');
  else if (kind === 'stone') cyl(r, r * 0.8, h, mat('#8d8a82', { rough: 0.95 }), 0, 0, 0, 24, g, 'pot');
  else cyl(r, r * 0.82, h, mat(C.white, { rough: 0.5 }), 0, 0, 0, 24, g, 'pot');
  cyl(r * 0.92, r * 0.92, 0.02, mat('#5a4330'), 0, h - 0.03, 0, 24, g, 'NOCOLLIDE_soil');
}
/** A palm or a tall plant with long arching leaves. */
export function palm(x, y, z, height = 1.6, potKind = 'basket', potR = 0.22) {
  const g = at(x, y, z, rr(0, 6.28), 'plant');
  const ph = potR * 1.5;
  pot(g, potKind, potR, ph);
  const stems = 5 + Math.floor(rnd() * 3);
  for (let i = 0; i < stems; i++) {
    const a = (i / stems) * Math.PI * 2 + rr(-0.3, 0.3);
    const top = [Math.sin(a) * 0.15, ph + height * rr(0.55, 0.9), Math.cos(a) * 0.15];
    rod([0, ph, 0], top, 0.012, mat('#6b7f3c'), g, 'NOCOLLIDE_stem');
    for (let k = 0; k < 7; k++) {
      leaf(g, rr(0.35, 0.55), 0.045, k % 2 ? C.leaf : C.leafDark, [top[0], top[1] - k * 0.05, top[2]], a + rr(-1.2, 1.2), rr(-0.2, 0.7));
    }
  }
  contactShadow(potR * 2, potR * 2, x, y, z);
  return g;
}
/** A leafy bush (round leaves): in planters and pots. */
export function bush(x, y, z, r = 0.35, potKind = 'white', potR = 0.2, potH = 0.3, colors = [C.leaf, C.leafDark, C.leafLight]) {
  const g = at(x, y, z, 0, 'plant');
  if (potKind) pot(g, potKind, potR, potH);
  const base = potKind ? potH : 0;
  for (let i = 0; i < 9; i++) {
    const b = ball(r * rr(0.45, 0.7), mat(colors[i % colors.length], { rough: 0.8 }), rr(-r, r) * 0.6, base + r * rr(0.5, 1.2), rr(-r, r) * 0.6, 1, 0.85, 1, g);
    b.name = 'NOCOLLIDE_leaves';
  }
  if (potKind) contactShadow(potR * 2, potR * 2, x, y, z);
  return g;
}
/** A big-leaved plant (bird of paradise / monstera). */
export function bigLeaf(x, y, z, height = 1.3, potKind = 'stone', potR = 0.2) {
  const g = at(x, y, z, rr(0, 6.28), 'plant');
  const ph = potR * 1.6;
  pot(g, potKind, potR, ph);
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    const tip = [Math.sin(a) * 0.18, ph + height * rr(0.5, 0.95), Math.cos(a) * 0.18];
    rod([0, ph, 0], tip, 0.012, mat('#5f7d36'), g, 'NOCOLLIDE_stem');
    leaf(g, rr(0.35, 0.5), 0.13, i % 2 ? C.leaf : C.leafDark, tip, a, rr(0.2, 0.9));
  }
  contactShadow(potR * 2, potR * 2, x, y, z);
  return g;
}
/** Dried grass / pampas in a vase. */
export function pampas(x, y, z, h = 1.4, potKind = 'terracotta') {
  const g = at(x, y, z, 0, 'plant');
  pot(g, potKind, 0.13, 0.4);
  for (let i = 0; i < 9; i++) {
    const a = rr(0, 6.28),
      s = rr(0.1, 0.35);
    const tip = [Math.sin(a) * s, 0.4 + h * rr(0.6, 1), Math.cos(a) * s];
    rod([0, 0.4, 0], tip, 0.006, mat('#b9a27c'), g, 'NOCOLLIDE_stem');
    ball(0.05, mat('#e4d6b8'), tip[0], tip[1], tip[2], 0.7, 2.2, 0.7, g).name = 'NOCOLLIDE_plume';
  }
  contactShadow(0.26, 0.26, x, y, z);
  return g;
}

// ---------- things ----------
export function basket(x, y, z, r = 0.16, h = 0.28, dark = false) {
  const g = at(x, y, z, 0, 'basket');
  cyl(r, r * 0.85, h, dark ? M.weaveDark : M.weave, 0, 0, 0, 24, g);
  contactShadow(r * 2, r * 2, x, y, z);
  return g;
}
export function vase(x, y, z, r, h, color) {
  const g = at(x, y, z, 0, 'vase');
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(r * (0.55 + 0.6 * Math.sin(Math.PI * (0.15 + 0.75 * t))), h * t));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 24), mat(color, { rough: 0.5 }));
  g.add(m);
  return g;
}
/** A tall white standing air conditioner, with its grille. */
export function standingAC(x, y, z, ry) {
  const g = at(x, y, z, ry, 'ac');
  rbox(0.52, 1.85, 0.32, 0.04, mat('#f4f4f1', { rough: 0.5 }), 0, 0, 0, 0, g);
  for (let i = 0; i < 8; i++) rbox(0.42, 0.015, 0.02, 0.005, mat('#c9cbc8'), 0, 1.25 + i * 0.065, 0.16, 0, g);
  rbox(0.16, 0.08, 0.02, 0.01, mat('#5b6a75'), 0, 1.05, 0.16, 0, g);
  contactShadow(0.52, 0.32, x, y, z, ry);
  return g;
}
/** Open shelving (a room divider / display): wooden frame, shelves, a few objects. */
export function shelves(x, y, z, ry, w, h, d, items = true) {
  const g = at(x, y, z, ry, 'shelves');
  const wm = M.woodDark;
  rbox(0.05, h, d, 0.01, wm, -w / 2 + 0.025, 0, 0, 0, g);
  rbox(0.05, h, d, 0.01, wm, w / 2 - 0.025, 0, 0, 0, g);
  const n = Math.round(h / 0.42);
  for (let i = 0; i <= n; i++) {
    const sy = Math.min(h - 0.04, 0.05 + i * ((h - 0.05) / n));
    rbox(w, 0.035, d, 0.01, wm, 0, sy, 0, 0, g);
    if (items && i < n)
      for (let k = 0; k < 3; k++) {
        const ix = -w / 2 + 0.18 + k * ((w - 0.36) / 2) + rr(-0.05, 0.05);
        const kind = rnd();
        if (kind < 0.4) vaseIn(g, ix, sy + 0.035, rr(0.05, 0.08), rr(0.15, 0.28), ['#e9dcc4', '#a46d48', '#3f4a3c', '#d9c9a8'][Math.floor(rnd() * 4)]);
        else if (kind < 0.7) rbox(rr(0.12, 0.25), rr(0.18, 0.26), d * 0.6, 0.01, mat(['#c8b28c', '#7e8a6a', '#a2563c', '#efe6d4'][Math.floor(rnd() * 4)]), ix, sy + 0.035, 0, 0, g);
        else cyl(0.09, 0.09, 0.12, M.weave, ix, sy + 0.035, 0, 16, g);
      }
  }
  contactShadow(w, d, x, y, z, ry);
  return g;
}
function vaseIn(g, x, y, r, h, color) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    pts.push(new THREE.Vector2(r * (0.5 + 0.6 * Math.sin(Math.PI * (0.15 + 0.75 * t))), h * t));
  }
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 20), mat(color, { rough: 0.5 }));
  m.position.set(x, y, 0);
  g.add(m);
}
/** A tote bag hanging on the wall (the shop's own bags). */
export function toteBag(x, y, z, facing) {
  const g = group(x, y, z, { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[facing], 'tote');
  rbox(0.32, 0.36, 0.03, 0.01, mat('#1f1f1f'), 0, -0.36, 0.02, 0, g);
  rbox(0.2, 0.12, 0.02, 0.01, mat('#d9c8a5'), 0, -0.25, 0.04, 0, g);
  const h = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20, Math.PI), mat('#1f1f1f'));
  h.position.set(0, 0, 0.02);
  g.add(h);
  return g;
}
export function rug(x, y, z, ry, w, d, tex, round = false) {
  const m = new THREE.Mesh(round ? new THREE.CircleGeometry(0.5, 56) : new THREE.PlaneGeometry(1, 1), mat('#ffffff', { map: tex, rough: 0.95 }));
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = ry;
  m.scale.set(w, d, 1);
  m.position.set(x, y + 0.006, z);
  m.name = 'NOCOLLIDE_rug';
  return add(m);
}
export function artPanel(tex, w, h, x, y, z, ry) {
  const g = group(x, y, z, ry, 'art');
  rbox(w + 0.04, h + 0.04, 0.03, 0.005, mat('#d8cdb6'), 0, -h / 2 - 0.02, 0, 0, g);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat('#ffffff', { map: tex }));
  p.position.set(0, 0, 0.017);
  g.add(p);
  return g;
}
/** Bottles in a row (shelves, fridges): bright little cylinders. */
export function bottles(g, x0, x1, y, z, colors, r = 0.03, h = 0.22, step = 0.075) {
  for (let x = x0, i = 0; x <= x1; x += step, i++) {
    const c = colors[i % colors.length];
    cyl(r, r, h * 0.7, mat(c, { rough: 0.35 }), x, y, z, 12, g);
    cyl(r * 0.4, r, h * 0.15, mat(c, { rough: 0.35 }), x, y + h * 0.7, z, 12, g);
    cyl(r * 0.4, r * 0.4, h * 0.12, mat('#e9e4d8'), x, y + h * 0.85, z, 8, g);
  }
}
export { GLASS };
