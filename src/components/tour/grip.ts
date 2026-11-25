/**
 * Hands that fit what they hold (owner, 2026-11-25, the character-anatomy-animation and npc-interaction-animation
 * skills): each held thing has its own grip shape (a cup's radius at the holding height and its taper, a bottle's, a
 * thin slab for a cookie or notes), the thing sits in the palm by its size (the palm against its side), and each
 * finger and the thumb curl only until they reach its surface, `GAP` away. The same for the staff's hands and the
 * visitor's own: both have the anatomy below (tours/koupup/people.js `HAND`, props.ts `makeFPHand`).
 *
 * Hand space: the wrist at the origin, −Y the fingers, +Z the thumb side, the palm's face toward −sx·X (sx +1 the left
 * hand, −1 the right). A finger bends at its knuckle and its middle about Z by −sx·angle (toward the palm); the thumb
 * from its rest turn (−0.5, 0, −sx·0.25) the same way. A held thing's own space: its origin at its base (a cup) or
 * middle (a cookie), +Y up its axis, +Z the face of a flat thing; its axis lies along the hand's Z (thumb up).
 *
 * Switched on only for a model that asks for it (a node `TOUR_FEATURES` with extras `fitGrip: true`): the demo of
 * 2026-11-25 (tours/koupup-v2/); every other tour keeps its hands as they were.
 */
import * as THREE from 'three';

/** How far each finger stops from the surface it closes on (metres). */
export const GAP = 0.003;

/** The hand's anatomy, as people.js and makeFPHand build it. */
export const HAND = {
  knuckleY: -0.095,
  fingers: [
    { z: 0.024, len: [0.044, 0.044], r: 0.0088 },
    { z: 0.008, len: [0.048, 0.048], r: 0.0092 },
    { z: -0.008, len: [0.045, 0.044], r: 0.0088 },
    { z: -0.023, len: [0.036, 0.034], r: 0.0075 },
  ],
  thumb: { base: [-0.012, -0.028, 0.03] as const, rest: [-0.5, 0, -0.25] as const, len: [0.036, 0.034], r: [0.011, 0.0095] },
  /** The palm: an ellipsoid (half sizes) centred here; the ball of the thumb (thenar). */
  palm: { at: [0, -0.0515, 0.002] as const, half: [0.014, 0.0535, 0.039] as const },
  thenar: { at: [-0.006, -0.04, 0.022] as const, half: [0.0162, 0.0252, 0.018] as const },
  /** The pinch socket (a cookie's edge between thumb and fingertips), as before. */
  pinch: [-0.022, -0.115, 0.03] as const,
};

/** What a hand closes on, in the thing's own space. */
export type GripShape =
  | { type: 'cyl'; r0: number; r1: number; h: number; hold: number }
  | { type: 'slab'; t: number; R: number; c?: [number, number, number] };

/** A hand's pose round a thing: the fingers' bends, the thumb's, where the thing's holding point sits (hand space). */
/** `ts`: the thumb swung sideways (radians about its own X: along a cup's side, across to a flat thing's other face). */
export type GripFit = { f: [number, number][]; t: [number, number]; ts: number; socket: THREE.Vector3; socketKind: 'grip' | 'pinch' };

let enabled = false;
/** On for a model that asks for it (see the header). */
export function setFitGrip(on: boolean) {
  enabled = on;
}
export function fitGripOn() {
  return enabled;
}

/**
 * The grip shape of a held thing: what it says (`userData.grip`), else by its kind (a cup by its size; the model's
 * bottles by their shape). Null: held as before (the ice scoop, by its handle).
 */
export function shapeOf(prop: THREE.Object3D, kind: string): GripShape | null {
  const ud = prop.userData as { grip?: GripShape; hold?: THREE.Vector3 | number[]; shape?: string; kind?: string };
  if (ud.grip) return ud.grip;
  const holdY = Array.isArray(ud.hold) ? Number(ud.hold[1]) : ud.hold instanceof THREE.Vector3 ? ud.hold.y : 0.042;
  const cyl = (r0: number, r1: number, h: number): GripShape => ({ type: 'cyl', r0, r1, h, hold: holdY });
  switch (kind) {
    case 'coffee': {
      const c = ({ espresso: [0.022, 0.03, 0.058], hot: [0.03, 0.045, 0.11], iced: [0.032, 0.047, 0.13] } as Record<string, number[]>)[ud.kind ?? ''];
      return c ? cyl(c[0]!, c[1]!, c[2]!) : cyl(0.03, 0.043, 0.085);
    }
    case 'bottle':
      return ud.shape === 'jar' ? cyl(0.045, 0.045, 0.1) : ud.shape === 'shaker' ? cyl(0.025, 0.025, 0.08) : ud.shape === 'carton' ? cyl(0.038, 0.038, 0.17) : cyl(0.032, 0.032, 0.17);
    case 'pitcher':
      return cyl(0.04, 0.04, 0.06);
    case 'jug':
      return cyl(0.045, 0.06, 0.2);
    case 'cookie':
      return { type: 'slab', t: 0.011, R: 0.045 };
    case 'cash':
      return { type: 'slab', t: 0.006, R: 0.042, c: [0, 0.034, 0] };
    default:
      return null;
  }
}

// ---------- the hand's bones, worked out ----------
const Z = new THREE.Vector3(0, 0, 1);
const tmpQ = new THREE.Quaternion();
const tmpE = new THREE.Euler();

/** Points along a finger (hand space), with the finger's radius there, for knuckle and middle bends `a`, `b`. */
export function fingerPoints(sx: number, i: number, a: number, b: number) {
  const f = HAND.fingers[i]!;
  const base = new THREE.Vector3(0, HAND.knuckleY, f.z);
  const qa = new THREE.Quaternion().setFromAxisAngle(Z, -sx * a);
  const qb = qa.clone().multiply(tmpQ.setFromAxisAngle(Z, -sx * b));
  return segPoints(base, qa, f.len[0]!, f.r, qb, f.len[1]!, f.r * 0.92);
}
/** Points along the thumb (hand space) for its base and tip bends. */
export function thumbPoints(sx: number, t0: number, t1: number, ts = 0) {
  const T = HAND.thumb;
  const base = new THREE.Vector3(sx * T.base[0], T.base[1], T.base[2]);
  const rest = new THREE.Quaternion().setFromEuler(tmpE.set(T.rest[0], T.rest[1], sx * T.rest[2]));
  // its own turn: sideways (X) then bending (Z), as the bone is turned (Euler XYZ)
  const qa = rest.multiply(new THREE.Quaternion().setFromEuler(tmpE.set(ts, 0, -sx * t0)));
  const qb = qa.clone().multiply(new THREE.Quaternion().setFromEuler(tmpE.set(-t1 * 0.4, 0, -sx * t1)));
  return segPoints(base, qa, T.len[0]!, T.r[0]!, qb, T.len[1]!, T.r[1]!);
}
function segPoints(base: THREE.Vector3, qa: THREE.Quaternion, la: number, ra: number, qb: THREE.Quaternion, lb: number, rb: number) {
  const out: { p: THREE.Vector3; r: number; seg: 0 | 1 }[] = [];
  const down = new THREE.Vector3(0, -1, 0);
  const da = down.clone().applyQuaternion(qa);
  const mid = base.clone().addScaledVector(da, la);
  for (let k = 0; k <= 4; k++) out.push({ p: base.clone().addScaledVector(da, (la * k) / 4), r: ra, seg: 0 });
  const db = down.clone().applyQuaternion(qb);
  // to the fingertip's end (the capsule's cap reaches a little past the bone's length)
  for (let k = 1; k <= 5; k++) out.push({ p: mid.clone().addScaledVector(db, ((lb + rb * 0.4) * k) / 5), r: rb, seg: 1 });
  return out;
}

/** How a held thing sits in the hand: its frame turned into the hand's (`q`), and its holding point (its own space). */
export type Hold = { q: THREE.Quaternion; hold: THREE.Vector3 };
/** A cup or bottle: its axis along the hand's Z (thumb up), held at its holding height. */
export function uprightHold(shape: GripShape & { type: 'cyl' }): Hold {
  return { q: new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)), hold: new THREE.Vector3(0, shape.hold, 0) };
}

/**
 * How far a point (hand space) is from a held thing's surface (positive outside), the thing held with its holding
 * point at `socket` (hand space), turned as `h` says.
 */
export function surfaceDistance(shape: GripShape, socket: THREE.Vector3, p: THREE.Vector3, h?: Hold) {
  const hh = h ?? (shape.type === 'cyl' ? uprightHold(shape) : { q: new THREE.Quaternion(), hold: new THREE.Vector3() });
  const local = p.clone().sub(socket).applyQuaternion(hh.q.clone().invert()).add(hh.hold);
  return propDistance(shape, local);
}

/** The palm's and thenar's surface points (hand space) facing what is held. */
function palmPoints(sx: number) {
  const out: THREE.Vector3[] = [];
  for (const e of [HAND.palm, HAND.thenar])
    for (let i = 0; i < 9; i++) {
      // on the face side of the ellipsoid (toward −sx·X)
      const u = ((i % 3) - 1) * 0.7,
        v = (Math.floor(i / 3) - 1) * 0.7;
      const w = Math.sqrt(Math.max(0, 1 - u * u - v * v));
      out.push(new THREE.Vector3(sx * e.at[0] - sx * w * e.half[0], e.at[1] + u * e.half[1], e.at[2] + v * e.half[2]));
    }
  return out;
}

const cache = new Map<string, GripFit>();
/**
 * The fitted grip of hand `sx` on `shape` (`normal`: a slab's face normal in hand space). Cached per hand and shape.
 * A cup: placed with its side against the palm (and the ball of the thumb) `GAP` away, its middle level with the
 * palm's lower half; each finger closes (the knuckle first, then the middle joint) until it is `GAP` from the side;
 * then the thumb. A slab: at the pinch point; the index and middle finger close on one face, the thumb on the other,
 * the last two fingers tuck in.
 */
export function fitGrip(sx: number, shape: GripShape, how?: Hold): GripFit {
  const h = how ?? (shape.type === 'cyl' ? uprightHold(shape) : { q: new THREE.Quaternion(), hold: new THREE.Vector3() });
  const key = `${sx}|${JSON.stringify(shape)}|${[...h.q.toArray(), ...h.hold.toArray()].map((x) => x.toFixed(3)).join(',')}`;
  const hit = cache.get(key);
  if (hit) return hit;
  let socket: THREE.Vector3;
  if (shape.type === 'cyl') {
    // out from the palm until nothing of the palm is inside it
    const palm = palmPoints(sx);
    let d = 0.0;
    socket = new THREE.Vector3(-sx * d, -0.066, 0);
    for (d = 0; d < 0.2; d += 0.0005) {
      socket.set(-sx * d, -0.066, 0);
      if (palm.every((p) => surfaceDistance(shape, socket, p, h) >= GAP)) break;
    }
  } else {
    // at the pinch point, or as little away from it as needed for the palm and the fingers' roots to be clear of it
    const pinch = new THREE.Vector3(sx * HAND.pinch[0], HAND.pinch[1], HAND.pinch[2]);
    const palm = palmPoints(sx);
    const roots = [...HAND.fingers.map((_, i) => fingerPoints(sx, i, 0, 0)[0]!), thumbPoints(sx, 0, 0)[0]!, thumbPoints(sx, 0, 0)[1]!];
    const offsets: THREE.Vector3[] = [];
    for (let x = -0.04; x <= 0.04001; x += 0.004) for (let y = -0.04; y <= 0.04001; y += 0.004) for (let z = -0.02; z <= 0.02001; z += 0.004) offsets.push(new THREE.Vector3(x, y, z));
    offsets.sort((a, b) => a.lengthSq() - b.lengthSq());
    socket = pinch.clone();
    for (const o of offsets) {
      const at = pinch.clone().add(o);
      if (palm.every((p) => surfaceDistance(shape, at, p, h) >= GAP) && roots.every((r) => surfaceDistance(shape, at, r.p, h) - r.r >= GAP)) {
        socket = at;
        break;
      }
    }
  }
  const dist = (pts: { p: THREE.Vector3; r: number }[]) => Math.min(...pts.map((x) => surfaceDistance(shape, socket, x.p, h) - x.r));
  const clear = (pts: { p: THREE.Vector3; r: number }[]) => dist(pts) >= GAP;
  let f: [number, number][];
  let t: [number, number, number];
  if (shape.type === 'cyl') {
    // round its side: each finger closes until it touches (one that never does, above a short thing, curls as a grip)
    f = HAND.fingers.map((_, i) => closeChain((a, b) => fingerPoints(sx, i, a, b), clear, 1.6, 1.8, 0, 0, [1.0, 1.05]));
    // the thumb lies along its side: of the poses clear of it, the one hugging it closest along its length
    t = searchThumb(sx, (pts) => {
      const ds = pts.map((x) => surfaceDistance(shape, socket, x.p, h) - x.r);
      if (Math.min(...ds) < GAP) return Infinity;
      const along = ds.slice(3);
      return along.reduce((a, d) => a + (d - GAP), 0) / along.length;
    });
  } else {
    // a pinch: the index and middle fingertips on one face, the thumb's tip on the other, each GAP off it
    const P = { f: [[0.75, 0.55], [0.7, 0.5], [1.35, 1.3], [1.45, 1.35]], t: [0.75, 0.35] };
    const tipD = (pts: { p: THREE.Vector3; r: number }[]) => surfaceDistance(shape, socket, pts[pts.length - 1]!.p, h) - pts[pts.length - 1]!.r;
    f = HAND.fingers.map((_, i) => nearest((a, b) => fingerPoints(sx, i, a, b), dist, P.f[i] as [number, number], i < 2, tipD));
    const side = (p: THREE.Vector3) => Math.sign(faceSide(shape, socket, p, h));
    const fingersOn = side(fingerPoints(sx, 0, f[0]![0], f[0]![1]).at(-1)!.p);
    t = searchThumb(sx, (pts) => {
      if (dist(pts) < GAP) return Infinity;
      const tip = pts[pts.length - 1]!;
      return Math.abs(tipD(pts) - GAP) * 10 + (side(tip.p) === fingersOn ? 1 : 0);
    });
  }
  const fit: GripFit = { f, t: [t[0], t[1]], ts: t[2], socket, socketKind: shape.type === 'cyl' ? 'grip' : 'pinch' };
  cache.set(key, fit);
  return fit;
}

/**
 * Closes a two-joint chain until it touches: both joints together (the middle a little more) until any part would come
 * within `GAP`, then the middle joint alone until its part would. Stops at the joints' limits.
 */
function closeChain(
  points: (a: number, b: number) => { p: THREE.Vector3; r: number; seg: 0 | 1 }[],
  clear: (p: { p: THREE.Vector3; r: number }[]) => boolean,
  maxA: number,
  maxB: number,
  a0 = 0,
  b0 = 0,
  free?: [number, number],
): [number, number] {
  let a = a0,
    b = b0;
  const STEP = 0.01;
  while (a < maxA) {
    const na = a + STEP,
      nb = Math.min(maxB, b + STEP * 1.1);
    if (!clear(points(na, nb))) break;
    a = na;
    b = nb;
  }
  if (a >= maxA - 1e-9 && free && clear(points(free[0], free[1]))) return free; // touched nothing
  while (b < maxB) {
    const nb = b + STEP;
    if (!clear(points(a, nb))) break;
    b = nb;
  }
  return [a, b];
}

/**
 * The pose of a chain nearest `want` that keeps it `GAP` or more off the thing and, when `touch`, has it touching
 * (within 2 mm more): searched over the joints' range.
 */
function nearest(
  points: (a: number, b: number) => { p: THREE.Vector3; r: number; seg: 0 | 1 }[],
  dist: (p: { p: THREE.Vector3; r: number }[]) => number,
  want: [number, number],
  touch: boolean,
  tip?: (p: { p: THREE.Vector3; r: number }[]) => number,
): [number, number] {
  let best: [number, number] | null = null,
    bestScore = Infinity;
  for (let a = -0.1; a <= 1.7; a += 0.03)
    for (let b = -0.05; b <= 1.8; b += 0.03) {
      const pts = points(a, b);
      const d = dist(pts);
      if (d < GAP) continue;
      const off = (a - want[0]) ** 2 + (b - want[1]) ** 2;
      // touching: the fingertip's pad on it (or else the nearest part of the finger)
      const near = tip ? tip(pts) : d;
      const score = off * 0.05 + (touch ? Math.abs(near - GAP) * 400 : 0);
      if (score < bestScore) {
        bestScore = score;
        best = [a, b];
      }
    }
  return best ?? want;
}

/**
 * The fingers' least distance to the surface of what the hand holds (metres; negative: a finger inside it), measured on
 * the hand as it is posed now: `wrist` the hand's wrist (its world matrix), the fingers' and thumb's bones, `prop` the
 * held thing and its shape. For the debug view (`?debug=1`).
 */
export function fingerClearance(bones: { f: [THREE.Object3D, THREE.Object3D][]; t: [THREE.Object3D, THREE.Object3D] }, prop: THREE.Object3D, shape: GripShape) {
  return Math.min(...fingerClearances(bones, prop, shape));
}
/** The same, finger by finger (index, middle, ring, little, thumb). */
export function fingerClearances(bones: { f: [THREE.Object3D, THREE.Object3D][]; t: [THREE.Object3D, THREE.Object3D] }, prop: THREE.Object3D, shape: GripShape) {
  prop.updateMatrixWorld(true);
  const inv = prop.matrixWorld.clone().invert();
  const chains: { bones: [THREE.Object3D, THREE.Object3D]; len: [number, number]; r: [number, number] }[] = [
    ...bones.f.map((c, i) => ({ bones: c, len: HAND.fingers[i]!.len as [number, number], r: [HAND.fingers[i]!.r, HAND.fingers[i]!.r * 0.92] as [number, number] })),
    { bones: bones.t, len: HAND.thumb.len as [number, number], r: HAND.thumb.r as [number, number] },
  ];
  const v = new THREE.Vector3();
  const out: number[] = [];
  for (const c of chains) {
    let worst = Infinity;
    for (let s = 0; s < 2; s++) {
      const bone = c.bones[s]!;
      bone.updateMatrixWorld(true);
      const end = (c.len[s]! + (s === 1 ? c.r[s]! * 0.4 : 0)) * 1;
      for (let k = 0; k <= 4; k++) {
        v.set(0, (-end * k) / 4, 0).applyMatrix4(bone.matrixWorld).applyMatrix4(inv);
        const d = propDistance(shape, v) - c.r[s]!;
        if (d < worst) worst = d;
      }
    }
    out.push(Math.round(worst * 10000) / 10000);
  }
  return out;
}
/** A point's distance (the thing's own space) from its surface (positive outside). */
function propDistance(shape: GripShape, p: THREE.Vector3) {
  if (shape.type === 'slab') {
    // a flat round thing (its middle at `c`)
    const [cx, cy, cz] = shape.c ?? [0, 0, 0];
    const inPlane = Math.hypot(p.x - cx, p.y - cy);
    if (inPlane > shape.R + 0.01) return Math.hypot(inPlane - shape.R, p.z - cz);
    return Math.abs(p.z - cz) - shape.t / 2;
  }
  if (p.y < -0.005 || p.y > shape.h + 0.005) return 0.05;
  const radius = shape.r0 + ((shape.r1 - shape.r0) * THREE.MathUtils.clamp(p.y, 0, shape.h)) / shape.h;
  return Math.hypot(p.x, p.z) - radius;
}

/**
 * How a thing sits in a hand turned `handQ` (world) when the thing is turned `propQ` (world), held at `hold` (its own
 * space): for a flat thing (a cookie, notes), whose grip depends on how it is turned in the hand.
 */
export function holdIn(handQ: THREE.Quaternion, propQ: THREE.Quaternion, hold: THREE.Vector3): Hold {
  const q = handQ.clone().invert().multiply(propQ);
  // rounded, so the same hold gives the same (cached) grip
  q.set(...(q.toArray().map((x) => Math.round(x * 200) / 200) as [number, number, number, number])).normalize();
  return { q, hold: hold.clone() };
}

/** Each finger's measurements, kept for the debug view: who, what, the step, the least distance seen. */
export const FINGER_LOG: { who: string; what: string; phase: string; min: number; n: number; below: number[] }[] = [];
export function logFingers(who: string, what: string, phase: string, d: number) {
  let e = FINGER_LOG.find((x) => x.who === who && x.what === what && x.phase === phase);
  if (!e) FINGER_LOG.push((e = { who, what, phase, min: d, n: 0, below: [] }));
  e.min = Math.min(e.min, Math.round(d * 10000) / 10000);
  // which frames of the phase were inside (for finding why)
  if (d < 0 && e.below.length < 40) e.below.push(e.n);
  e.n++;
}

/**
 * The hand opening to take a thing (before its fingers close on it): each finger well open of where it will close, the
 * thumb opened out past its place, so nothing of the hand is inside the thing as the hand arrives round it.
 */
export function preShape(fit: GripFit): { f: [number, number][]; t: [number, number]; ts: number } {
  // a pinch comes already shaped for it (opening the thumb or the fingers, they would pass through a flat thing from
  // its other side): the fitted pose is clear of it by its making
  if (fit.socketKind === 'pinch') return { f: fit.f.map((x) => [x[0], x[1]] as [number, number]), t: [fit.t[0], fit.t[1]], ts: fit.ts };
  return {
    f: fit.f.map(([a, b]) => [Math.min(0.25, a * 0.35), Math.min(0.3, b * 0.35)] as [number, number]),
    t: [Math.min(fit.t[0] - 0.35, 0.05), Math.min(fit.t[1], 0.1)],
    ts: fit.ts,
  };
}

/** Which side of a flat thing's face a point (hand space) is on (its signed distance along the face's normal). */
function faceSide(shape: GripShape, socket: THREE.Vector3, p: THREE.Vector3, h: Hold) {
  const local = p.clone().sub(socket).applyQuaternion(h.q.clone().invert()).add(h.hold);
  return local.z - (shape.type === 'slab' ? (shape.c?.[2] ?? 0) : 0);
}

/** The thumb's pose (bend at its base and tip, sideways swing) scoring least: coarse over its range, then finer. */
function searchThumb(sx: number, score: (pts: { p: THREE.Vector3; r: number; seg: 0 | 1 }[]) => number): [number, number, number] {
  let best: [number, number, number] = [0.55, 0.45, 0];
  let bestS = Infinity;
  const look = (t0: number, t1: number, ts: number) => {
    const sc = score(thumbPoints(sx, t0, t1, ts)) + 0.002 * ts * ts;
    if (sc < bestS) {
      bestS = sc;
      best = [t0, t1, ts];
    }
  };
  for (let ts = -1.0; ts <= 1.0001; ts += 0.1) for (let t0 = -1.2; t0 <= 1.0001; t0 += 0.1) for (let t1 = -0.2; t1 <= 1.0001; t1 += 0.15) look(t0, t1, ts);
  const [a, b, c] = best;
  for (let ts = c - 0.1; ts <= c + 0.1001; ts += 0.025) for (let t0 = a - 0.1; t0 <= a + 0.1001; t0 += 0.025) for (let t1 = b - 0.15; t1 <= b + 0.1501; t1 += 0.0375) look(t0, t1, ts);
  return best;
}
