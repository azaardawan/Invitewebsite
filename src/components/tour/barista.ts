/**
 * A tour's barista (owner, 2026-11-23; rebuilt 2026-11-24 with the character and NPC interaction skills): a person of
 * the model (`BARISTA`, skeleton as in character.ts) behind the counter, and his places, named nodes:
 * `BARISTA_coffee` (where he stands at the machine), `BARISTA_cups` (the top of the stack of clean cups),
 * `BARISTA_fill` (where he sets a cup to fill it), `BARISTA_steam` (the machine's steam), `BARISTA_cookies` (where he
 * stands at the cookie pile) and `BARISTA_pile` (its top), `BARISTA_handout` (on the counter, where an order waits
 * for a visitor standing back).
 *
 * A coffee: he walks to the machine, takes a cup from the stack (his hand on it, then it is held), sets it down to
 * fill, works the machine (steam) while it fills, takes it again, carries it back upright, steps up to the counter and
 * holds it out: it changes hands once the receiver's hand is on it (a visitor's, or the waiter's); nobody near, he
 * puts it down on the counter for them. A cookie: the same from the pile, held by its edge.
 */
import * as THREE from 'three';
import { Character } from './character';
import { Actor, type Kind } from './interaction';

type Place = { at: THREE.Vector3; yaw: number };
/** Whom he hands an order to: where their hand will meet it (null: put it on the counter), and their hand taking it. */
export type Handoff = {
  meet: () => THREE.Vector3 | null;
  taken: (prop: THREE.Object3D, at: THREE.Vector3) => boolean;
  placed: (prop: THREE.Object3D) => void;
};

function placeOf(o: THREE.Object3D): Place {
  const at = o.getWorldPosition(new THREE.Vector3());
  const f = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
  return { at, yaw: Math.atan2(f.x, f.z) };
}

export class Barista {
  private a: Actor;
  private home: Place;
  private p: Partial<Record<'coffee' | 'cookies' | 'cups' | 'fill' | 'steam' | 'handout' | 'pile', Place>> = {};
  private puffs: { m: THREE.Mesh; age: number }[] = [];
  private puffGeo = new THREE.SphereGeometry(0.03, 10, 8);
  private puffMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  private nextPuff = 0;
  private time = 0;
  private steaming = false;

  static find(scene: THREE.Object3D): Barista | null {
    const ch = Character.find(scene, 'BARISTA');
    if (!ch) return null;
    const b = new Barista(ch);
    for (const k of ['coffee', 'cookies', 'cups', 'fill', 'steam', 'handout', 'pile'] as const) {
      const o = scene.getObjectByName(`BARISTA_${k}`);
      if (o) b.p[k] = placeOf(o);
    }
    return b.p.coffee || b.p.cookies ? b : null;
  }

  private constructor(ch: Character) {
    this.a = new Actor(ch);
    this.home = { at: ch.root.getWorldPosition(new THREE.Vector3()), yaw: ch.yaw() };
  }

  /** What he can make (a coffee needs his machine and cups, a cookie his pile). */
  can(kind: Kind) {
    return kind === 'coffee' ? !!(this.p.coffee && this.p.cups && this.p.fill) : !!(this.p.cookies && this.p.pile);
  }
  get busy() {
    return this.a.busy;
  }
  get position() {
    return this.a.position;
  }

  /** Makes a coffee (or fetches a cookie) into `prop`, and hands it over as `to` says. */
  order(kind: Kind, prop: THREE.Object3D, scene: THREE.Object3D, to: Handoff) {
    if (!this.can(kind) || this.busy) return false;
    const a = this.a;
    const P = this.p;
    if (kind === 'coffee') {
      const cups = P.cups!,
        fill = P.fill!,
        at = P.coffee!;
      a.then(
        ...a.walkTo(() => at.at),
        a.face(() => at.yaw),
        {
          // the top cup of the stack (empty)
          run: () => {
            prop.position.copy(cups.at);
            prop.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), at.yaw);
            (prop as THREE.Object3D & { userData: { setLevel?: (f: number) => void } }).userData.setLevel?.(0);
            scene.add(prop);
            prop.updateMatrixWorld(true);
            return true;
          },
        },
        ...a.take('R', prop, 'coffee', 0.15),
        ...a.place('R', () => fill.at, 0.18),
        // both hands on the machine; steam; the cup fills
        {
          limit: 3.2,
          start: () => {
            this.steaming = true;
            a.ch.lean = 0.12;
          },
          run: (_dt, t) => {
            const top = new THREE.Vector3(0, 1.37, 0.36); // the machine's top, at its back (in front of him)
            for (const [side, dx] of [
              ['L', 0.17],
              ['R', -0.12],
            ] as const) {
              const local = top.clone().add(new THREE.Vector3(dx + Math.sin(t * 5 + dx * 9) * 0.015, Math.sin(t * 7 + dx) * 0.01, 0));
              a.ch.reach[side] = { at: a.ch.root.localToWorld(local), weight: 0.9 };
              a.ch.hand[side] = 'relaxed';
            }
            (prop as THREE.Object3D & { userData: { setLevel?: (f: number) => void } }).userData.setLevel?.(Math.min(1, t / 2.8));
            return t >= 3.1;
          },
          end: () => {
            this.steaming = false;
            a.ch.reach.L = null;
            a.ch.reach.R = null;
            a.ch.lean = 0;
          },
        },
        { run: (_d, t) => t > 0.3 },
        ...a.take('R', prop, 'coffee', 0.18),
      );
    } else {
      const pile = P.pile!,
        at = P.cookies!;
      a.then(
        ...a.walkTo(() => at.at),
        a.face(() => at.yaw),
        {
          // the cookie lying on top of the pile
          run: () => {
            prop.position.copy(pile.at);
            prop.quaternion.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, at.yaw, 'YXZ'));
            scene.add(prop);
            prop.updateMatrixWorld(true);
            return true;
          },
        },
        ...a.take('R', prop, 'cookie', 0.3),
      );
    }
    // back to the counter, up to its edge, and holding it out
    const serve = (): THREE.Vector3 => this.home.at.clone().add(new THREE.Vector3(Math.sin(this.home.yaw), 0, Math.cos(this.home.yaw)).multiplyScalar(0.17));
    a.then(
      ...a.walkTo(serve),
      a.face(() => this.home.yaw),
      ...a.handOver('R', to.meet, to.taken, () => P.handout!.at, to.placed),
      ...a.walkTo(() => this.home.at),
      a.face(() => this.home.yaw),
    );
    return true;
  }

  /** His person (for the debug view). */
  get character() {
    return this.a.ch;
  }

  /** Where an order waits on the counter for a visitor standing back (world, on the counter's top). */
  get handout() {
    return this.p.handout?.at ?? null;
  }

  /**
   * Moves him on by `dt` (`viewer`: the visitor's eye). Returns whether he must be drawn again (busy or seen nearby).
   */
  update(dt: number, viewer: THREE.Vector3, seen: (at: THREE.Vector3) => boolean = () => true): boolean {
    this.time += dt;
    const a = this.a;
    // carrying: the hand in front of him, the cup upright (each frame, unless a step reaches elsewhere)
    if (a.held.R && !this.steaming) a.carry('R');
    const here = a.position;
    const far = Math.hypot(viewer.x - here.x, viewer.z - here.z);
    // he looks at a visitor near him, unless busy at the machine or the pile
    a.ch.look(far < 4.5 && !this.steaming ? viewer : null);
    a.ch.brows = far < 2.5 ? 0.6 : 0;
    a.update(dt);
    this.steam(dt);
    const active = a.busy || this.puffs.length > 0;
    return active || (far < 10 && seen(here));
  }

  private steam(dt: number) {
    const at = this.p.steam?.at;
    if (this.steaming && at && this.time > this.nextPuff) {
      this.nextPuff = this.time + 0.12;
      const m = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
      m.position.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.08));
      this.a.ch.root.parent!.add(m);
      this.puffs.push({ m, age: 0 });
    }
    for (const p of this.puffs) {
      p.age += dt;
      p.m.position.y += dt * 0.22;
      p.m.scale.setScalar(1 + p.age * 1.6);
      (p.m.material as THREE.MeshBasicMaterial).opacity = Math.max(0, 0.45 * (1 - p.age / 1.3));
    }
    for (const p of this.puffs.filter((x) => x.age > 1.3)) {
      p.m.removeFromParent();
      (p.m.material as THREE.Material).dispose();
    }
    this.puffs = this.puffs.filter((x) => x.age <= 1.3);
  }

  dispose() {
    for (const p of this.puffs) p.m.removeFromParent();
    this.puffGeo.dispose();
    this.puffMat.dispose();
  }
}
