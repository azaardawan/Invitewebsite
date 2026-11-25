// Helpers for building the café in a soft, animation style: rounded shapes, flat friendly colours, light textures.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export const root = new THREE.Group();
root.name = 'KOUPUP';

// ---------- textures ----------
function canvas(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.userData.mimeType = 'image/jpeg';
  return t;
}
let seed = 7;
export const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
export const rr = (a, b) => a + (b - a) * rnd();

function noise(g, w, h, n, alpha, colors) {
  for (let i = 0; i < n; i++) {
    g.fillStyle = colors[Math.floor(rnd() * colors.length)];
    g.globalAlpha = alpha * rnd();
    const s = 1 + rnd() * 3;
    g.fillRect(rnd() * w, rnd() * h, s, s);
  }
  g.globalAlpha = 1;
}

/** Square tiles: one canvas = one tile with its grout line (repeat by the tile's size in metres). */
export function tileTex(base, grout, speck) {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    // soft light patches, like polished tiles
    const grd = g.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, 'rgba(255,255,255,0.10)');
    grd.addColorStop(1, 'rgba(0,0,0,0.04)');
    g.fillStyle = grd;
    g.fillRect(0, 0, w, h);
    if (speck) noise(g, w, h, 900, 0.25, speck);
    g.strokeStyle = grout;
    g.lineWidth = 3;
    g.strokeRect(1.5, 1.5, w - 3, h - 3);
  });
}
export function speckleTex(base, colors, n = 2500, size = 512) {
  return canvas(size, size, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    noise(g, w, h, n, 0.5, colors);
  });
}
export function woodTex(base, dark, light) {
  return canvas(512, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      g.strokeStyle = rnd() < 0.5 ? dark : light;
      g.globalAlpha = 0.18 + rnd() * 0.25;
      g.lineWidth = 1 + rnd() * 3;
      const y = rnd() * h;
      g.beginPath();
      g.moveTo(0, y);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, y + Math.sin(x / 60 + i) * 4 + rr(-1.5, 1.5));
      g.stroke();
    }
    g.globalAlpha = 1;
  });
}
export function plasterTex(base) {
  return canvas(512, 512, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    for (let i = 0; i < 40; i++) {
      const x = rnd() * w,
        y = rnd() * h,
        r = 40 + rnd() * 90;
      const grd = g.createRadialGradient(x, y, 0, x, y, r);
      const c = rnd() < 0.5 ? '255,255,255' : '150,130,100';
      grd.addColorStop(0, `rgba(${c},0.05)`);
      grd.addColorStop(1, `rgba(${c},0)`);
      g.fillStyle = grd;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });
}
export function weaveTex(base, line) {
  return canvas(256, 256, (g, w, h) => {
    g.fillStyle = base;
    g.fillRect(0, 0, w, h);
    g.strokeStyle = line;
    g.lineWidth = 3;
    for (let y = 0; y < h; y += 16)
      for (let x = 0; x < w; x += 16) {
        g.beginPath();
        if (((x + y) / 16) % 2) {
          g.moveTo(x + 2, y + 8);
          g.lineTo(x + 14, y + 8);
        } else {
          g.moveTo(x + 8, y + 2);
          g.lineTo(x + 8, y + 14);
        }
        g.stroke();
      }
  });
}
export function stripesTex(a, b, n = 8, vertical = false) {
  return canvas(256, 256, (g, w, h) => {
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? a : b;
      if (vertical) g.fillRect((i * w) / n, 0, w / n + 1, h);
      else g.fillRect(0, (i * h) / n, w, h / n + 1);
    }
  });
}
export function drawTex(w, h, draw) {
  return canvas(w, h, draw);
}
/** A soft round shadow (for under furniture: the place feels grounded without real shadows). */
export const shadowTex = canvas(128, 128, (g, w, h) => {
  const grd = g.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
  grd.addColorStop(0, 'rgba(40,30,20,0.55)');
  grd.addColorStop(0.55, 'rgba(40,30,20,0.28)');
  grd.addColorStop(1, 'rgba(40,30,20,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, w, h);
});
shadowTex.userData.mimeType = 'image/png';

// ---------- materials ----------
const mats = new Map();
export function mat(color, o = {}) {
  const key = JSON.stringify([color, o.rough, o.metal, o.emissive, o.ei, o.opacity, o.map?.uuid, o.side, o.basic]);
  if (mats.has(key)) return mats.get(key);
  let m;
  if (o.basic) {
    m = new THREE.MeshBasicMaterial({ color, map: o.map ?? null, side: o.side ?? THREE.FrontSide, transparent: !!o.map?.userData?.alpha || o.opacity != null });
    if (o.opacity != null) m.opacity = o.opacity;
  } else {
    m = new THREE.MeshStandardMaterial({ color, roughness: o.rough ?? 0.82, metalness: o.metal ?? 0, map: o.map ?? null, side: o.side ?? THREE.FrontSide });
    if (o.emissive) {
      m.emissive = new THREE.Color(o.emissive);
      m.emissiveIntensity = o.ei ?? 1;
    }
    if (o.opacity != null) {
      m.transparent = true;
      m.opacity = o.opacity;
      m.depthWrite = false;
    }
  }
  mats.set(key, m);
  return m;
}
export const GLASS = () => mat('#cfe3ea', { opacity: 0.22, rough: 0.1 });

// ---------- shapes ----------
/** Sets a box's UVs in metres / `tile` so tiled textures keep their real size. */
export function boxUV(geo, w, h, d, tile = 1) {
  const uv = geo.attributes.uv;
  const sizes = [
    [d, h],
    [d, h],
    [w, d],
    [w, d],
    [w, h],
    [w, h],
  ];
  for (let f = 0; f < 6; f++)
    for (let k = 0; k < 4; k++) {
      const i = f * 4 + k;
      uv.setXY(i, (uv.getX(i) * sizes[f][0]) / tile, (uv.getY(i) * sizes[f][1]) / tile);
    }
  return geo;
}

export function add(mesh, parent = root) {
  parent.add(mesh);
  return mesh;
}

/** A plain box between two corners (x0..x1, y0..y1, z0..z1). */
export function slab(x0, x1, y0, y1, z0, z1, material, name, tile) {
  const w = Math.abs(x1 - x0),
    h = Math.abs(y1 - y0),
    d = Math.abs(z1 - z0);
  const g = new THREE.BoxGeometry(w, h, d);
  if (tile) boxUV(g, w, h, d, tile);
  const m = new THREE.Mesh(g, material);
  m.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
  if (name) m.name = name;
  return add(m);
}

/** A rounded box (the soft, toy-like look), centred at (x, y, z) with its bottom at y when `onFloor`. */
export function rbox(w, h, d, r, material, x, y, z, ry = 0, parent = root, name) {
  const g = new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001));
  const m = new THREE.Mesh(g, material);
  m.position.set(x, y + h / 2, z);
  m.rotation.y = ry;
  if (name) m.name = name;
  return add(m, parent);
}

export function cyl(rt, rb, h, material, x, y, z, seg = 24, parent = root, name) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), material);
  m.position.set(x, y + h / 2, z);
  if (name) m.name = name;
  return add(m, parent);
}

export function ball(r, material, x, y, z, sx = 1, sy = 1, sz = 1, parent = root, name) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 10), material);
  m.position.set(x, y, z);
  m.scale.set(sx, sy, sz);
  if (name) m.name = name;
  return add(m, parent);
}

/** A thin tube between two points (metal frames, stems). */
export function rod(a, b, r, material, parent = root, name) {
  const A = new THREE.Vector3(...a),
    B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 8), material);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  if (name) m.name = name;
  return add(m, parent);
}

/** A flat shape lying on the floor (rugs, shadows): never in the way. */
export function floorDecal(w, d, material, x, y, z, ry = 0, round = false, name = 'NOCOLLIDE_decal') {
  const g = round ? new THREE.CircleGeometry(0.5, 48) : new THREE.PlaneGeometry(1, 1);
  const m = new THREE.Mesh(g, material);
  m.rotation.x = -Math.PI / 2;
  m.rotation.z = ry;
  m.scale.set(w, d, 1);
  m.position.set(x, y, z);
  m.name = name;
  return add(m);
}
const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, color: '#ffffff' });
const blockMat = new THREE.MeshBasicMaterial({ color: '#000000' });
/** A soft shadow under a piece of furniture, and an invisible block round it: visitors walk round it, never onto it. */
export function contactShadow(w, d, x, y, z, ry = 0, block = true) {
  if (block) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 1.1, d * 0.92), blockMat);
    b.position.set(x, y + 0.55, z);
    b.rotation.y = ry;
    b.name = 'COLLIDER_furniture';
    add(b);
  }
  return floorDecal(w * 1.35, d * 1.35, shadowMat, x, y + 0.02, z, ry, false, 'NOCOLLIDE_shadow');
}

/** A picture on a wall: a plane facing `facing` (+x, -x, +z, -z). */
export function wallPicture(tex, w, h, x, y, z, facing, name = 'NOCOLLIDE_picture', transparent = false) {
  const m = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ map: tex, transparent, alphaTest: transparent ? 0.4 : 0, roughness: 0.8 }),
  );
  m.position.set(x, y, z);
  m.rotation.y = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[facing];
  m.name = name;
  return add(m);
}

export const group = (x, y, z, ry = 0, name) => {
  const g = new THREE.Group();
  g.position.set(x, y, z);
  g.rotation.y = ry;
  if (name) g.name = name;
  root.add(g);
  return g;
};

// ---------- for the tour's «Sit down» and «Put it down» ----------
/**
 * The places to sit: each chair's group, its seat's height (from the floor), where its front is (`fwd` +1: the group's
 * +z, −1: its −z), the sitting spot within the group (`dx`, `dz`) and the eye's height above the seat (`eye`).
 */
export const seats = [];
export function seat(g, h, o = {}) {
  seats.push({ g, h, fwd: o.fwd ?? 1, dx: o.dx ?? 0, dz: o.dz ?? 0.05, eye: o.eye ?? 0.72 });
}
/** The table tops a visitor puts their coffee on: the group, the top's height, its half-size (or radius when `round`). */
export const tables = [];
export function tableTop(g, h, hw, hd, round = false) {
  tables.push({ g, h, hw, hd, round });
}
