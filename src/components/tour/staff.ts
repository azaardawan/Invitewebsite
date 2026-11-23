/**
 * A café tour's member of staff who goes round the place (owner, 2026-11-23: "he will just be cleaning up the café and
 * going around"): a person in the model named `CLEANER` with the same joints as the barista (`CLEANER_torso`,
 * `CLEANER_head`, `CLEANER_armL|R`, `CLEANER_foreL|R`, `CLEANER_legL|R`), and his round, the points `CLEANER_stop_<n>`
 * (in order, looping; each faces the way he faces there, and its extras' `wipe` is how many seconds he wipes the table
 * there, 0 to walk on). He waits, looking at them, when a visitor stands in his way.
 */
import * as THREE from 'three';

const WALK = 0.75; // m/s: an unhurried round
const TURN = 3.2; // rad/s
const JOINTS = ['torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'legL', 'legR'] as const;
type Joint = (typeof JOINTS)[number];
type Stop = { at: THREE.Vector3; yaw: number; wipe: number };

function angleTo(a: number, b: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class Cleaner {
  private root: THREE.Object3D;
  private j: Record<Joint, THREE.Object3D>;
  private rest = new Map<THREE.Object3D, THREE.Euler>();
  private stops: Stop[];
  private next = 0;
  private phase: 'turn' | 'walk' | 'face' | 'wipe' = 'turn';
  private wiped = 0;
  private yaw: number;
  private baseY: number;
  private time = 0;
  private walkPhase = 0;
  private walking = 0;
  private wiping = 0;
  private look = 0;
  private v = new THREE.Vector3();

  static find(scene: THREE.Object3D): Cleaner | null {
    const root = scene.getObjectByName('CLEANER');
    if (!root) return null;
    const j = {} as Record<Joint, THREE.Object3D>;
    for (const k of JOINTS) {
      const o = root.getObjectByName(`CLEANER_${k}`);
      if (!o) return null;
      j[k] = o;
    }
    const stops: { n: number; s: Stop }[] = [];
    scene.traverse((o) => {
      const m = /^CLEANER_stop_(\d+)/.exec(o.name);
      if (!m) return;
      const at = o.getWorldPosition(new THREE.Vector3());
      const fwd = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
      stops.push({ n: Number(m[1]), s: { at, yaw: Math.atan2(fwd.x, fwd.z), wipe: Number((o.userData as { wipe?: number }).wipe) || 0 } });
    });
    if (stops.length < 2) return null;
    return new Cleaner(
      root,
      j,
      stops.sort((a, b) => a.n - b.n).map((x) => x.s),
    );
  }

  private constructor(root: THREE.Object3D, j: Record<Joint, THREE.Object3D>, stops: Stop[]) {
    this.root = root;
    this.j = j;
    this.stops = stops;
    for (const o of Object.values(j)) this.rest.set(o, o.rotation.clone());
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(root.matrixWorld);
    this.yaw = Math.atan2(fwd.x, fwd.z);
    this.baseY = root.position.y;
    // he begins at his first stop, wiping
    this.next = 0;
    this.phase = 'wipe';
  }

  private get here() {
    return this.root.getWorldPosition(this.v);
  }

  private moveTo(world: THREE.Vector3) {
    const p = this.root.parent;
    this.root.position.copy(p ? p.worldToLocal(world.clone()) : world);
    this.baseY = this.root.position.y;
  }

  /** Moves him on by `dt`; `viewer` is the visitor's eye. Returns whether he is near enough to be seen (draw again). */
  update(dt: number, viewer: THREE.Vector3, seen: (at: THREE.Vector3) => boolean = () => true): boolean {
    this.time += dt;
    const stop = this.stops[this.next]!;
    const here = this.here.clone();
    const toViewer = Math.hypot(viewer.x - here.x, viewer.z - here.z);
    this.walking = 0;
    this.wiping = 0;
    const turnTo = (yaw: number) => {
      const d = angleTo(this.yaw, yaw);
      const step = TURN * dt;
      if (Math.abs(d) <= step) {
        this.yaw = yaw;
        return true;
      }
      this.yaw += Math.sign(d) * step;
      return false;
    };
    if (this.phase === 'turn') {
      const dx = stop.at.x - here.x,
        dz = stop.at.z - here.z;
      if (Math.hypot(dx, dz) < 0.02 || turnTo(Math.atan2(dx, dz))) this.phase = 'walk';
    } else if (this.phase === 'walk') {
      const dx = stop.at.x - here.x,
        dz = stop.at.z - here.z;
      const d = Math.hypot(dx, dz);
      // a visitor in his way (just ahead): he waits for them
      const ahead = ((viewer.x - here.x) * dx + (viewer.z - here.z) * dz) / Math.max(d, 1e-6);
      const blocked = toViewer < 0.9 && ahead > 0;
      if (!blocked) {
        const step = Math.min(d, WALK * dt);
        this.moveTo(here.clone().set(here.x + (dx / (d || 1)) * step, stop.at.y, here.z + (dz / (d || 1)) * step));
        this.walking = 1;
        if (d - step < 0.01) this.phase = stop.wipe ? 'face' : 'turn';
        if (d - step < 0.01 && !stop.wipe) this.next = (this.next + 1) % this.stops.length;
      }
    } else if (this.phase === 'face') {
      if (turnTo(stop.yaw)) {
        this.phase = 'wipe';
        this.wiped = 0;
      }
    } else {
      this.wiped += dt;
      this.wiping = Math.min(1, this.wiped * 3, Math.max(0, (stop.wipe - this.wiped) * 3));
      if (this.wiped >= stop.wipe) {
        this.next = (this.next + 1) % this.stops.length;
        this.phase = 'turn';
      }
    }
    // drawn again only while he can be seen: near, and in the picture
    if (toViewer > 12 || !seen(here)) return false;
    this.pose(dt, viewer, here, toViewer);
    return true;
  }

  private pose(dt: number, viewer: THREE.Vector3, here: THREE.Vector3, far: number) {
    for (const [o, e] of this.rest) o.rotation.copy(e);
    const j = this.j;
    this.root.rotation.set(0, this.yaw, 0);
    this.root.position.y = this.baseY;
    const t = this.time;
    j.torso.scale.set(1, 1 + Math.sin(t * 2.1) * 0.006, 1);
    if (this.walking) {
      this.walkPhase += dt * 6.5;
      const s = Math.sin(this.walkPhase);
      j.legL.rotation.x += s * 0.4;
      j.legR.rotation.x -= s * 0.4;
      j.armL.rotation.x -= s * 0.28;
      j.armR.rotation.x += s * 0.2;
      j.foreR.rotation.x -= 0.35; // the cloth held a little forward
      this.root.position.y += (Math.abs(Math.cos(this.walkPhase)) - 0.5) * 0.012;
    }
    if (this.wiping) {
      // bent over the table, the cloth going round in circles; the other hand on the table's edge
      const w = this.wiping;
      j.torso.rotation.x += 0.38 * w;
      j.armR.rotation.x -= (0.95 + Math.sin(t * 6) * 0.18) * w;
      j.armR.rotation.z += Math.cos(t * 6) * 0.22 * w;
      j.foreR.rotation.x -= 0.35 * w;
      j.armL.rotation.x -= 0.7 * w;
      j.foreL.rotation.x -= 0.2 * w;
      j.head.rotation.x += 0.25 * w;
    }
    // he looks at a visitor nearby (while not busy wiping)
    let want = 0;
    if (far < 4 && this.wiping < 0.5) {
      const d = angleTo(this.yaw, Math.atan2(viewer.x - here.x, viewer.z - here.z));
      if (Math.abs(d) < 1.6) want = THREE.MathUtils.clamp(d, -0.8, 0.8);
    }
    this.look += (want - this.look) * (1 - Math.exp(-dt * 4));
    j.head.rotation.y += this.look;
  }
}
