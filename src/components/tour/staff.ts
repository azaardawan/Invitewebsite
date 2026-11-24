/**
 * A café tour's waiter (owner, 2026-11-23; rebuilt 2026-11-24 with the character and NPC interaction skills): a person
 * of the model named `CLEANER` (skeleton as in character.ts) who goes round the place wiping the tables: his round is
 * the points `CLEANER_stop_<n>` (in order, looping; each faces the way he faces there, its extras' `wipe` the seconds he
 * wipes the table there, 0 to walk on). Wiping, his hand (the cloth under it) is on the table's top, found by looking
 * down at it, and goes round in circles; the other hand rests on the edge. He waits for a visitor in his way.
 *
 * A seated visitor can call him: he walks to them along the café's walkways (`NAV_<n>`, extras `links`), takes the
 * order, goes to the counter (`NAV_0`, then up to it), takes the order from the barista hand to hand, carries it back
 * upright, steps up to the visitor and holds it out until their hand has it; then back to his round.
 */
import * as THREE from 'three';
import { Character } from './character';
import { Actor, CONTACT, HOLD, type Kind } from './interaction';

/** Where the waiter stands by a seat, and the walkway point he comes from. */
export type SeatSpot = { stand: THREE.Vector3; seat: THREE.Vector3; nav: number };
type Stop = { at: THREE.Vector3; yaw: number; wipe: number };
/** The height of what is under a point (a table's top), looking down from `from`; null if nothing. */
export type SurfaceAt = (x: number, z: number, from: number) => number | null;

const WALK = 0.75;
const HURRY = 1.0;

export class Cleaner {
  private a: Actor;
  private stops: Stop[];
  private next = 1;
  private nav: { at: THREE.Vector3; links: number[] }[];
  private serving = false;
  private surface: SurfaceAt;
  private viewer = new THREE.Vector3();
  private wiping = false;

  static find(scene: THREE.Object3D, surface: SurfaceAt): Cleaner | null {
    const ch = Character.find(scene, 'CLEANER');
    if (!ch) return null;
    const stops: { n: number; s: Stop }[] = [];
    const nav: { n: number; at: THREE.Vector3; links: number[] }[] = [];
    scene.traverse((o) => {
      let m = /^CLEANER_stop_(\d+)/.exec(o.name);
      if (m) {
        const at = o.getWorldPosition(new THREE.Vector3());
        const f = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
        stops.push({ n: Number(m[1]), s: { at, yaw: Math.atan2(f.x, f.z), wipe: Number((o.userData as { wipe?: number }).wipe) || 0 } });
      }
      m = /^NAV_(\d+)/.exec(o.name);
      if (m) {
        const links = (o.userData as { links?: unknown }).links;
        nav.push({ n: Number(m[1]), at: o.getWorldPosition(new THREE.Vector3()), links: Array.isArray(links) ? links.map(Number) : [] });
      }
    });
    if (stops.length < 2) return null;
    const list: { at: THREE.Vector3; links: number[] }[] = [];
    for (const p of nav) list[p.n] = { at: p.at, links: p.links };
    return new Cleaner(
      ch,
      stops.sort((x, y) => x.n - y.n).map((x) => x.s),
      list,
      surface,
    );
  }

  private constructor(ch: Character, stops: Stop[], nav: { at: THREE.Vector3; links: number[] }[], surface: SurfaceAt) {
    this.a = new Actor(ch);
    this.stops = stops;
    this.nav = nav;
    this.surface = surface;
    // he begins at his first stop, wiping
    this.a.then(...this.wipe(stops[0]!));
  }

  /** His person (for the debug view). */
  get character() {
    return this.a.ch;
  }

  canServe(spot: SeatSpot | null) {
    return !!spot && this.nav.length > 1 && !!this.nav[0] && !!this.nav[spot.nav];
  }
  get busy() {
    return this.serving;
  }

  // ---------- the round ----------

  /** Someone in his way: a visitor just ahead of him, close (he waits). */
  private blocked = () => {
    const p = this.a.position;
    const f = new THREE.Vector3(Math.sin(this.a.yaw), 0, Math.cos(this.a.yaw));
    const to = this.viewer.clone().sub(p).setY(0);
    return !this.serving && to.length() < 0.9 && to.dot(f) > 0;
  };

  private wipe(stop: Stop) {
    const a = this.a;
    const f = () => new THREE.Vector3(Math.sin(stop.yaw), 0, Math.cos(stop.yaw));
    let top: number | null = null;
    return [
      a.face(() => stop.yaw),
      {
        limit: stop.wipe,
        start: () => {
          // the table's top in front of him
          const p = stop.at.clone().addScaledVector(f(), 0.5);
          const t = this.surface(p.x, p.z, stop.at.y + 1.3);
          top = t !== null && t > stop.at.y + 0.25 && t < stop.at.y + 1.15 ? t : null;
          this.wiping = top !== null;
          if (top === null) return;
          // lower tables: he bends more, and bends his knees
          const h = top - stop.at.y;
          a.ch.lean = THREE.MathUtils.clamp((0.95 - h) * 1.1, 0.15, 0.75);
          a.ch.crouch = h < 0.55 ? 0.35 : 0;
          a.ch.look(stop.at.clone().addScaledVector(f(), 0.5).setY(top));
        },
        run: (_dt: number, t: number) => {
          if (top === null) return t > 1;
          const fwd = f();
          const side = new THREE.Vector3(fwd.z, 0, -fwd.x); // his left
          // the cloth goes round in circles on the top (the hand palm down, the socket under the palm)
          const c = stop.at.clone().addScaledVector(fwd, 0.45).addScaledVector(side, -0.08);
          c.addScaledVector(fwd, Math.sin(t * 5) * 0.07).addScaledVector(side, Math.cos(t * 5) * 0.09);
          c.y = top + 0.026 - 0.058; // the palm (with the cloth) on the top: the socket is 5.8 cm under the wrist
          a.ch.reach.R = { at: c, quat: palmDown('R', stop.yaw), weight: 1 };
          a.ch.hand.R = 'flat';
          // the other hand flat on the table near its edge
          const l = stop.at.clone().addScaledVector(fwd, 0.36).addScaledVector(side, 0.22);
          l.y = top + 0.014 - 0.058;
          a.ch.reach.L = { at: l, quat: palmDown('L', stop.yaw), weight: 0.9 };
          a.ch.hand.L = 'flat';
          return false;
        },
        end: () => {
          this.wiping = false;
          a.ch.reach.L = a.ch.reach.R = null;
          a.ch.hand.L = a.ch.hand.R = 'relaxed';
          a.ch.lean = 0;
          a.ch.crouch = 0;
          a.ch.look(null);
        },
      },
      { run: (_d: number, t: number) => t > 0.35 },
    ];
  }

  private roundOn() {
    if (this.serving || this.a.busy) return;
    const stop = this.stops[this.next]!;
    this.next = (this.next + 1) % this.stops.length;
    this.a.then(...this.a.walkTo(() => stop.at, WALK, this.blocked));
    if (stop.wipe) this.a.then(...this.wipe(stop));
  }

  // ---------- serving ----------

  /** The walkway points from the one nearest him to point `to` (the shortest way). */
  private route(to: number): THREE.Vector3[] {
    const here = this.a.position;
    let from = -1,
      best = Infinity;
    this.nav.forEach((p, i) => {
      if (!p) return;
      const d = p.at.distanceTo(here);
      if (d < best) {
        best = d;
        from = i;
      }
    });
    if (from < 0 || !this.nav[to]) return [];
    const dist = this.nav.map(() => Infinity);
    const prev: number[] = this.nav.map(() => -1);
    const open = new Set<number>([from]);
    dist[from] = 0;
    while (open.size) {
      let u = -1;
      for (const i of open) if (u < 0 || dist[i]! < dist[u]!) u = i;
      open.delete(u);
      if (u === to) break;
      for (const w of this.nav[u]?.links ?? []) {
        if (!this.nav[w]) continue;
        const d = dist[u]! + this.nav[u]!.at.distanceTo(this.nav[w]!.at);
        if (d < dist[w]!) {
          dist[w] = d;
          prev[w] = u;
          open.add(w);
        }
      }
    }
    if (to !== from && prev[to] === -1) return [];
    const path: THREE.Vector3[] = [];
    for (let i = to; i !== -1; i = prev[i]!) path.unshift(this.nav[i]!.at.clone());
    return path;
  }

  private goVia(nav: number, last: THREE.Vector3) {
    for (const p of this.route(nav)) this.a.then(...this.a.walkTo(() => p, HURRY));
    this.a.then(...this.a.walkTo(() => last, HURRY));
  }

  /** A seated visitor calls him: he comes to stand by their seat, facing them (`arrived`). */
  summon(spot: SeatSpot, arrived: () => void) {
    this.serving = true;
    this.a.clear();
    this.a.ch.reach.L = this.a.ch.reach.R = null;
    this.a.ch.lean = this.a.ch.crouch = 0;
    this.goVia(spot.nav, spot.stand);
    this.a.then(this.a.face(() => yawTo(spot.stand, spot.seat)), { run: () => (arrived(), true) });
  }

  /** Off to the counter for the order: up to the counter's front, facing the barista; then `there()`. */
  fetch(there: () => void) {
    const n0 = this.nav[0]!.at;
    // up to the counter's front edge (from the walkway point, toward the barista's side)
    const up = n0.clone().add(new THREE.Vector3(-0.06, 0, 0.42));
    this.goVia(0, up);
    this.a.then(this.a.face(() => 0), { run: () => (there(), true) });
  }

  /** Where his hand meets an order handed to him over the counter: half way between him and the giver, chest-high. */
  meetAtCounter(giver?: THREE.Vector3) {
    const p = this.a.position;
    if (!giver) return p.clone().add(new THREE.Vector3(0.04, 1.16, 0.5));
    return p.clone().lerp(giver, 0.5).setY(p.y + 1.16);
  }

  /** Takes an order waiting on the counter in front of him (his hand reaches it, then it is held). */
  pick(prop: THREE.Object3D, kind: Kind) {
    this.a.then(...this.a.take('R', prop, kind, 0.25));
  }

  /** His hand taking an order held out to him at `at` (called each frame): true once it is in his hand. */
  receive(prop: THREE.Object3D, kind: Kind, at: THREE.Vector3) {
    this.a.ch.reach.R = { at, quat: this.a.ch.handFacing('R', kind === 'coffee' ? 'cup' : 'cookie', this.a.yaw), socket: HOLD[kind].socket, weight: 1 };
    this.a.ch.lean = this.a.leanFor('R', at);
    this.a.ch.hand.R = 'relaxed';
    if (!this.a.ch.touches('R', at, CONTACT * 1.6, HOLD[kind].socket)) return false;
    this.a.held.R = { prop, kind, settle: 0, fromQ: prop.getWorldQuaternion(new THREE.Quaternion()) };
    this.a.ch.reach.R = null;
    this.a.ch.lean = 0;
    return true;
  }

  /**
   * Brings the order to the seat: he steps up close to the visitor and holds it out to where their hand will meet it
   * (`meet()`); `taken(prop, at)` is their hand taking it. Not taken (they left), it goes on their table (`spot`).
   */
  bring(spot: SeatSpot, meet: () => THREE.Vector3 | null, taken: (prop: THREE.Object3D, at: THREE.Vector3) => boolean, table: () => THREE.Vector3, done: (prop: THREE.Object3D | null) => void) {
    // closer than where he took the order: about 0.65 m from the seat, on the same side
    const dir = spot.stand.clone().sub(spot.seat).setY(0).normalize();
    const close = spot.seat.clone().setY(spot.stand.y).addScaledVector(dir, 0.65);
    this.goVia(spot.nav, spot.stand);
    this.a.then(...this.a.walkTo(() => close, 0.5), this.a.face(() => yawTo(close, spot.seat)));
    let given: THREE.Object3D | null = null;
    this.a.then(
      ...this.a.handOver(
        'R',
        meet,
        (prop, at) => {
          const ok = taken(prop, at);
          if (ok) given = prop;
          return ok;
        },
        table,
        (prop) => {
          given = null;
          done(prop);
        },
      ),
      ...this.a.walkTo(() => spot.stand, 0.5),
      {
        run: () => {
          if (given) done(null);
          this.resume();
          return true;
        },
      },
    );
  }

  /** Back to his round (along the walkways to the next table). */
  resume() {
    this.serving = false;
    this.a.clear();
    this.a.ch.reach.L = this.a.ch.reach.R = null;
    const stop = this.stops[this.next]!;
    let near = 0;
    this.nav.forEach((p, i) => {
      if (p && p.at.distanceTo(stop.at) < this.nav[near]!.at.distanceTo(stop.at)) near = i;
    });
    for (const p of this.route(near)) this.a.then(...this.a.walkTo(() => p, WALK));
  }

  /** The world position of his face (a seated visitor looks up at him). */
  facePosition() {
    return this.a.ch.bone('head').getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.1, 0));
  }

  update(dt: number, viewer: THREE.Vector3, seen: (at: THREE.Vector3) => boolean = () => true): boolean {
    this.viewer.copy(viewer);
    if (!this.a.busy && !this.serving) this.roundOn();
    const a = this.a;
    if (a.held.R) a.carry('R');
    const here = a.position;
    const far = Math.hypot(viewer.x - here.x, viewer.z - here.z);
    if (!this.wiping) a.ch.look(far < 4 ? viewer : null);
    a.ch.smile = far < 3 ? 0.8 : 0.5;
    a.update(dt);
    if (far > 12 || !seen(here)) return this.serving;
    return true;
  }
}

function yawTo(from: THREE.Vector3, to: THREE.Vector3) {
  return Math.atan2(to.x - from.x, to.z - from.z);
}

/** A hand flat, palm down, the fingers ahead (for wiping, or resting on a table), for the way he faces. */
function palmDown(side: 'L' | 'R', yaw: number) {
  const sx = side === 'L' ? 1 : -1;
  // body frame: fingers (−Y) ahead, palm face (−sx·X) down: X = sx·up, Y = −ahead, Z = X × Y
  const x = new THREE.Vector3(0, sx, 0);
  const y = new THREE.Vector3(0, 0, -1);
  const z = new THREE.Vector3().crossVectors(x, y);
  const q = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z));
  return new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw).multiply(q);
}
