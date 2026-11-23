/**
 * What a visitor has in a café's tour (owner, 2026-11-23): the coffee and the cookie the barista hands them, held in
 * their own hands at the bottom of the picture (drawn over the place, never into a wall), a sip or a bite at a time
 * (`SIPS`, `BITES`), put down on the table by their seat and picked up again.
 */
import * as THREE from 'three';
import { Barista } from './barista';
import { Cleaner } from './staff';
import { BITES, SIPS, disposeProp, makeCookie, makeCup, makeHand, type Cookie, type Cup } from './props';

export type Treat = 'coffee' | 'cookie';
type Where = 'barista' | 'flying' | 'hand' | 'table';
type Held = {
  kind: Treat;
  /** Sips (or bites) left. */
  left: number;
  where: Where;
  prop: Cup | Cookie;
  /** In the hand: the hand and the prop (in the picture's own space). */
  holder: THREE.Group;
  side: 1 | -1 | 0;
  /** A sip or a bite under way (0…1). */
  act: number | null;
  acted: boolean;
  /** Finished (empty, eaten): going out of the picture, then gone. */
  done: number | null;
};
type Flight = { obj: THREE.Object3D; from: THREE.Vector3; q0: THREE.Quaternion; to: () => { at: THREE.Vector3; q: THREE.Quaternion }; t: number; dur: number; end: () => void };

/** Where each hand holds things in the picture (camera space), and how it is turned. */
const SLOT = {
  1: { at: new THREE.Vector3(0.2, -0.2, -0.46), rot: new THREE.Euler(0.12, -0.3, 0.04) },
  [-1]: { at: new THREE.Vector3(-0.2, -0.185, -0.46), rot: new THREE.Euler(0.1, 0.32, -0.04) },
} as const;
const MOUTH: Record<Treat, THREE.Vector3> = { coffee: new THREE.Vector3(0.015, -0.085, -0.2), cookie: new THREE.Vector3(0.0, -0.035, -0.17) };
const DOWN = new THREE.Vector3(0, -0.42, 0.05);
const ACT_TIME = 1.25;

const bell = (k: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, k)));

export class Visit {
  readonly barista: Barista | null;
  /** The member of staff going round the place, wiping the tables. */
  private cleaner: Cleaner | null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private hud = new THREE.Scene();
  private hudCam = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
  private items: Record<Treat, Held | null> = { coffee: null, cookie: null };
  private flights: Flight[] = [];
  private crumbs: { m: THREE.Mesh; v: THREE.Vector3; age: number }[] = [];
  private crumbGeo = new THREE.SphereGeometry(0.0035, 6, 4);
  private crumbMat = new THREE.MeshStandardMaterial({ color: '#c68a4c', roughness: 0.9 });
  private bob = 0;
  private making: Treat | null = null;
  private v = new THREE.Vector3();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private sphere = new THREE.Sphere();

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, env: THREE.Texture | null) {
    this.scene = scene;
    this.camera = camera;
    this.barista = Barista.find(scene);
    this.cleaner = Cleaner.find(scene);
    this.hud.environment = env;
    this.hud.environmentIntensity = 0.75;
    this.hud.add(new THREE.HemisphereLight(0xfff6ee, 0x8a8178, 0.5));
    const sun = new THREE.DirectionalLight(0xfff1e2, 0.8);
    sun.position.set(0.4, 1, 0.6);
    this.hud.add(sun);
  }

  /** What the visitor has, for the page's buttons. `near`: where the visitor is (things on a table within reach). */
  state(near: THREE.Vector3) {
    const one = (k: Treat) => {
      const h = this.items[k];
      if (!h || h.done !== null || (h.where !== 'hand' && h.where !== 'table')) return null;
      const reach = h.where === 'table' && Math.hypot(h.prop.position.x - near.x, h.prop.position.z - near.z) < 1.5 && Math.abs(h.prop.position.y - near.y) < 1.6;
      return { left: h.left, where: h.where, reach };
    };
    const busy = this.flights.length > 0 || Object.values(this.items).some((h) => h && h.act !== null);
    return { making: this.making, coffee: one('coffee'), cookie: one('cookie'), busy, serving: !!this.barista };
  }

  /** Whether the barista can be asked for one now (he is free, and the visitor's hand for it is free). */
  canOrder(kind: Treat) {
    const h = this.items[kind];
    return !!this.barista?.can(kind) && !this.barista.busy && !this.making && (!h || h.where === 'table' || h.done !== null);
  }

  order(kind: Treat) {
    if (!this.canOrder(kind) || !this.barista) return false;
    // a fresh one: the old one left on a table is cleared away
    const old = this.items[kind];
    if (old) this.drop(old);
    const prop = kind === 'coffee' ? makeCup() : makeCookie();
    const ok = this.barista.order(kind, prop, (p) => this.handOver(kind, p as Cup | Cookie));
    if (ok) this.making = kind;
    return ok;
  }

  /** He holds it out: it comes to the visitor's hand. */
  private handOver(kind: Treat, prop: Cup | Cookie) {
    this.making = null;
    const h: Held = { kind, left: kind === 'coffee' ? SIPS : BITES, where: 'flying', prop, holder: new THREE.Group(), side: 0, act: null, acted: false, done: null };
    this.items[kind] = h;
    this.fly(prop, () => this.handTarget(h), () => this.toHand(h), 0.75);
  }

  /** Where a held thing is in the world (to fly to): in front of the visitor, at its hand's place. */
  private handTarget(h: Held) {
    const side = this.sideFor(h.kind, true);
    const at = this.camera.localToWorld(SLOT[side].at.clone());
    return { at, q: this.camera.quaternion.clone() };
  }

  private toHand(h: Held) {
    h.where = 'hand';
    h.prop.removeFromParent();
    h.prop.position.set(0, 0, 0);
    h.prop.quaternion.identity();
    if (h.kind === 'coffee') h.prop.rotation.y = Math.PI / 2 + 0.5; // the handle behind the hand
    h.holder.add(h.prop);
    h.side = 0;
    this.hud.add(h.holder);
    this.layout(0, true);
  }

  /** Which hand: the right, or the left for the cookie when the coffee is in the right (owner: "a second hand"). */
  private sideFor(kind: Treat, coming = false): 1 | -1 {
    const other = this.items[kind === 'coffee' ? 'cookie' : 'coffee'];
    const both = other && (other.where === 'hand' || (coming && other.where === 'flying')) && other.done === null;
    return both && kind === 'cookie' ? -1 : 1;
  }

  sip() {
    return this.act('coffee');
  }
  bite() {
    return this.act('cookie');
  }
  private act(kind: Treat) {
    const h = this.items[kind];
    if (!h || h.where !== 'hand' || h.act !== null || h.done !== null || h.left <= 0) return false;
    h.act = 0;
    h.acted = false;
    return true;
  }

  /** Puts it down at `spot` (a table by the seat), the cookie beside the coffee (`side`: along the table's edge). */
  putDown(kind: Treat, spot: THREE.Vector3, side: THREE.Vector3) {
    const h = this.items[kind];
    if (!h || h.where !== 'hand' || h.act !== null || h.done !== null) return false;
    const at = spot.clone();
    if (kind === 'cookie') at.addScaledVector(side, 0.14).y += 0.007;
    const q = new THREE.Quaternion();
    if (kind === 'cookie') q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.4));
    else q.setFromEuler(new THREE.Euler(0, Math.atan2(side.x, side.z), 0));
    h.where = 'flying';
    // from the hand, as it is seen, into the world
    this.camera.updateMatrixWorld();
    h.prop.position.copy(this.camera.localToWorld(h.holder.position.clone()));
    const own = h.prop.quaternion.clone();
    h.prop.quaternion.copy(this.camera.quaternion).multiply(h.holder.quaternion).multiply(own);
    this.scene.add(h.prop);
    h.holder.removeFromParent();
    this.fly(h.prop, () => ({ at, q }), () => (h.where = 'table'), 0.55);
    this.layout(0, false);
    return true;
  }

  pickUp(kind: Treat) {
    const h = this.items[kind];
    if (!h || h.where !== 'table') return false;
    h.where = 'flying';
    this.fly(h.prop, () => this.handTarget(h), () => this.toHand(h), 0.55);
    return true;
  }

  private fly(obj: THREE.Object3D, to: Flight['to'], end: () => void, dur: number) {
    if (obj.parent !== this.scene) this.scene.attach(obj);
    this.flights.push({ obj, from: obj.position.clone(), q0: obj.quaternion.clone(), to, t: 0, dur, end });
  }

  /** Gone for good (finished, or cleared from a table). */
  private drop(h: Held) {
    disposeProp(h.prop);
    h.holder.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
    });
    h.holder.removeFromParent();
    if (this.items[h.kind] === h) this.items[h.kind] = null;
  }

  /**
   * Moves everything on by `dt` (the barista, flights, sips and bites, the hands easing to their places). `walking`:
   * the hands bob. Returns whether anything moved (the page draws again).
   */
  update(dt: number, walking: boolean): boolean {
    // the people move on all the time, but are drawn again only while they are in the picture
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
    const seen = (at: THREE.Vector3) => this.frustum.intersectsSphere(this.sphere.set(this.v.copy(at).setY(at.y + 1), 1.1));
    let moved = this.barista?.update(dt, this.camera.position, seen) ?? false;
    if (this.cleaner?.update(dt, this.camera.position, seen)) moved = true;
    // flights
    for (const f of [...this.flights]) {
      f.t += dt;
      const k = Math.min(1, f.t / f.dur);
      const e = k * k * (3 - 2 * k);
      const { at, q } = f.to();
      f.obj.position.lerpVectors(f.from, at, e);
      f.obj.position.y += Math.sin(Math.PI * k) * 0.12;
      f.obj.quaternion.slerpQuaternions(f.q0, q, e);
      if (k >= 1) {
        this.flights.splice(this.flights.indexOf(f), 1);
        f.obj.position.copy(at);
        f.obj.quaternion.copy(q);
        f.end();
      }
      moved = true;
    }
    if (walking) this.bob += dt * 8;
    if (this.layout(dt, walking)) moved = true;
    // crumbs
    for (const c of this.crumbs) {
      c.age += dt;
      c.v.y -= 2.5 * dt;
      c.m.position.addScaledVector(c.v, dt);
    }
    for (const c of this.crumbs.filter((x) => x.age > 0.7)) c.m.removeFromParent();
    this.crumbs = this.crumbs.filter((x) => x.age <= 0.7);
    if (this.crumbs.length) moved = true;
    return moved;
  }

  /** Each hand to its place (and a sip or a bite under way). Returns whether a hand is still moving. */
  private layout(dt: number, walking: boolean) {
    let moving = false;
    for (const h of Object.values(this.items)) {
      if (!h || h.where !== 'hand') continue;
      const side = this.sideFor(h.kind);
      if (side !== h.side) {
        // the hand that holds it (a right or a left one)
        for (const c of [...h.holder.children]) {
          if (c === h.prop) continue;
          c.removeFromParent();
          c.traverse((o) => {
            if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
          });
        }
        h.holder.add(makeHand(side, h.kind === 'coffee' ? 'cup' : 'cookie'));
        if (h.side === 0) {
          // arriving: from below the picture
          h.holder.position.copy(SLOT[side].at).add(DOWN);
          h.holder.rotation.copy(SLOT[side].rot);
        }
        h.side = side;
      }
      const slot = SLOT[side];
      const target = this.v.copy(slot.at);
      let tilt = 0;
      if (h.act !== null) {
        h.act = Math.min(1, h.act + dt / ACT_TIME);
        const b = bell(h.act);
        target.lerp(MOUTH[h.kind], b);
        tilt = b;
        if (!h.acted && h.act >= 0.5) {
          h.acted = true;
          h.left -= 1;
          if (h.kind === 'coffee') (h.prop as Cup).userData.setLevel(h.left / SIPS);
          else {
            (h.prop as Cookie).userData.setBites(BITES - h.left);
            this.crumble(h.holder);
          }
        }
        if (h.act >= 1) {
          h.act = null;
          if (h.left <= 0) h.done = 0;
        }
        moving = true;
      } else if (walking) target.y += Math.sin(this.bob) * 0.006;
      if (h.done !== null) {
        h.done += dt;
        target.add(DOWN);
        if (h.done > (h.kind === 'coffee' ? 1.1 : 0.4)) {
          this.drop(h);
          continue;
        }
        moving = true;
      }
      const ease = dt ? 1 - Math.exp(-dt * (h.act !== null ? 30 : 9)) : 1;
      if (h.holder.position.distanceToSquared(target) > 1e-8) {
        h.holder.position.lerp(target, ease);
        moving = true;
      }
      // a sip tips the cup toward the mouth; a bite turns the cookie's top to it
      const rx = slot.rot.x + (h.kind === 'coffee' ? 1.05 : 0.35) * tilt;
      const ry = slot.rot.y * (1 - tilt);
      h.holder.rotation.set(h.holder.rotation.x + (rx - h.holder.rotation.x) * ease, h.holder.rotation.y + (ry - h.holder.rotation.y) * ease, slot.rot.z);
    }
    return moving;
  }

  private crumble(holder: THREE.Group) {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(this.crumbGeo, this.crumbMat);
      m.position.copy(holder.position).add(this.v.set((Math.random() - 0.5) * 0.03, 0.035, 0.01));
      this.hud.add(m);
      this.crumbs.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.15, 0.05), age: 0 });
    }
  }

  /** Draws the hands over the place (after it): never cut by a wall the visitor stands against. */
  render(renderer: THREE.WebGLRenderer) {
    if (!Object.values(this.items).some((h) => h && h.where === 'hand') && !this.crumbs.length) return;
    this.hudCam.fov = this.camera.fov;
    this.hudCam.aspect = this.camera.aspect;
    this.hudCam.updateProjectionMatrix();
    const auto = renderer.autoClear;
    renderer.autoClear = false;
    renderer.clearDepth();
    renderer.render(this.hud, this.hudCam);
    renderer.autoClear = auto;
  }

  dispose() {
    for (const h of Object.values(this.items)) if (h) this.drop(h);
    for (const f of this.flights) disposeProp(f.obj);
    this.barista?.dispose();
    this.crumbGeo.dispose();
    this.crumbMat.dispose();
  }
}
