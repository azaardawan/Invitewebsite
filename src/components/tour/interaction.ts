/**
 * What the tours' staff do with their hands and feet (owner, 2026-11-24, the npc-interaction-animation skill),
 * reusable by every member of staff: walking somewhere (turning first, the feet in step with the distance), taking
 * something (the hand reaches it, the fingers close: only then is it held), putting it down (on the surface, its base
 * touching it), carrying it, and handing it over (held out; it changes hands once the receiver's hand is on it).
 *
 * Each is a step of a script, run one after another; a step ends on its condition (a contact, an arrival), with a
 * time limit so nothing waits for ever. A held thing stays in the world and follows its hand's socket each frame
 * (never parented to a bone): changing hands keeps it exactly where it is.
 */
import * as THREE from 'three';
import { Character, type Side } from './character';
import { approach } from './ik';

/**
 * What a hand holds: a drink in its cup (`coffee`, any drink), a cookie, the barista's tools (a syrup `bottle` or a jar,
 * the milk `pitcher`, the blender's `jug`, the ice `scoop`) and money (`cash`).
 */
export type Kind = 'coffee' | 'cookie' | 'bottle' | 'pitcher' | 'jug' | 'scoop' | 'cash';
/** Where a thing is held, in its own space (its origin: a cup's base, a cookie's middle), and how. */
export const HOLD: Record<Kind, { socket: 'grip' | 'pinch'; at: THREE.Vector3; hand: 'grip' | 'pinch' }> = {
  coffee: { socket: 'grip', at: new THREE.Vector3(0, 0.042, 0), hand: 'grip' },
  cookie: { socket: 'pinch', at: new THREE.Vector3(0, -0.03, 0), hand: 'pinch' },
  bottle: { socket: 'grip', at: new THREE.Vector3(0, 0.09, 0), hand: 'grip' },
  pitcher: { socket: 'grip', at: new THREE.Vector3(0, 0.05, 0), hand: 'grip' },
  jug: { socket: 'grip', at: new THREE.Vector3(0, 0.1, 0), hand: 'grip' },
  scoop: { socket: 'grip', at: new THREE.Vector3(0, 0, 0), hand: 'grip' },
  cash: { socket: 'pinch', at: new THREE.Vector3(0, 0.03, 0), hand: 'pinch' },
};
/** Where this thing is held (its own space): what it says (`userData.hold`: cups differ in size), or its kind's. */
export function holdAt(prop: THREE.Object3D, kind: Kind): THREE.Vector3 {
  const h = (prop.userData as { hold?: THREE.Vector3 }).hold;
  return (h ?? HOLD[kind].at).clone();
}
/** How the hand turns round it: like a cup (the palm round it) or a cookie (between thumb and fingers). */
export const handKind = (k: Kind): 'cup' | 'cookie' => (k === 'cookie' || k === 'cash' ? 'cookie' : 'cup');

/** How close a hand must be to where it reaches to count as touching (metres). */
export const CONTACT = 0.025;

/** Someone paying as they are given their order: where his hand meets their money, and their hand letting it go. */
export type Pay = { meet: () => THREE.Vector3 | null; given: (at: THREE.Vector3) => THREE.Object3D | null; paid?: (cash: THREE.Object3D) => void };

export type Step = { start?: () => void; run: (dt: number, t: number) => boolean; end?: () => void; limit?: number };

/**
 * Every contact made (opt-in debugging, `?debug=1` on a tour's link): what, by whom, and how far the hand's socket was
 * from where it reached at that moment (metres): the measured contact error.
 */
export const CONTACTS: { what: string; who: string; error: number; at: number }[] = [];
export function logContact(what: string, who: string, error: number) {
  CONTACTS.push({ what, who, error: Math.round(error * 10000) / 10000, at: Math.round(performance.now()) });
  if (CONTACTS.length > 50) CONTACTS.shift();
}

/** A member of staff: his person (bones), where he stands and faces, and what he holds in each hand. */
export class Actor {
  readonly ch: Character;
  private steps: Step[] = [];
  private step: Step | null = null;
  private t = 0;
  yaw: number;
  /** Things held, following their sockets. */
  held: Record<Side, { prop: THREE.Object3D; kind: Kind; settle?: number; fromQ?: THREE.Quaternion; tilt?: number } | null> = { L: null, R: null };
  private v = new THREE.Vector3();
  /**
   * Where he stands to work at a point (behind a counter: on his line along it, facing it), and the corners he goes
   * round on the way; null: just within reach of it.
   */
  standFor?: (p: THREE.Vector3) => { at: THREE.Vector3; yaw: number } | null;
  viaFor?: (from: THREE.Vector3, to: THREE.Vector3) => THREE.Vector3[];

  constructor(ch: Character) {
    this.ch = ch;
    this.yaw = ch.yaw();
  }

  get busy() {
    return !!this.step || this.steps.length > 0;
  }
  get position() {
    return this.ch.root.getWorldPosition(new THREE.Vector3());
  }
  then(...s: Step[]) {
    this.steps.push(...s);
  }
  /** Drops what is planned (what he holds stays held). */
  clear() {
    this.steps = [];
    this.step?.end?.();
    this.step = null;
  }

  /** Runs the current step; poses the person; keeps held things in hand. */
  private lastDt = 0;
  update(dt: number) {
    this.lastDt = dt;
    if (!this.step && this.steps.length) {
      this.step = this.steps.shift()!;
      this.t = 0;
      this.step.start?.();
    }
    if (this.step) {
      this.t += dt;
      const s = this.step;
      const done = s.run(dt, this.t) || (s.limit !== undefined && this.t >= s.limit);
      if (done) {
        this.step = null;
        s.end?.();
      }
    }
    this.ch.root.rotation.set(0, this.yaw, 0);
    // the fingers close on what each hand holds
    for (const side of ['L', 'R'] as Side[]) {
      const h = this.held[side];
      if (h) this.ch.hand[side] = HOLD[h.kind].hand;
    }
    this.ch.update(dt);
    this.follow();
  }

  /** Each held thing to its hand: its holding point on the socket, upright (a cup) or facing ahead (a cookie). */
  follow() {
    for (const side of ['L', 'R'] as Side[]) {
      const h = this.held[side];
      if (!h) continue;
      const hold = HOLD[h.kind];
      const at = this.ch.socket(side, hold.socket).getWorldPosition(this.v);
      const q = this.tipped(h.tilt ?? 0);
      // just taken: it turns into the hand's hold over a moment (no snap)
      if (h.fromQ && (h.settle ?? 1) < 1) {
        h.settle = Math.min(1, (h.settle ?? 0) + this.lastDt / 0.25);
        q.copy(h.fromQ).slerp(q, h.settle * h.settle * (3 - 2 * h.settle));
      }
      h.prop.quaternion.copy(q);
      h.prop.position.copy(at).sub(holdAt(h.prop, h.kind).applyQuaternion(q));
      h.prop.updateMatrixWorld(true);
    }
  }

  /** Where a thing's holding point is, in the world (where a hand reaches to take it). */
  static holdPoint(prop: THREE.Object3D, kind: Kind) {
    return holdAt(prop, kind).applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion())).add(prop.getWorldPosition(new THREE.Vector3()));
  }

  /** The way he faces, tipped forward by `tilt` (radians: a bottle pouring, its top toward what he faces). */
  tipped(tilt: number) {
    const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    if (tilt) q.multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt));
    return q;
  }
  /** His hand's turn holding a thing of this kind, tipped with it. */
  holdQuat(side: Side, kind: Kind, tilt = 0) {
    const base = this.ch.handFacing(side, handKind(kind), this.yaw);
    if (!tilt) return base;
    const yawQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
    const tip = yawQ.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), tilt)).multiply(yawQ.invert());
    return tip.multiply(base);
  }

  private setPos(p: THREE.Vector3) {
    const parent = this.ch.root.parent;
    this.ch.root.position.copy(parent ? parent.worldToLocal(p.clone()) : p);
  }

  // ---------- steps ----------

  /** Turns to face `yaw` (stepping round on the spot). */
  face(yaw: () => number): Step {
    return {
      limit: 3,
      run: (dt) => {
        const want = yaw();
        let d = (want - this.yaw) % (Math.PI * 2);
        if (d > Math.PI) d -= Math.PI * 2;
        if (d < -Math.PI) d += Math.PI * 2;
        const stepA = 3.2 * dt;
        const turn = Math.abs(d) <= stepA ? d : Math.sign(d) * stepA;
        this.yaw += turn;
        this.ch.turnSteps(turn);
        return Math.abs(d) <= stepA;
      },
    };
  }

  /** Walks to `to` (world, on the floor): `walkPath` with one point. */
  walkTo(to: () => THREE.Vector3, speed = 1.0, wait: () => boolean = () => false): Step[] {
    return this.walkPath(() => [to()], speed, wait);
  }

  /**
   * Walks along `points` (world, on the floor) without stopping at each: he turns as he goes, rounding the corners a
   * little (looking ahead `LOOK` metres), slowing for a sharp turn and easing to a stop at the last point; the legs in
   * step with the distance. A way that starts well behind him: he turns round on the spot first. `wait()` stops him
   * (someone in his way) while true.
   */
  walkPath(points: () => THREE.Vector3[], speed = 1.2, wait: () => boolean = () => false): Step[] {
    let v = 0;
    let i = 0;
    let pts: THREE.Vector3[] = [];
    const LOOK = 0.45;
    const flat = (a: THREE.Vector3, b: THREE.Vector3) => Math.hypot(b.x - a.x, b.z - a.z);
    return [
      {
        start: () => {
          pts = points().map((p) => p.clone());
          i = 0;
          // already past the first point (it lies behind, the second nearer): from the second
          const p = this.position;
          if (pts.length > 1 && flat(p, pts[1]!) < flat(pts[0]!, pts[1]!)) i = 1;
        },
        run: () => true,
      },
      this.face(() => {
        const p = this.position,
          q = pts[i] ?? p;
        if (flat(p, q) < 0.05) return this.yaw;
        const want = Math.atan2(q.x - p.x, q.z - p.z);
        return Math.abs(angleBetween(this.yaw, want)) > 1.75 ? want : this.yaw;
      }),
      {
        limit: 60,
        run: (dt) => {
          if (!pts.length) return true;
          const p = this.position;
          while (i < pts.length - 1 && flat(p, pts[i]!) < LOOK) i++;
          const q = pts[i]!;
          const lastLeg = i === pts.length - 1;
          const dx = q.x - p.x,
            dz = q.z - p.z;
          const d = Math.hypot(dx, dz);
          let rem = d;
          for (let k = i; k < pts.length - 1; k++) rem += flat(pts[k]!, pts[k + 1]!);
          const err = d > 1e-4 ? angleBetween(this.yaw, Math.atan2(dx, dz)) : 0;
          // his pace: slower while turning sharply, easing to a stop at the end (about 1.4 m/s² of braking)
          let want = wait() ? 0 : speed * THREE.MathUtils.clamp(Math.cos(err) * 1.15, 0.3, 1);
          want = Math.min(want, Math.max(0.12, Math.sqrt(2 * 1.4 * rem)));
          v = approach(v, want, dt, 0.16);
          // he turns as he walks (quicker when slow)
          const rate = (2.4 + 1.2 / (v + 0.4)) * dt;
          const turn = THREE.MathUtils.clamp(err, -rate, rate);
          this.yaw += turn;
          const step = Math.min(v * dt, rem);
          if (d > 1e-4) {
            // along the way he faces; the last bit straight to the spot (no circling round it)
            const straight = lastLeg && d < 0.35;
            const ux = straight ? dx / d : Math.sin(this.yaw),
              uz = straight ? dz / d : Math.cos(this.yaw);
            const k = Math.min(1, step / d);
            this.setPos(new THREE.Vector3(p.x + ux * step, p.y + (q.y - p.y) * k, p.z + uz * step));
          }
          this.ch.walk(step / Math.max(dt, 1e-4), dt);
          if (!step && Math.abs(turn) > 1e-4) this.ch.turnSteps(turn);
          if (lastLeg && d - step < 0.012) {
            this.setPos(q.clone());
            return true;
          }
          return false;
        },
      },
    ];
  }

  /** Reaches a hand's socket to a point (world) and holds it there for `hold` seconds (or until `until()`). */
  reach(side: Side, at: () => THREE.Vector3, opts: { quat?: () => THREE.Quaternion; socket?: 'grip' | 'pinch'; lean?: number; until?: () => boolean; limit?: number } = {}): Step {
    return {
      limit: opts.limit ?? 2.5,
      start: () => {
        this.ch.lean = opts.lean ?? 0;
      },
      run: () => {
        this.ch.reach[side] = { at: at(), quat: opts.quat?.(), socket: opts.socket, weight: 1 };
        this.ch.lean = (opts.lean ?? 0) + this.leanFor(side, at());
        const arrived = this.ch.touches(side, at(), CONTACT, opts.socket);
        return opts.until ? arrived && opts.until() : arrived;
      },
    };
  }

  /**
   * Bending at the waist only as much as the reach needs (the arm alone reaches about half a metre): measured from
   * where his shoulder is standing straight (not from where the bend has taken it, or he would never bend far enough).
   */
  leanFor(_side: Side, at: THREE.Vector3) {
    const r = this.position;
    const h = Math.hypot(at.x - r.x, at.z - r.z);
    const v = Math.max(0, r.y + 1.42 - at.y);
    return THREE.MathUtils.clamp((Math.hypot(h, v) - 0.45) * 1.6, 0, 0.75);
  }

  /**
   * Steps up to within reach of a point (world) before reaching it: if it is further than `within` metres (across the
   * floor) from him, he walks toward it until it is that far, then faces it. Nothing to do when already near.
   */
  approach(point: () => THREE.Vector3, within = 0.42): Step[] {
    let work: { at: THREE.Vector3; yaw: number } | null = null;
    const stand = () => {
      const p = this.position,
        q = point();
      work = this.standFor?.(q) ?? null;
      if (work) return Math.hypot(work.at.x - p.x, work.at.z - p.z) < 0.06 ? p : work.at;
      const d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d <= within + 0.08) return p;
      const k = (d - within) / d;
      return new THREE.Vector3(p.x + (q.x - p.x) * k, p.y, p.z + (q.z - p.z) * k);
    };
    let to: THREE.Vector3 | null = null;
    return [
      { start: () => (to = stand()), run: () => true },
      ...this.walkPath(() => {
        const t = to ?? this.position;
        return [...(this.viaFor?.(this.position, t) ?? []), t];
      }, 0.8),
      this.face(() => {
        if (work) return work.yaw;
        const p = this.position,
          q = point();
        return Math.atan2(q.x - p.x, q.z - p.z);
      }),
    ];
  }

  /**
   * Pours from what `side` holds (a bottle, the pitcher, the jug, the scoop) into a cup: he steps up to it, tips it
   * over the rim (`rim()`, world; the thing's mouth, `userData.mouth`, just above it), holds it there `time` seconds
   * (`flow(k)`: k 0…1 of the pour) and sets it upright again.
   */
  pour(side: Side, rim: () => THREE.Vector3, time: number, flow: (k: number, mouth: THREE.Vector3) => void, angle?: number): Step[] {
    let tilt = 0;
    const TIP: Record<string, number> = { bottle: 2.0, pitcher: 1.2, jug: 1.55, scoop: 1.5 };
    const tip = () => angle ?? TIP[this.held[side]?.kind ?? 'bottle'] ?? 1.6;
    const mouthOf = (h: NonNullable<Actor['held']['L']>) => {
      const m = (h.prop.userData as { mouth?: number[] | THREE.Vector3 }).mouth;
      return m instanceof THREE.Vector3 ? m.clone() : m ? new THREE.Vector3(...m) : new THREE.Vector3(0, 0.2, 0);
    };
    const target = () => {
      const h = this.held[side];
      if (!h) return rim();
      const mouth = mouthOf(h).sub(holdAt(h.prop, h.kind));
      return rim().add(new THREE.Vector3(0, 0.03, 0)).sub(mouth.applyQuaternion(this.tipped(tilt)));
    };
    const arm = () => {
      const h = this.held[side];
      if (!h) return;
      h.tilt = tilt;
      const at = target();
      this.ch.reach[side] = { at, quat: this.holdQuat(side, h.kind, tilt), socket: HOLD[h.kind].socket, weight: 1 };
      this.ch.lean = this.leanFor(side, at);
    };
    const mouthWorld = () => {
      const h = this.held[side];
      return h ? h.prop.localToWorld(mouthOf(h)) : rim();
    };
    return [
      ...this.approach(rim, 0.36),
      {
        limit: 2.4,
        run: (dt) => {
          tilt = approach(tilt, tip(), dt, 0.12);
          arm();
          const h = this.held[side];
          return Math.abs(tilt - tip()) < 0.06 && (!h || this.ch.touches(side, target(), CONTACT * 1.6, HOLD[h.kind].socket));
        },
      },
      {
        limit: time + 0.6,
        run: (_dt, t) => {
          arm();
          flow(Math.min(1, t / time), mouthWorld());
          return t >= time;
        },
      },
      {
        limit: 1.2,
        run: (dt) => {
          tilt = approach(tilt, 0, dt, 0.09);
          if (tilt < 0.03) tilt = 0;
          arm();
          return tilt === 0;
        },
      },
    ];
  }

  /** Steps done only if `cond()` holds when they begin (else each is passed over at once). */
  static onlyIf(cond: () => boolean, steps: Step[]): Step[] {
    let go = true;
    return steps.map((st, i) => ({
      limit: st.limit,
      start: () => {
        if (i === 0) go = cond();
        if (go) st.start?.();
      },
      run: (dt, t) => (go ? st.run(dt, t) : true),
      end: () => {
        if (go) st.end?.();
      },
    }));
  }

  /** Puts what `side` holds away (a pocket, a drawer): the hand goes to `at`; there it is gone (`gone(prop)`). */
  putAway(side: Side, at: () => THREE.Vector3, gone: (prop: THREE.Object3D) => void): Step[] {
    return [
      this.reach(side, at, { socket: 'pinch', quat: () => this.holdQuat(side, 'cash'), limit: 2 }),
      {
        run: () => {
          const h = this.held[side];
          if (h) {
            logContact(`put away ${h.kind}`, this.ch.root.name, this.ch.socket(side, 'pinch').getWorldPosition(new THREE.Vector3()).distanceTo(at()));
            this.held[side] = null;
            gone(h.prop);
          }
          this.ch.hand[side] = 'relaxed';
          return true;
        },
      },
      this.release(side),
    ];
  }

  /** Lets an arm go back down (and the waist straighten). */
  release(side: Side): Step {
    return {
      limit: 0.35,
      start: () => {
        this.ch.reach[side] = null;
        this.ch.lean = 0;
      },
      run: (_dt, t) => t > 0.3,
    };
  }

  /** Takes a thing: the hand reaches its holding point, the fingers close; from then on it is in that hand. */
  take(side: Side, prop: THREE.Object3D, kind: Kind, lean = 0.15): Step[] {
    const hold = HOLD[kind];
    return [
      ...this.approach(() => Actor.holdPoint(prop, kind)),
      { start: () => (this.ch.hand[side] = 'relaxed'), run: () => true },
      this.reach(side, () => Actor.holdPoint(prop, kind), { socket: hold.socket, quat: () => this.holdQuat(side, kind), lean }),
      {
        run: () => {
          logContact(`take ${kind}`, this.ch.root.name, this.ch.socket(side, hold.socket).getWorldPosition(new THREE.Vector3()).distanceTo(Actor.holdPoint(prop, kind)));
          this.held[side] = { prop, kind, settle: 0, fromQ: prop.getWorldQuaternion(new THREE.Quaternion()) };
          return true;
        },
      },
      // a moment for the fingers to close before lifting
      { run: (_dt, t) => t > 0.18 },
    ];
  }

  /** Puts a held thing down with its base on `spot` (a surface point, world); then the hand lets go. */
  place(side: Side, spot: () => THREE.Vector3, lean = 0.2, placed?: (prop: THREE.Object3D) => void): Step[] {
    let prop: THREE.Object3D | null = null;
    let kind: Kind = 'coffee';
    return [
      ...this.approach(spot),
      {
        start: () => {
          prop = this.held[side]?.prop ?? null;
          kind = this.held[side]?.kind ?? 'coffee';
        },
        run: () => true,
      },
      this.reach(side, () => (kind === 'cookie' ? new THREE.Vector3(0, 0.04, 0) : prop ? holdAt(prop, kind) : HOLD[kind].at.clone()).add(spot()), {
        socket: HOLD[kind].socket,
        quat: () => this.holdQuat(side, kind),
        lean,
      }),
      {
        run: () => {
          // let go: it stands where it is, its base on the surface
          if (prop) logContact(`place ${kind}`, this.ch.root.name, Actor.holdPoint(prop, kind).distanceTo(holdAt(prop, kind).add(spot())));
          this.held[side] = null;
          if (prop) {
            const p = spot();
            if (kind === 'cookie') {
              // a cookie lies flat (its middle a half-thickness above the surface)
              prop.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0, 'YXZ')).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw));
              p.y += 0.0075;
            }
            else prop.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
            prop.position.copy(p);
            prop.updateMatrixWorld(true);
            placed?.(prop);
          }
          this.ch.hand[side] = 'relaxed';
          return true;
        },
      },
      { run: (_dt, t) => t > 0.15 },
      this.release(side),
    ];
  }

  /**
   * Holds a thing out to someone: the hand goes to where they will meet it (`meet()`), and stays until their hand
   * has it (`taken(prop, at)` returns true: it is theirs then, exactly where it is); then the arm comes back.
   * Without anyone to meet it (`meet()` null, or nobody comes in `patience` s) it is put down at `spot` instead.
   */
  handOver(
    side: Side,
    meet: () => THREE.Vector3 | null,
    taken: (prop: THREE.Object3D, at: THREE.Vector3) => boolean,
    spot: () => THREE.Vector3,
    placed: (prop: THREE.Object3D) => void,
    patience = 8,
    pay?: Pay,
  ): Step[] {
    let gaveUp = false;
    let gone = false;
    const holding = () => this.held[side];
    const other: Side = side === 'L' ? 'R' : 'L';
    return [
      // the money first, if they pay: his other hand held out, the notes put in it
      ...(pay ? this.takeMoney(other, pay, patience) : []),
      {
        limit: patience,
        start: () => {
          gaveUp = !meet();
        },
        run: () => {
          const h = holding();
          const at = meet();
          if (!h || !at || gaveUp) {
            gaveUp = true;
            return true;
          }
          const hold = HOLD[h.kind];
          this.ch.reach[side] = { at, quat: this.holdQuat(side, h.kind), socket: hold.socket, weight: 1 };
          this.ch.lean = 0.05 + this.leanFor(side, at);
          // held out (his hand there): the receiver's hand may take it
          if (this.ch.touches(side, at, CONTACT * 2, hold.socket) && taken(h.prop, at)) {
            logContact(`hand over ${h.kind}`, this.ch.root.name, this.ch.socket(side, hold.socket).getWorldPosition(new THREE.Vector3()).distanceTo(at));
            this.held[side] = null;
            this.ch.hand[side] = 'relaxed';
            gone = true;
            return true;
          }
          return false;
        },
        end: () => {
          if (!gone) gaveUp = true;
        },
      },
      // nobody took it: on the counter (or table) it goes
      {
        start: () => {
          if (!gaveUp) return;
          this.steps.unshift(...this.place(side, spot, 0.2, placed));
        },
        run: () => true,
      },
      this.release(side),
    ];
  }

  /**
   * Takes money held out to him: his hand out (between him and them, `pay.meet()`), until their notes are in it
   * (`pay.given(at)` returns them once they touch his fingers' tips: then they are his, where they are).
   */
  takeMoney(side: Side, pay: Pay, patience = 8): Step[] {
    return [
      {
        limit: patience,
        run: () => {
          const at = pay.meet();
          if (!at) return true;
          this.ch.reach[side] = { at, quat: this.holdQuat(side, 'cash'), socket: 'pinch', weight: 1 };
          this.ch.hand[side] = 'relaxed';
          if (!this.ch.touches(side, at, CONTACT * 2, 'pinch')) return false;
          const cash = pay.given(this.ch.socket(side, 'pinch').getWorldPosition(new THREE.Vector3()));
          if (!cash) return false;
          logContact('take cash', this.ch.root.name, this.ch.socket(side, 'pinch').getWorldPosition(new THREE.Vector3()).distanceTo(at));
          this.held[side] = { prop: cash, kind: 'cash', settle: 0, fromQ: cash.getWorldQuaternion(new THREE.Quaternion()) };
          pay.paid?.(cash);
          return true;
        },
      },
      // the hand with the money comes back to his side
      {
        limit: 0.4,
        start: () => (this.ch.reach[side] = null),
        run: (_d, t) => t > 0.3,
      },
    ];
  }

  /** Holds a thing in front of him to carry it (the forearm up, the hand at the waist's height, a little out). */
  carry(side: Side): void {
    const h = this.held[side];
    if (!h) {
      this.ch.reach[side] = null;
      return;
    }
    const sx = side === 'L' ? 1 : -1;
    const local = new THREE.Vector3(sx * 0.14, 1.03, 0.3);
    const at = this.ch.root.localToWorld(local);
    this.ch.reach[side] = { at, quat: this.holdQuat(side, h.kind), socket: HOLD[h.kind].socket, weight: 0.85 };
  }
}

function angleBetween(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
