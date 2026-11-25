/**
 * A café's drinks in their own cups (owner, 2026-11-24: KOUP's menu): the cup of the drink's kind (a small espresso
 * cup, the dark paper cup of a hot drink, the clear cup of a cold one, each with KOUP's print), and what is in it, built
 * up as the barista makes it: each pour adds its layer (a clear cup shows them, bottom to top), a shot can turn the
 * whole into one colour (`mix`), ice, milk foam with its pattern, and what goes on top (lime, lemon, mint, crumbs, a
 * drizzle down the inside, a dusting). Drunk sip by sip from the top (`setLevel`).
 *
 * Its origin is the cup's base; a hand holds it about half way up (`userData.hold`).
 */
import * as THREE from 'three';
import type { Art, CupKind, Garnish } from './menu';

/** The cups (KOUP's): radius at the base and at the rim, height (as the café's model draws their stacks). */
export const CUPS: Record<CupKind, { r0: number; r1: number; h: number }> = {
  espresso: { r0: 0.022, r1: 0.03, h: 0.058 },
  hot: { r0: 0.03, r1: 0.045, h: 0.11 },
  iced: { r0: 0.032, r1: 0.047, h: 0.13 },
};
const WALL = 0.002;

export type DrinkMaker = {
  /** Pouring colour `c` up to `to` (of the cup's height): `k` 0…1 of the way. */
  pour: (c: string, to: number, k: number) => void;
  /** The whole drink turning `c` (`k` of the way), as a shot stirs into milk. */
  mix: (c: string, k: number) => void;
  ice: () => void;
  art: (kind: Art, c: string) => void;
  top: (g: Garnish, c?: string) => void;
  foam: (c: string) => void;
};
export type Drink = THREE.Group & {
  userData: { kind: CupKind; hold: THREE.Vector3; setLevel: (f: number) => void; make: DrinkMaker; rim: () => THREE.Vector3; level: () => number };
};

const cache = new Map<string, THREE.Texture>();
function canvasTex(key: string, w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  let t = cache.get(key);
  if (t) return t;
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  draw(c.getContext('2d')!);
  t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(key, t);
  return t;
}

/** The print round a cup (u round from +z, v up): KOUP's names, as on their cups. */
function printTex(kind: CupKind) {
  return canvasTex(`print-${kind}`, 512, 256, (g) => {
    if (kind === 'hot') {
      g.fillStyle = '#2e2420';
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = '#4a3a33';
      g.fillRect(0, 0, 512, 10); // the rolled rim
      g.fillStyle = '#c9a46a';
      g.textAlign = 'center';
      g.font = '300 52px serif';
      g.fillText('KOUP', 384, 150); // facing −x … turned to face out by the cup's yaw
      g.font = '600 40px sans-serif';
      g.fillText('كوپ', 128, 150);
    } else if (kind === 'espresso') {
      g.fillStyle = '#ece2d2';
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = '#8a6a4a';
      g.fillRect(0, 150, 512, 106);
      g.fillStyle = '#5b4032';
      g.textAlign = 'center';
      g.font = '500 44px serif';
      g.fillText('KOUP', 384, 120);
      g.fillText('KOUP', 128, 120);
    } else {
      // a clear cup: only the print (black), the rest see-through
      g.clearRect(0, 0, 512, 256);
      g.fillStyle = '#111111';
      g.save();
      g.translate(384, 200);
      g.rotate(-Math.PI / 2);
      g.font = '400 64px serif';
      g.textAlign = 'center';
      g.fillText('KOUP', 0, 22);
      g.restore();
      g.font = '600 30px sans-serif';
      g.textAlign = 'center';
      g.fillText('كوپ', 440, 90);
    }
  });
}

/** The top of a hot drink: its colour, the darker ring of crema at the edge, and the milk's pattern. */
function surfaceTex(c: string, ring: string | undefined, art: Art | null, artC: string, speckle?: string) {
  const key = `s-${c}-${ring}-${art}-${artC}-${speckle}`;
  return canvasTex(key, 256, 256, (g) => {
    const grd = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    grd.addColorStop(0, c);
    grd.addColorStop(0.78, c);
    grd.addColorStop(1, ring ?? c);
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 256);
    if (speckle) {
      g.fillStyle = speckle;
      for (let i = 0; i < 90; i++) g.fillRect(40 + ((i * 97) % 176), 40 + ((i * 61) % 176), 3, 3);
    }
    if (!art) return;
    g.fillStyle = artC;
    g.strokeStyle = artC;
    if (art === 'heart') {
      g.beginPath();
      g.moveTo(128, 196);
      g.bezierCurveTo(52, 140, 64, 72, 106, 80);
      g.bezierCurveTo(118, 82, 126, 94, 128, 106);
      g.bezierCurveTo(130, 94, 138, 82, 150, 80);
      g.bezierCurveTo(192, 72, 204, 140, 128, 196);
      g.fill();
    } else if (art === 'tulip') {
      for (const [y, s] of [
        [170, 1],
        [128, 0.82],
        [92, 0.62],
      ] as const) {
        g.beginPath();
        g.ellipse(128, y, 54 * s, 26 * s, 0, Math.PI, 0);
        g.fill();
      }
      g.fillRect(126, 60, 4, 130);
    } else if (art === 'rosetta') {
      for (let i = 0; i < 7; i++) {
        const s = 1 - i * 0.1;
        g.beginPath();
        g.ellipse(128, 190 - i * 18, 58 * s, 14 * s, 0, 0, Math.PI * 2);
        g.fill();
      }
      g.fillRect(126, 50, 4, 150);
    } else {
      // the swan: a body, the neck curving up, the head
      g.beginPath();
      g.ellipse(120, 160, 56, 30, -0.2, 0, Math.PI * 2);
      g.fill();
      g.lineWidth = 12;
      g.beginPath();
      g.moveTo(160, 150);
      g.bezierCurveTo(200, 120, 160, 70, 140, 90);
      g.stroke();
      g.beginPath();
      g.arc(140, 92, 10, 0, Math.PI * 2);
      g.fill();
    }
  });
}

/** A slice of lime or lemon (seen from above: rind, pith, segments). */
function sliceTex(c: string) {
  return canvasTex(`slice-${c}`, 128, 128, (g) => {
    g.fillStyle = c === 'lime' ? '#4f8a1f' : '#e6c21f';
    g.beginPath();
    g.arc(64, 64, 62, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = '#f4f1dc';
    g.beginPath();
    g.arc(64, 64, 54, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = c === 'lime' ? '#a5d15a' : '#f7e36a';
    for (let i = 0; i < 8; i++) {
      g.beginPath();
      g.moveTo(64, 64);
      g.arc(64, 64, 50, (i / 8) * Math.PI * 2 + 0.05, ((i + 1) / 8) * Math.PI * 2 - 0.05);
      g.fill();
    }
  });
}

const mats = new Map<string, THREE.Material>();
function std(c: string, o: { rough?: number; opacity?: number; map?: THREE.Texture; side?: THREE.Side; vc?: boolean } = {}) {
  const key = `${c}/${o.rough}/${o.opacity}/${o.map?.uuid}/${o.side}/${o.vc}`;
  let m = mats.get(key);
  if (!m) {
    const mm = new THREE.MeshStandardMaterial({ color: c, roughness: o.rough ?? 0.5, map: o.map ?? null, side: o.side ?? THREE.FrontSide, vertexColors: !!o.vc });
    if (o.opacity !== undefined) {
      mm.transparent = true;
      mm.opacity = o.opacity;
      mm.depthWrite = false;
    }
    mats.set(key, (m = mm));
  }
  return m;
}

/** The cup's inside radius at a height. */
const rIn = (cup: { r0: number; r1: number; h: number }, y: number) => cup.r0 - WALL + ((cup.r1 - cup.r0) * y) / cup.h;

/** An empty KOUP cup of a drink of this kind, ready to be made (`userData.make`). `look`: the hot drink's top. */
export function makeDrink(kind: CupKind, look: { crema?: string; ring?: string; speckle?: string } = {}): Drink {
  const cup = CUPS[kind];
  const g = new THREE.Group() as Drink;
  const lathe = (pts: [number, number][], seg = 28) =>
    new THREE.LatheGeometry(
      pts.map(([r, y]) => new THREE.Vector2(Math.max(0.0003, r), y)),
      seg,
    );
  // u round from +z (LatheGeometry's): the print's middle (u 0.75) faces −x; the cup is turned to show it
  const print = printTex(kind);
  if (kind === 'iced') {
    // clear plastic, then its print on the outside
    g.add(new THREE.Mesh(lathe([[0.0003, 0.002], [cup.r0, 0], [cup.r1, cup.h], [cup.r1 + 0.0015, cup.h + 0.002], [cup.r1 - 0.001, cup.h + 0.002], [cup.r0 - WALL, WALL]]), std('#f4f9fa', { rough: 0.08, opacity: 0.16, side: THREE.DoubleSide })));
    const p = new THREE.Mesh(lathe([[cup.r0 + 0.0004, 0.004], [cup.r1 + 0.0004, cup.h - 0.004]], 32), new THREE.MeshStandardMaterial({ map: print, transparent: true, roughness: 0.4, depthWrite: false }));
    g.add(p);
  } else {
    const geo = lathe([[0.0003, 0], [cup.r0, 0], [cup.r1, cup.h], [cup.r1 - WALL, cup.h], [cup.r0 - WALL, WALL], [0.0003, WALL]], 32);
    // the print up the outside (v by height); the inside and the bottom plain (the rim's strip of the picture)
    const pos = geo.attributes.position!,
      uv = geo.attributes.uv!;
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i);
      const r = Math.hypot(pos.getX(i), pos.getZ(i));
      const outerR = cup.r0 + ((cup.r1 - cup.r0) * y) / cup.h;
      uv.setY(i, r < outerR - WALL * 0.5 || y < 0.0005 ? 0.985 : Math.min(0.97, y / cup.h));
    }
    g.add(new THREE.Mesh(geo, std('#ffffff', { map: print, rough: 0.6 })));
  }
  // ---- what is in it ----
  type Layer = { c: THREE.Color; to: number; start: number; open: boolean; from?: THREE.Color };
  const layers: Layer[] = [];
  let level = 0; // fraction of the height
  let drunk = 1; // what is left (sipping)
  let mixTo: THREE.Color | null = null;
  const liquidMat = std('#ffffff', { rough: 0.25, vc: true });
  const liquid = new THREE.Mesh(new THREE.BufferGeometry(), liquidMat);
  liquid.visible = false;
  g.add(liquid);
  // a hot drink: only its top is seen (the cup is opaque)
  let surfaceArt: Art | null = null;
  let artC = '#f6f1e8';
  const surface = new THREE.Mesh(new THREE.CircleGeometry(1, 36), new THREE.MeshStandardMaterial({ roughness: 0.35 }));
  surface.rotation.x = -Math.PI / 2;
  surface.visible = false;
  g.add(surface);
  const toppings = new THREE.Group();
  g.add(toppings);
  const iceCubes = new THREE.Group();
  iceCubes.visible = false;
  g.add(iceCubes);
  const cubes: THREE.Mesh[] = [];
  if (kind === 'iced') {
    const geo = new THREE.BoxGeometry(0.022, 0.022, 0.022);
    for (let i = 0; i < 6; i++) {
      const m = new THREE.Mesh(geo, std('#f4fbfd', { rough: 0.1, opacity: 0.7 }));
      m.rotation.set(i * 0.7, i * 1.3, i * 0.4);
      iceCubes.add(m);
      cubes.push(m);
    }
  }
  const colorAt = (y: number) => {
    // the layer at a height, blending softly (5 mm) into the one below
    const f = y / cup.h;
    let i = layers.findIndex((l) => f <= l.to + 1e-6);
    if (i < 0) i = layers.length - 1;
    const c = layers[i]!.c.clone();
    if (i > 0) {
      const edge = layers[i - 1]!.to * cup.h;
      const k = THREE.MathUtils.clamp((y - edge) / 0.006, 0, 1);
      return layers[i - 1]!.c.clone().lerp(c, 0.5 + 0.5 * k);
    }
    return c;
  };
  const top = () => level * drunk * cup.h;
  const rebuild = () => {
    const h = top();
    const show = layers.length > 0 && h > 0.0015;
    if (kind !== 'iced') {
      surface.visible = show;
      if (show) {
        const tc = '#' + layers[layers.length - 1]!.c.getHexString();
        (surface.material as THREE.MeshStandardMaterial).map = surfaceTex(tc, look.ring ?? look.crema, drunk > 0.93 ? surfaceArt : null, artC, look.speckle);
        if (look.crema && !surfaceArt) (surface.material as THREE.MeshStandardMaterial).map = surfaceTex(look.crema, look.ring ?? darker(look.crema), null, artC);
        (surface.material as THREE.MeshStandardMaterial).needsUpdate = true;
        surface.position.y = WALL + h;
        surface.scale.setScalar(rIn(cup, WALL + h) - 0.0006);
      }
    } else {
      liquid.visible = show;
      if (show) {
        // the liquid: up the inside of the cup to the level, its top flat; coloured by its layers
        const rows = Math.max(2, Math.ceil(h / 0.004));
        const pts: THREE.Vector2[] = [new THREE.Vector2(0.0003, WALL + 0.0005)];
        for (let r = 0; r <= rows; r++) {
          const y = WALL + 0.0005 + ((h - 0.0005) * r) / rows;
          pts.push(new THREE.Vector2(rIn(cup, y) - 0.0008, y));
        }
        pts.push(new THREE.Vector2(0.0003, WALL + h));
        const geo = new THREE.LatheGeometry(pts, 24);
        const pos = geo.attributes.position!;
        const col = new Float32Array(pos.count * 3);
        for (let i = 0; i < pos.count; i++) {
          const c = colorAt(pos.getY(i) - WALL);
          col[i * 3] = c.r;
          col[i * 3 + 1] = c.g;
          col[i * 3 + 2] = c.b;
        }
        geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        liquid.geometry.dispose();
        liquid.geometry = geo;
      }
      // the ice: at the bottom before there is anything, then floating with its tops out
      cubes.forEach((m, i) => {
        const a = i * 2.1;
        const rr = i < 3 ? 0.012 : 0.02;
        const y = layers.length && h > 0.03 ? Math.max(0.012, h - 0.006 - (i % 3) * 0.018) : 0.012 + Math.floor(i / 3) * 0.02;
        m.position.set(Math.cos(a) * rr, WALL + y, Math.sin(a) * rr);
      });
    }
    // what is on top rides on the level
    toppings.position.y = WALL + h;
    toppings.visible = drunk > 0.75;
  };
  const make: DrinkMaker = {
    pour: (c, to, k) => {
      let last = layers[layers.length - 1];
      if (!last || !last.open) {
        last = { c: new THREE.Color(c), to: level, start: level, open: true };
        layers.push(last);
      }
      last.to = level = Math.max(last.start, Math.min(1, last.start + (to - last.start) * Math.min(1, k)));
      if (k >= 1) last.open = false;
      rebuild();
    },
    mix: (c, k) => {
      const col = new THREE.Color(c);
      if (!mixTo || !mixTo.equals(col)) {
        mixTo = col;
        for (const l of layers) l.from = l.c.clone();
      }
      for (const l of layers) l.c.copy(l.from ?? l.c).lerp(col, Math.min(1, k));
      rebuild();
    },
    ice: () => {
      iceCubes.visible = true;
      rebuild();
    },
    art: (a, c) => {
      surfaceArt = a;
      artC = c;
      rebuild();
    },
    foam: (c) => {
      // a pale layer of foam on top (as a shaken iced tea)
      make.pour(c, Math.min(0.97, level + 0.06), 1);
    },
    top: (gName, c) => addTopping(toppings, gName, c, rIn(cup, cup.h * 0.9)),
  };
  g.userData = {
    kind,
    hold: new THREE.Vector3(0, cup.h * 0.48, 0),
    setLevel: (f: number) => {
      drunk = Math.max(0, Math.min(1, f));
      rebuild();
    },
    make,
    rim: () => g.localToWorld(new THREE.Vector3(0, cup.h, 0)),
    level: () => level,
  };
  rebuild();
  return g;
}

const darker = (c: string) => '#' + new THREE.Color(c).multiplyScalar(0.7).getHexString();

/** What goes on top: a slice, a few mint leaves, crumbs, a drizzle down the inside, a dusting, seeds. */
function addTopping(to: THREE.Group, g: Garnish, c: string | undefined, r: number) {
  if (g === 'lime' || g === 'lemon') {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.55, r * 0.55, 0.004, 24), [std('#d9cf9a'), std('#ffffff', { map: sliceTex(g), rough: 0.5 }), std('#ffffff', { map: sliceTex(g), rough: 0.5 })]);
    m.position.set(r * 0.25, 0.004, -r * 0.1);
    m.rotation.set(0.25, 0, 0.12);
    to.add(m);
  } else if (g === 'mint') {
    const leaf = std('#3d8b37', { rough: 0.6 });
    for (let i = 0; i < 4; i++) {
      const m = new THREE.Mesh(new THREE.SphereGeometry(0.009, 10, 6), leaf);
      m.scale.set(1, 0.25, 1.7);
      m.position.set(-r * 0.3 + (i % 2) * 0.01, 0.006 + i * 0.002, -r * 0.2 + i * 0.008);
      m.rotation.set(0.4 * i, i * 1.2, 0.3);
      to.add(m);
    }
  } else if (g === 'crumbs' || g === 'seeds' || g === 'dust') {
    const geo = new THREE.SphereGeometry(g === 'crumbs' ? 0.0035 : g === 'seeds' ? 0.0022 : 0.0012, 6, 4);
    const m = std(c ?? '#3a2a1a', { rough: 0.8 });
    const n = g === 'dust' ? 60 : g === 'crumbs' ? 26 : 18;
    for (let i = 0; i < n; i++) {
      const a = i * 2.399,
        d = Math.sqrt((i + 0.5) / n) * r * 0.85;
      const s = new THREE.Mesh(geo, m);
      s.position.set(Math.cos(a) * d, 0.0015, Math.sin(a) * d);
      to.add(s);
    }
  } else if (g === 'drizzle') {
    // sauce running down the inside of the cup from the rim
    const m = std(c ?? '#5d362f', { rough: 0.3 });
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * Math.PI * 2 + 0.3;
      const pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 8; k++) {
        const y = 0.012 - k * 0.012;
        pts.push(new THREE.Vector3(Math.cos(a + k * 0.08) * (r + 0.001), y, Math.sin(a + k * 0.08) * (r + 0.001)));
      }
      to.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.0025, 6, false), m));
    }
  }
}

// ---------- money ----------
const NOTE_COLOURS: Record<number, [string, string]> = {
  250: ['#6f7fb0', '#3d4a7a'],
  500: ['#5f9a8a', '#2f5f52'],
  1000: ['#c7a76b', '#7a5a2a'],
  5000: ['#4a6fa8', '#24406e'],
  10000: ['#4f9a7a', '#24604a'],
  25000: ['#b0574a', '#6e2a22'],
};
function noteTex(n: number) {
  const [a, b] = NOTE_COLOURS[n] ?? ['#9aa', '#566'];
  return canvasTex(`note-${n}`, 256, 128, (g) => {
    g.fillStyle = a;
    g.fillRect(0, 0, 256, 128);
    g.strokeStyle = b;
    g.lineWidth = 6;
    g.strokeRect(8, 8, 240, 112);
    g.fillStyle = b;
    g.globalAlpha = 0.25;
    g.beginPath();
    g.arc(70, 64, 38, 0, Math.PI * 2);
    g.fill();
    g.globalAlpha = 1;
    g.font = '700 38px sans-serif';
    g.textAlign = 'right';
    g.fillText(n.toLocaleString('en-US'), 236, 54);
    g.font = '600 20px sans-serif';
    g.fillText('IQD · دينار', 236, 100);
  });
}
export type Cash = THREE.Group & { userData: { notes: number[]; hold: THREE.Vector3 } };
/**
 * The money for an order: Iraqi dinar notes, folded once, fanned a little, as held between thumb and fingers (in its
 * XY plane facing +z, like the cookie; held at the bottom of the fan).
 */
export function makeCash(notes: number[]): Cash {
  const g = new THREE.Group() as Cash;
  notes.forEach((n, i) => {
    const t = noteTex(n);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.078, 0.068, 0.0008), [std('#d8d4c8'), std('#d8d4c8'), std('#d8d4c8'), std('#d8d4c8'), std('#ffffff', { map: t, rough: 0.8 }), std('#ffffff', { map: t, rough: 0.8 })]);
    const a = (i - (notes.length - 1) / 2) * 0.12;
    m.position.set(Math.sin(a) * 0.03, 0.034 - 0.03 + Math.cos(a) * 0.03, i * 0.0012);
    m.rotation.z = -a;
    g.add(m);
  });
  g.userData = { notes, hold: new THREE.Vector3(0, 0.012, 0), grip: { type: 'slab', t: 0.006, R: 0.042, c: [0, 0.034, 0] } };
  return g;
}

/** A wedge of lime or lemon, or a sprig of mint, as the barista picks it from the garnish tray. */
export function makeGarnish(gName: Garnish): THREE.Group {
  const g = new THREE.Group();
  addTopping(g, gName === 'mint' ? 'mint' : gName === 'lemon' ? 'lemon' : 'lime', undefined, 0.03);
  g.children.forEach((c) => c.position.set(0, 0, 0));
  g.userData = { hold: new THREE.Vector3(0, 0, 0), grip: { type: 'slab', t: 0.005, R: 0.018 } };
  return g;
}
