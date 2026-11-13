/**
 * Renaissance decoration for `<Gallery3D>` (owner, 2026-11-13): coffered ceilings, a gilt frieze along the top of the
 * walls, fluted pilasters between the photos, laurel medallions above them, moulded damask panels on the wide empty
 * walls, and a pair of panelled doors. Everything is drawn here on canvases (no picture files to load), and the pieces
 * of one kind are merged into one mesh, so the whole decoration costs a handful of draw calls.
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export type DecorPalette = {
  /** Plaster and stone. */
  ivory: string;
  /** The shadows of mouldings. */
  shade: string;
  /** Gilding. */
  gold: string;
  goldDeep: string;
  /** The deep field of coffers and the frieze. */
  field: string;
};

export const DEFAULT_PALETTE: DecorPalette = { ivory: '#ece2cd', shade: '#b9a98a', gold: '#d2ad66', goldDeep: '#8f6a2c', field: '#22394a' };

function canvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')!];
}

/** A gilt rosette: `petals` rounded petals around a boss. */
function rosette(g: CanvasRenderingContext2D, x: number, y: number, r: number, p: DecorPalette, petals = 8) {
  g.save();
  g.translate(x, y);
  for (let i = 0; i < petals; i++) {
    g.rotate((Math.PI * 2) / petals);
    const grad = g.createLinearGradient(0, 0, 0, -r);
    grad.addColorStop(0, p.goldDeep);
    grad.addColorStop(0.6, p.gold);
    grad.addColorStop(1, '#f1d99c');
    g.fillStyle = grad;
    g.beginPath();
    g.ellipse(0, -r * 0.55, r * 0.22, r * 0.48, 0, 0, Math.PI * 2);
    g.fill();
  }
  g.fillStyle = p.goldDeep;
  g.beginPath();
  g.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#f1d99c';
  g.beginPath();
  g.arc(-r * 0.06, -r * 0.06, r * 0.12, 0, Math.PI * 2);
  g.fill();
  g.restore();
}

/** A laurel leaf, pointing along `angle`. */
function leaf(g: CanvasRenderingContext2D, x: number, y: number, len: number, angle: number, fill: string) {
  g.save();
  g.translate(x, y);
  g.rotate(angle);
  g.fillStyle = fill;
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.5, -len * 0.32, len, 0);
  g.quadraticCurveTo(len * 0.5, len * 0.32, 0, 0);
  g.fill();
  g.restore();
}

/** One coffer of a ceiling (a square, repeated): stepped ivory mouldings round a deep field with a gilt rosette. */
export function cofferTexture(p: DecorPalette): HTMLCanvasElement {
  const S = 512;
  const [c, g] = canvas(S, S);
  g.fillStyle = p.ivory;
  g.fillRect(0, 0, S, S);
  // Stepped mouldings, each a little darker going in (light from below).
  const steps = [
    [26, p.ivory, p.shade],
    [58, '#e2d6bd', '#a9987a'],
    [86, '#d6c8ab', '#9a8968'],
  ] as const;
  for (const [inset, light, dark] of steps) {
    g.fillStyle = dark;
    g.fillRect(inset, inset, S - inset * 2, S - inset * 2);
    g.fillStyle = light;
    g.fillRect(inset + 6, inset + 6, S - inset * 2 - 6, S - inset * 2 - 6);
  }
  // Gilt bead between the mouldings and the field.
  g.strokeStyle = p.gold;
  g.lineWidth = 6;
  g.strokeRect(112, 112, S - 224, S - 224);
  g.fillStyle = p.field;
  g.fillRect(118, 118, S - 236, S - 236);
  // A faint star of lines in the field, and the rosette.
  g.strokeStyle = 'rgba(210,173,102,.25)';
  g.lineWidth = 2;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    g.beginPath();
    g.moveTo(S / 2 + Math.cos(a) * 70, S / 2 + Math.sin(a) * 70);
    g.lineTo(S / 2 + Math.cos(a) * 128, S / 2 + Math.sin(a) * 128);
    g.stroke();
  }
  rosette(g, S / 2, S / 2, 66, p, 8);
  // Small gilt rosettes where the coffers meet.
  for (const [x, y] of [
    [0, 0],
    [S, 0],
    [0, S],
    [S, S],
  ] as const)
    rosette(g, x, y, 20, p, 6);
  return c;
}

/** The frieze along the top of the walls (repeats sideways): egg-and-dart above, a gilt running scroll, a bead below. */
export function friezeTexture(p: DecorPalette): HTMLCanvasElement {
  const W = 1024;
  const H = 160;
  const [c, g] = canvas(W, H);
  g.fillStyle = p.ivory;
  g.fillRect(0, 0, W, H);
  // Egg-and-dart.
  g.fillStyle = p.shade;
  g.fillRect(0, 4, W, 30);
  for (let x = 0; x < W; x += 32) {
    g.fillStyle = p.ivory;
    g.beginPath();
    g.ellipse(x + 16, 19, 11, 13, 0, 0, Math.PI * 2);
    g.fill();
    g.strokeStyle = p.goldDeep;
    g.lineWidth = 2;
    g.stroke();
    g.fillStyle = p.goldDeep;
    g.beginPath();
    g.moveTo(x, 6);
    g.lineTo(x + 3, 32);
    g.lineTo(x - 3, 32);
    g.fill();
  }
  // The scroll band.
  g.fillStyle = p.field;
  g.fillRect(0, 40, W, 92);
  g.strokeStyle = p.gold;
  g.lineWidth = 3;
  g.strokeRect(-2, 42, W + 4, 88);
  const mid = 86;
  const wave = 256;
  g.strokeStyle = p.gold;
  g.lineWidth = 5;
  g.beginPath();
  for (let x = 0; x <= W; x += 4) {
    const y = mid + Math.sin((x / wave) * Math.PI * 2) * 22;
    if (x === 0) g.moveTo(x, y);
    else g.lineTo(x, y);
  }
  g.stroke();
  // A curl and leaves in each half wave.
  for (let x = 0; x < W; x += wave / 2) {
    const up = Math.round(x / (wave / 2)) % 2 === 0;
    const cx = x + wave / 4;
    const cy = mid + (up ? -10 : 10);
    g.lineWidth = 4;
    g.beginPath();
    for (let t = 0; t < Math.PI * 3.2; t += 0.15) {
      const r = 26 - t * 6.5;
      const px = cx + Math.cos(t + (up ? 0 : Math.PI)) * r;
      const py = cy + Math.sin(t + (up ? 0 : Math.PI)) * r * (up ? -1 : 1);
      if (t === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
    for (let k = 0; k < 3; k++) leaf(g, x + 18 + k * 26, mid + (up ? 18 : -18), 20, up ? 0.5 : -0.5, k % 2 ? p.gold : p.goldDeep);
    rosette(g, cx, cy, 8, p, 6);
  }
  // Bead and reel.
  g.fillStyle = p.shade;
  g.fillRect(0, 136, W, 20);
  for (let x = 0; x < W; x += 24) {
    g.fillStyle = p.gold;
    g.beginPath();
    g.ellipse(x + 8, 146, 7, 6, 0, 0, Math.PI * 2);
    g.fill();
    g.fillRect(x + 17, 143, 6, 6);
  }
  return c;
}

/** A fluted pilaster with its base and a gilt capital (scrolls and acanthus). */
export function pilasterTexture(p: DecorPalette): HTMLCanvasElement {
  const W = 128;
  const H = 1024;
  const [c, g] = canvas(W, H);
  g.fillStyle = p.ivory;
  g.fillRect(0, 0, W, H);
  // Shaft: flutes.
  for (let i = 0; i < 5; i++) {
    const x = 18 + i * 20;
    const grad = g.createLinearGradient(x, 0, x + 12, 0);
    grad.addColorStop(0, p.shade);
    grad.addColorStop(0.5, '#d9cdb3');
    grad.addColorStop(1, '#f6eedd');
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(x, 150, 12, H - 150 - 120, 6);
    g.fill();
  }
  // Base.
  g.fillStyle = p.shade;
  g.fillRect(0, H - 110, W, 8);
  g.fillStyle = '#d9cdb3';
  g.fillRect(4, H - 100, W - 8, 30);
  g.fillStyle = p.shade;
  g.fillRect(0, H - 66, W, 66);
  g.fillStyle = p.ivory;
  g.fillRect(6, H - 60, W - 12, 54);
  // Capital.
  g.fillStyle = p.shade;
  g.fillRect(0, 0, W, 18);
  g.fillStyle = p.gold;
  g.fillRect(0, 18, W, 10);
  for (const s of [-1, 1]) {
    const cx = W / 2 + s * 40;
    g.strokeStyle = p.gold;
    g.lineWidth = 5;
    g.beginPath();
    for (let t = 0; t < Math.PI * 3; t += 0.15) {
      const r = 20 - t * 1.9;
      const px = cx + Math.cos(t) * r * s;
      const py = 50 + Math.sin(t) * r;
      if (t === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.stroke();
  }
  for (let k = 0; k < 5; k++) leaf(g, 14 + k * 22, 120, 34, -Math.PI / 2 + (k - 2) * 0.18, k % 2 ? p.gold : p.goldDeep);
  rosette(g, W / 2, 62, 14, p, 6);
  g.fillStyle = p.gold;
  g.fillRect(8, 134, W - 16, 6);
  return c;
}

/** A gilt laurel wreath round a rosette (transparent outside). */
export function medallionTexture(p: DecorPalette): HTMLCanvasElement {
  const S = 256;
  const [c, g] = canvas(S, S);
  const cx = S / 2;
  g.fillStyle = p.ivory;
  g.beginPath();
  g.arc(cx, cx, 84, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = p.shade;
  g.lineWidth = 6;
  g.stroke();
  rosette(g, cx, cx, 52, p, 12);
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const x = cx + Math.cos(a) * 100;
    const y = cx + Math.sin(a) * 100;
    leaf(g, x, y, 30, a + Math.PI / 2 + (i % 2 ? 0.5 : -0.5), i % 2 ? p.gold : p.goldDeep);
  }
  g.strokeStyle = p.gold;
  g.lineWidth = 4;
  g.beginPath();
  g.arc(cx, cx, 100, 0, Math.PI * 2);
  g.stroke();
  return c;
}

/** A moulded wall panel of `w` × `h` metres: a damask field inside a gilt frame with corner rosettes. */
export function panelTexture(p: DecorPalette, w: number, h: number): HTMLCanvasElement {
  const scale = 150; // pixels per metre
  const W = Math.min(2048, Math.round(w * scale));
  const H = Math.min(2048, Math.round(h * scale));
  const [c, g] = canvas(W, H);
  g.fillStyle = p.ivory;
  g.fillRect(0, 0, W, H);
  // Damask: a lattice of lozenges with small fleurons, a shade darker than the wall.
  const field = '#e3d7bf';
  g.fillStyle = field;
  g.fillRect(34, 34, W - 68, H - 68);
  g.save();
  g.beginPath();
  g.rect(34, 34, W - 68, H - 68);
  g.clip();
  g.strokeStyle = 'rgba(160,136,96,.35)';
  g.lineWidth = 2;
  const step = 70;
  for (let x = -H; x < W + H; x += step) {
    g.beginPath();
    g.moveTo(x, 0);
    g.lineTo(x + H, H);
    g.stroke();
    g.beginPath();
    g.moveTo(x, H);
    g.lineTo(x + H, 0);
    g.stroke();
  }
  g.fillStyle = 'rgba(176,146,92,.45)';
  for (let y = 0; y < H + step; y += step) {
    for (let x = 0; x < W + step; x += step) {
      const ox = (y / step) % 2 ? step / 2 : 0;
      for (let k = 0; k < 4; k++) {
        g.beginPath();
        g.ellipse(x + ox + Math.cos((k * Math.PI) / 2) * 7, y + Math.sin((k * Math.PI) / 2) * 7, 5, 9, (k * Math.PI) / 2, 0, Math.PI * 2);
        g.fill();
      }
    }
  }
  g.restore();
  // Mouldings and the gilt frame.
  g.strokeStyle = p.shade;
  g.lineWidth = 10;
  g.strokeRect(10, 10, W - 20, H - 20);
  g.strokeStyle = p.gold;
  g.lineWidth = 6;
  g.strokeRect(26, 26, W - 52, H - 52);
  g.strokeStyle = p.goldDeep;
  g.lineWidth = 2;
  g.strokeRect(36, 36, W - 72, H - 72);
  for (const [x, y] of [
    [26, 26],
    [W - 26, 26],
    [26, H - 26],
    [W - 26, H - 26],
  ] as const)
    rosette(g, x, y, 18, p, 8);
  // A central gilt cartouche.
  g.strokeStyle = p.gold;
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(W / 2, H / 2, Math.min(W, H) * 0.12, Math.min(W, H) * 0.16, 0, 0, Math.PI * 2);
  g.stroke();
  rosette(g, W / 2, H / 2, Math.min(W, H) * 0.07, p, 8);
  return c;
}

/** A pair of panelled doors in their frame (the closed main entrance). */
export function doorsTexture(p: DecorPalette): HTMLCanvasElement {
  const W = 768;
  const H = 1024;
  const [c, g] = canvas(W, H);
  g.fillStyle = p.ivory;
  g.fillRect(0, 0, W, H);
  // Architrave.
  g.fillStyle = p.shade;
  g.fillRect(30, 40, W - 60, H - 40);
  g.fillStyle = p.gold;
  g.fillRect(44, 54, W - 88, H - 54);
  const leafW = (W - 112) / 2;
  for (let i = 0; i < 2; i++) {
    const x = 56 + i * leafW;
    const grad = g.createLinearGradient(x, 0, x + leafW, 0);
    grad.addColorStop(0, '#16201f');
    grad.addColorStop(0.5, '#22312f');
    grad.addColorStop(1, '#141d1c');
    g.fillStyle = grad;
    g.fillRect(x, 66, leafW - 2, H - 66);
    // Raised panels with gilt lines.
    for (const [py, ph] of [
      [100, 380],
      [520, 440],
    ] as const) {
      g.strokeStyle = p.gold;
      g.lineWidth = 4;
      g.strokeRect(x + 34, py, leafW - 70, ph);
      g.strokeStyle = 'rgba(210,173,102,.4)';
      g.lineWidth = 2;
      g.strokeRect(x + 46, py + 12, leafW - 94, ph - 24);
      rosette(g, x + leafW / 2, py + ph / 2, 22, p, 8);
    }
    // Handle.
    g.fillStyle = p.gold;
    g.fillRect(i === 0 ? x + leafW - 24 : x + 14, 470, 8, 90);
  }
  // Pediment ornament above.
  rosette(g, W / 2, 26, 20, p, 8);
  return c;
}

/** A canvas as a texture for these surfaces (sRGB, mipmapped, repeating when asked). */
export function decorTexture(c: HTMLCanvasElement, renderer: THREE.WebGLRenderer, repeat = false): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/** A material for decoration: a little light of its own, so it reads in the darker corners too. */
export function decorMaterial(map: THREE.Texture, opts: { transparent?: boolean; glow?: number } = {}) {
  return new THREE.MeshStandardMaterial({
    map,
    emissive: 0xffffff,
    emissiveMap: map,
    emissiveIntensity: opts.glow ?? 0.18,
    roughness: 0.75,
    metalness: 0.05,
    transparent: opts.transparent ?? false,
    alphaTest: opts.transparent ? 0.4 : 0,
    side: THREE.FrontSide,
  });
}

/**
 * A flat rectangle (`w` × `h`) facing `normal`, centred at `at`, with UVs `[0, u] × [0, v]` (repeats for tiling
 * textures). The picture's top is up, read the right way round from the front.
 */
export function quad(at: THREE.Vector3, normal: THREE.Vector3, w: number, h: number, u = 1, v = 1): THREE.BufferGeometry {
  const geo = new THREE.PlaneGeometry(w, h);
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * u, uv.getY(i) * v);
  const m = new THREE.Object3D();
  m.position.copy(at);
  m.lookAt(at.clone().add(normal));
  m.updateMatrix();
  geo.applyMatrix4(m.matrix);
  return geo;
}

/** A horizontal rectangle facing down (a ceiling) over [minX, maxX] × [minZ, maxZ] at height `y`, tiled every `tile` m. */
export function ceilingQuad(r: { minX: number; maxX: number; minZ: number; maxZ: number }, y: number, tile: number): THREE.BufferGeometry {
  const w = r.maxX - r.minX;
  const d = r.maxZ - r.minZ;
  const geo = new THREE.PlaneGeometry(w, d);
  // Tile from the world origin, so neighbouring ceilings line up.
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.minX + pos.getX(i) + w / 2) / tile, (r.minZ + pos.getY(i) + d / 2) / tile);
  geo.rotateX(Math.PI / 2); // face down
  geo.translate((r.minX + r.maxX) / 2, y, (r.minZ + r.maxZ) / 2);
  return geo;
}

/** Merges geometries into one (or null when there are none). */
export function merged(parts: THREE.BufferGeometry[]): THREE.BufferGeometry | null {
  if (!parts.length) return null;
  const all = parts.map((g) => (g.index ? g.toNonIndexed() : g));
  const out = mergeGeometries(all, false);
  for (const g of [...parts, ...all]) if (g !== out) g.dispose();
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Building the decoration for a plan.

export type Rect = { minX: number; maxX: number; minZ: number; maxZ: number };
export type Side = 'n' | 's' | 'e' | 'w';

/** What a plan asks for (`GalleryPlan.decor`). */
export type DecorSpec = {
  /** Height of the model's walls (the doorway fills go up to it). */
  wallHeight: number;
  /** Coffered ceilings: rectangles and their height. */
  ceilings: readonly (Rect & { y: number })[];
  /** Rooms whose walls are decorated: the room's inside (wall faces), its ceiling height, and which walls (default all). */
  walls: readonly (Rect & { height: number; sides?: readonly Side[] })[];
  /** Solid blocks closing openings in the model (corners, an entrance), from the floor up to `maxY`. */
  fills?: readonly (Rect & { maxY: number })[];
  /** A pair of panelled doors drawn on a wall (e.g. on the block closing the main entrance). */
  doors?: readonly { x: number; z: number; normal: readonly [number, number]; width: number; height: number }[];
  /** Close the model's doorways around their openings: the wall above the door, a hollow wall's insides, the floor. */
  doorways?: boolean;
  /** The model's floor material (for the doorways' floors). */
  floorMaterial?: string;
  /** The model's own lamps under the new ceilings hang at this height (too close to a ceiling, they glare on it). */
  lampHeight?: number;
  /** Extra lamps (rooms the model left dark): position and intensity (candela). */
  lamps?: readonly { x: number; y: number; z: number; intensity: number }[];
  /** The colour seen through glass roofs. */
  sky?: string;
  palette?: DecorPalette;
};

/** Something on a wall the decoration keeps clear of: its middle along the wall, its half width, and its height range. */
type Taken = { at: number; half: number };

type WallLine = { side: Side; fixed: number; from: number; to: number; normal: THREE.Vector3; point: (t: number, y: number, off: number) => THREE.Vector3 };

function wallsOf(r: Rect, sides: readonly Side[]): WallLine[] {
  const all: Record<Side, WallLine> = {
    n: { side: 'n', fixed: r.minZ, from: r.minX, to: r.maxX, normal: new THREE.Vector3(0, 0, 1), point: (t, y, o) => new THREE.Vector3(t, y, r.minZ + o) },
    s: { side: 's', fixed: r.maxZ, from: r.minX, to: r.maxX, normal: new THREE.Vector3(0, 0, -1), point: (t, y, o) => new THREE.Vector3(t, y, r.maxZ - o) },
    w: { side: 'w', fixed: r.minX, from: r.minZ, to: r.maxZ, normal: new THREE.Vector3(1, 0, 0), point: (t, y, o) => new THREE.Vector3(r.minX + o, y, t) },
    e: { side: 'e', fixed: r.maxX, from: r.minZ, to: r.maxZ, normal: new THREE.Vector3(-1, 0, 0), point: (t, y, o) => new THREE.Vector3(r.maxX - o, y, t) },
  };
  return sides.map((s) => all[s]);
}

/** The free stretches of [from, to] once the taken ones (and a margin at each end) are left out. */
function freeStretches(from: number, to: number, taken: Taken[], margin: number): [number, number][] {
  const busy = taken.map((t) => [t.at - t.half, t.at + t.half] as [number, number]).sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  let at = from + margin;
  for (const [a, b] of busy) {
    if (a > at) out.push([at, Math.min(a, to - margin)]);
    at = Math.max(at, b);
  }
  if (to - margin > at) out.push([at, to - margin]);
  return out.filter(([a, b]) => b - a > 0.05);
}

export type DecorInput = {
  spec: DecorSpec;
  renderer: THREE.WebGLRenderer;
  /** Every photo spot in the model (also those left empty): middle and the direction it faces. */
  spots: readonly { center: THREE.Vector3; normal: THREE.Vector3; width: number; top: number }[];
  /** The doorways of the plan, and which ones lead to a room that is shown. */
  doors: readonly { x: number; z: number; axis: readonly [number, number]; width: number; height: number; face: number }[];
  /** Plaques (4 m wide) and other things hung on walls (the screen), as points and half widths. */
  hung: readonly { x: number; z: number; half: number }[];
  wallMaterial: THREE.Material | null;
  floorMaterial: THREE.Material | null;
};

export type DecorOutput = { meshes: THREE.Mesh[]; colliders: THREE.Mesh[]; lights: THREE.Light[]; disposables: { dispose(): void }[] };

export function buildDecor(input: DecorInput): DecorOutput {
  const { spec, renderer } = input;
  const p = spec.palette ?? DEFAULT_PALETTE;
  const out: DecorOutput = { meshes: [], colliders: [], lights: [], disposables: [] };
  const wall = input.wallMaterial ?? new THREE.MeshStandardMaterial({ color: 0xd8cfbd, roughness: 0.6 });
  const keep = <T extends { dispose(): void }>(x: T) => (out.disposables.push(x), x);
  const add = (geo: THREE.BufferGeometry | null, mat: THREE.Material, collide = false) => {
    if (!geo) return;
    const m = new THREE.Mesh(keep(geo), mat);
    m.matrixAutoUpdate = false;
    out.meshes.push(m);
    if (collide) out.colliders.push(m);
  };

  // --- Closing the model's gaps: solid blocks, doorways, floors.
  const blocks: THREE.BufferGeometry[] = [];
  const box = (minX: number, maxX: number, minY: number, maxY: number, minZ: number, maxZ: number) => {
    if (maxX - minX < 0.01 || maxY - minY < 0.01 || maxZ - minZ < 0.01) return;
    const g = new THREE.BoxGeometry(maxX - minX, maxY - minY, maxZ - minZ);
    g.translate((minX + maxX) / 2, (minY + maxY) / 2, (minZ + maxZ) / 2);
    blocks.push(g);
  };
  for (const f of spec.fills ?? []) box(f.minX, f.maxX, 0, f.maxY, f.minZ, f.maxZ);
  const floors: THREE.BufferGeometry[] = [];
  if (spec.doorways) {
    for (const d of input.doors) {
      const along = d.axis[0] !== 0; // the doorway runs along x (the wall runs along z)
      const hw = d.width / 2 - 0.08; // the opening's half width
      const depth = d.face - 0.02; // just inside both faces of the wall
      // Across the wall: a (along the wall) and b (through it).
      const span = (a0: number, a1: number, y0: number, y1: number, b0: number, b1: number) =>
        along ? box(d.x + b0, d.x + b1, y0, y1, d.z + a0, d.z + a1) : box(d.x + a0, d.x + a1, y0, y1, d.z + b0, d.z + b1);
      // Above the opening, up to the top of the wall.
      span(-hw - 0.3, hw + 0.3, d.height - 0.05, spec.wallHeight, -depth, depth);
      // A hollow wall: fill its insides on both sides of the opening.
      if (d.face > 0.5) {
        span(hw, hw + 12, 0, spec.wallHeight, -depth, depth);
        span(-hw - 12, -hw, 0, spec.wallHeight, -depth, depth);
      }
      // The floor through the doorway.
      const g = new THREE.PlaneGeometry(along ? d.face * 2 + 0.2 : hw * 2 + 0.3, along ? hw * 2 + 0.3 : d.face * 2 + 0.2);
      g.rotateX(-Math.PI / 2);
      g.translate(d.x, 0.004, d.z);
      floors.push(g);
    }
  }
  add(merged(blocks), wall, true);
  if (input.floorMaterial) add(merged(floors), input.floorMaterial);

  // --- Ceilings.
  const cofferMap = keep(decorTexture(cofferTexture(p), renderer, true));
  const cofferMat = keep(decorMaterial(cofferMap, { glow: 0.28 }));
  add(merged(spec.ceilings.map((r) => ceilingQuad(r, r.y, 1.8))), cofferMat);

  // --- Walls: frieze, pilasters, medallions, panels.
  const friezeMap = keep(decorTexture(friezeTexture(p), renderer, true));
  const pilasterMap = keep(decorTexture(pilasterTexture(p), renderer));
  const medallionMap = keep(decorTexture(medallionTexture(p), renderer));
  const friezes: THREE.BufferGeometry[] = [];
  const pilasters: THREE.BufferGeometry[] = [];
  const medallions: THREE.BufferGeometry[] = [];
  const panels = new Map<string, THREE.BufferGeometry[]>();
  const FRIEZE = 1.0;
  for (const room of spec.walls) {
    const friezeTop = room.height - 0.06;
    const friezeBottom = friezeTop - FRIEZE;
    for (const w of wallsOf(room, room.sides ?? ['n', 's', 'e', 'w'])) {
      const len = w.to - w.from;
      const mid = (w.from + w.to) / 2;
      const isOn = (x: number, z: number, near: number) => Math.abs((w.side === 'n' || w.side === 's' ? z : x) - w.fixed) < near && (w.side === 'n' || w.side === 's' ? x : z) > w.from - 0.5 && (w.side === 'n' || w.side === 's' ? x : z) < w.to + 0.5;
      const alongOf = (x: number, z: number) => (w.side === 'n' || w.side === 's' ? x : z);
      friezes.push(quad(w.point(mid, friezeBottom + FRIEZE / 2, 0.015), w.normal, len, FRIEZE, len / 2, 1));
      const taken: Taken[] = [];
      const spotsHere = input.spots.filter((s) => isOn(s.center.x, s.center.z, 0.4));
      for (const s of spotsHere) taken.push({ at: alongOf(s.center.x, s.center.z), half: s.width / 2 + 0.36 });
      for (const d of input.doors) if (isOn(d.x, d.z, d.face + 0.15)) taken.push({ at: alongOf(d.x, d.z), half: d.width / 2 + 0.5 });
      for (const h of input.hung) if (isOn(h.x, h.z, 0.6)) taken.push({ at: alongOf(h.x, h.z), half: h.half });
      const top = friezeBottom - 0.12;
      for (const [a, b] of freeStretches(w.from, w.to, taken, 0.3)) {
        const L = b - a;
        const c = (a + b) / 2;
        if (L >= 3) {
          const pw = Math.min(L - 0.6, 7);
          const ph = Math.min(top - 1.55, 4.8);
          const key = `${pw.toFixed(1)}x${ph.toFixed(1)}`;
          if (!panels.has(key)) panels.set(key, []);
          panels.get(key)!.push(quad(w.point(c, 1.55 + ph / 2, 0.012), w.normal, pw, ph));
          // A pilaster at each end of a long stretch.
          for (const e of [a + 0.3, b - 0.3]) if (L - pw > 0.5) pilasters.push(quad(w.point(e, (1.34 + top) / 2, 0.02), w.normal, 0.5, top - 1.34));
        } else if (L >= 0.7) {
          pilasters.push(quad(w.point(c, (1.34 + top) / 2, 0.02), w.normal, Math.min(0.6, L - 0.12), top - 1.34));
        }
      }
      // A medallion over each photo, where there is room under the frieze.
      for (const s of spotsHere) {
        const size = Math.min(1.05, friezeBottom - s.top - 0.45);
        if (size >= 0.5) medallions.push(quad(w.point(alongOf(s.center.x, s.center.z), (s.top + 0.2 + friezeBottom) / 2, 0.025), w.normal, size, size));
      }
    }
  }
  add(merged(friezes), keep(decorMaterial(friezeMap)));
  add(merged(pilasters), keep(decorMaterial(pilasterMap)));
  add(merged(medallions), keep(decorMaterial(medallionMap, { transparent: true, glow: 0.25 })));
  for (const [key, parts] of panels) {
    const [pw, ph] = key.split('x').map(Number);
    add(merged(parts), keep(decorMaterial(keep(decorTexture(panelTexture(p, pw!, ph!), renderer)))));
  }

  // --- Doors drawn on walls.
  if (spec.doors?.length) {
    const doorsMat = keep(decorMaterial(keep(decorTexture(doorsTexture(p), renderer)), { glow: 0.2 }));
    add(merged(spec.doors.map((d) => quad(new THREE.Vector3(d.x + d.normal[0] * 0.02, d.height / 2, d.z + d.normal[1] * 0.02), new THREE.Vector3(d.normal[0], 0, d.normal[1]), d.width, d.height))), doorsMat);
  }

  // --- Lamps for rooms the model left dark.
  for (const l of spec.lamps ?? []) {
    const lamp = new THREE.PointLight(0xfff1dc, l.intensity, 0, 2);
    lamp.position.set(l.x, l.y, l.z);
    out.lights.push(lamp);
  }
  return out;
}
