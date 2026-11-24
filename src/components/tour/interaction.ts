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

export type Kind = 'coffee' | 'cookie';
/** Where a thing is held, in its own space (its origin: a cup's base, a cookie's middle), and how. */
export const HOLD: Record<Kind, { socket: 'grip' | 'pinch'; at: THREE.Vector3; hand: 'grip' | 'pinch' }> = {
  coffee: { socket: 'grip', at: new THREE.Vector3(0, 0.042, 0), hand: 'grip' },
  cookie: { socket: 'pinch', at: new THREE.Vector3(0, -0.03, 0), hand: 'pinch' },
};
/** How close a hand must be to where it reaches to count as touching (metres). */
export const CONTACT = 0.025;

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
  held: Record<Side, { prop: THREE.Object3D; kind: Kind; settle?: number; fromQ?: THREE.Quaternion } | null> = { L: null, R: null };
  private v = new THREE.Vector3();

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
      const q = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw);
      // just taken: it turns into the hand's hold over a moment (no snap)
      if (h.fromQ && (h.settle ?? 1) < 1) {
        h.settle = Math.min(1, (h.settle ?? 0) + this.lastDt / 0.25);
        q.copy(h.fromQ).slerp(q, h.settle * h.settle * (3 - 2 * h.settle));
      }
      h.prop.quaternion.copy(q);
      h.prop.position.copy(at).sub(hold.at.clone().applyQuaternion(q));
      h.prop.updateMatrixWorld(true);
    }
  }

  /** Where a thing's holding point is, in the world (where a hand reaches to take it). */
  static holdPoint(prop: THREE.Object3D, kind: Kind) {
    return HOLD[kind].at.clone().applyQuaternion(prop.getWorldQuaternion(new THREE.Quaternion())).add(prop.getWorldPosition(new THREE.Vector3()));
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

  /**
   * Walks to `to` (world, on the floor), easing in and out, the legs in step with the distance; `wait()` stops him
   * (someone in his way) while true. Turns to face the way first.
   */
  walkTo(to: () => THREE.Vector3, speed = 0.8, wait: () => boolean = () => false): Step[] {
    let v = 0;
    return [
      this.face(() => {
        const p = this.position,
          q = to();
        return Math.hypot(q.x - p.x, q.z - p.z) > 0.03 ? Math.atan2(q.x - p.x, q.z - p.z) : this.yaw;
      }),
      {
        limit: 40,
        run: (dt) => {
          const p = this.position;
          const q = to();
          const dx = q.x - p.x,
            dz = q.z - p.z;
          const d = Math.hypot(dx, dz);
          // slowing down over the last half metre (no sliding stop)
          const want = wait() ? 0 : Math.min(speed, Math.max(0.12, d * 1.6));
          v = approach(v, want, dt, 0.15);
          const stepD = Math.min(d, v * dt);
          if (d > 1e-4) {
            this.yaw = approach(this.yaw, this.yaw + angleBetween(this.yaw, Math.atan2(dx, dz)), dt, 0.08);
            const k = stepD / d;
            this.setPos(new THREE.Vector3(p.x + dx * k, p.y + (q.y - p.y) * k, p.z + dz * k));
          }
          this.ch.walk(stepD / Math.max(dt, 1e-4), dt);
          return d - stepD < 0.01;
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

  /** Bending at the waist only as much as the reach needs (the arm alone reaches about half a metre). */
  leanFor(side: Side, at: THREE.Vector3) {
    const s = this.ch.bone(`arm${side}`).getWorldPosition(this.v);
    const d = s.distanceTo(at);
    return THREE.MathUtils.clamp((d - 0.46) * 1.8, 0, 0.5);
  }

  /**
   * Steps up to within reach of a point (world) before reaching it: if it is further than `within` metres (across the
   * floor) from him, he walks toward it until it is that far, then faces it. Nothing to do when already near.
   */
  approach(point: () => THREE.Vector3, within = 0.42): Step[] {
    const stand = () => {
      const p = this.position,
        q = point();
      const d = Math.hypot(q.x - p.x, q.z - p.z);
      if (d <= within + 0.08) return p;
      const k = (d - within) / d;
      return new THREE.Vector3(p.x + (q.x - p.x) * k, p.y, p.z + (q.z - p.z) * k);
    };
    let to: THREE.Vector3 | null = null;
    return [
      { start: () => (to = stand()), run: () => true },
      ...this.walkTo(() => to ?? this.position, 0.45),
      this.face(() => {
        const p = this.position,
          q = point();
        return Math.atan2(q.x - p.x, q.z - p.z);
      }),
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
      this.reach(side, () => Actor.holdPoint(prop, kind), { socket: hold.socket, quat: () => this.ch.handFacing(side, kind === 'coffee' ? 'cup' : 'cookie', this.yaw), lean }),
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
      this.reach(side, () => (kind === 'cookie' ? new THREE.Vector3(0, 0.04, 0) : HOLD[kind].at.clone()).add(spot()), {
        socket: HOLD[kind].socket,
        quat: () => this.ch.handFacing(side, kind === 'coffee' ? 'cup' : 'cookie', this.yaw),
        lean,
      }),
      {
        run: () => {
          // let go: it stands where it is, its base on the surface
          if (prop) logContact(`place ${kind}`, this.ch.root.name, Actor.holdPoint(prop, kind).distanceTo(HOLD[kind].at.clone().add(spot())));
          this.held[side] = null;
          if (prop) {
            const p = spot();
            if (kind === 'cookie') {
              // a cookie lies flat (its middle a half-thickness above the surface)
              prop.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0, 'YXZ')).premultiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), this.yaw));
              p.y += 0.0075;
            }
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
  ): Step[] {
    let gaveUp = false;
    let gone = false;
    const holding = () => this.held[side];
    return [
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
          this.ch.reach[side] = { at, quat: this.ch.handFacing(side, h.kind === 'coffee' ? 'cup' : 'cookie', this.yaw), socket: hold.socket, weight: 1 };
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
    this.ch.reach[side] = { at, quat: this.ch.handFacing(side, h.kind === 'coffee' ? 'cup' : 'cookie', this.yaw), socket: HOLD[h.kind].socket, weight: 0.85 };
  }
}

function angleBetween(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}
