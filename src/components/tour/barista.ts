/**
 * A café tour's barista (owner, 2026-11-23): a person in the model (a node `BARISTA` on the floor behind the counter,
 * facing the customers along its +Z) whom the tour page moves by his joints' names (docs/TOURS.md):
 * `BARISTA_torso`, `BARISTA_head`, `BARISTA_armL|R` (shoulders), `BARISTA_foreL|R` (elbows), `BARISTA_handL|R` (what
 * he holds), `BARISTA_legL|R` (hips). His places are named nodes too: `BARISTA_coffee` (where he makes coffee, facing
 * the machine), `BARISTA_cookies` (by the cookie pile) and `BARISTA_steam` (the machine's steam).
 *
 * Standing, he breathes and looks at a visitor nearby; asked, he walks to the machine (or the pile), makes the coffee
 * (or takes a cookie), walks back and holds it out, and hands it over (`order`).
 */
import * as THREE from 'three';

type Pose = { at: THREE.Vector3; yaw: number };
type Step = { dur: number; start?: () => void; run: (k: number) => void; end?: () => void };

const WALK = 0.9; // m/s
const TURN = 4; // rad/s
const JOINTS = ['torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'handL', 'handR', 'legL', 'legR'] as const;
type Joint = (typeof JOINTS)[number];

const ease = (k: number) => k * k * (3 - 2 * k);
const bell = (k: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, k)));
function lerpAngle(a: number, b: number, k: number) {
  let d = (b - a) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}
function poseOf(o: THREE.Object3D): Pose {
  const at = o.getWorldPosition(new THREE.Vector3());
  const fwd = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
  return { at, yaw: Math.atan2(fwd.x, fwd.z) };
}

export class Barista {
  private root: THREE.Object3D;
  private j: Record<Joint, THREE.Object3D>;
  private rest = new Map<THREE.Object3D, THREE.Euler>();
  private home: Pose;
  private places: { coffee?: Pose; cookies?: Pose };
  private steamAt?: THREE.Vector3;
  private queue: Step[] = [];
  private step: Step | null = null;
  private stepT = 0;
  private time = 0;
  private walkPhase = 0;
  private walking = 0;
  private carrying = 0;
  private working = 0;
  private reaching = 0;
  private offering = 0;
  private held: THREE.Object3D | null = null;
  private puffs: { m: THREE.Mesh; age: number }[] = [];
  private puffGeo = new THREE.SphereGeometry(0.03, 10, 8);
  private puffMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  private nextPuff = 0;
  private look = 0;
  private yaw: number;
  /** His height on his floor (walking bobs from it). */
  private baseY: number;
  private q = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private v = new THREE.Vector3();

  /** The model's barista, when it has one (with at least his arms and a place to work). */
  static find(scene: THREE.Object3D): Barista | null {
    const root = scene.getObjectByName('BARISTA');
    if (!root) return null;
    const j = {} as Record<Joint, THREE.Object3D>;
    for (const k of JOINTS) {
      const o = root.getObjectByName(`BARISTA_${k}`);
      if (!o) return null;
      j[k] = o;
    }
    const place = (name: string) => {
      const o = scene.getObjectByName(name);
      return o ? poseOf(o) : undefined;
    };
    const places = { coffee: place('BARISTA_coffee'), cookies: place('BARISTA_cookies') };
    if (!places.coffee && !places.cookies) return null;
    return new Barista(root, j, places, scene.getObjectByName('BARISTA_steam')?.getWorldPosition(new THREE.Vector3()));
  }

  private constructor(root: THREE.Object3D, j: Record<Joint, THREE.Object3D>, places: { coffee?: Pose; cookies?: Pose }, steamAt?: THREE.Vector3) {
    this.root = root;
    this.j = j;
    this.places = places;
    this.steamAt = steamAt;
    for (const o of Object.values(j)) this.rest.set(o, o.rotation.clone());
    this.home = poseOf(root);
    this.yaw = this.home.yaw;
    this.baseY = root.position.y;
  }

  /** What he can make (a coffee needs his machine, a cookie his pile). */
  can(kind: 'coffee' | 'cookie') {
    return !!(kind === 'coffee' ? this.places.coffee : this.places.cookies);
  }

  get busy() {
    return !!this.step || this.queue.length > 0;
  }

  /** Where he stands (on the floor). */
  get position() {
    return this.root.getWorldPosition(new THREE.Vector3());
  }

  /**
   * Makes a coffee (or fetches a cookie) and holds it out: `prop` is what he hands over (a cup, a cookie), `offer` is
   * told when he holds it out (the prop then belongs to the page, in the world where it is).
   */
  order(kind: 'coffee' | 'cookie', prop: THREE.Object3D, offer: (prop: THREE.Object3D) => void) {
    const place = kind === 'coffee' ? this.places.coffee : this.places.cookies;
    if (!place || this.busy) return false;
    this.walkTo(place);
    if (kind === 'coffee')
      this.queue.push({
        dur: 3.2,
        run: (k) => {
          this.working = bell(Math.min(1, k * 1.15));
          if (k > 0.15 && k < 0.85) this.steam();
          if (k > 0.8 && !this.held) this.hold(prop);
        },
        end: () => (this.working = 0),
      });
    else
      this.queue.push({
        dur: 1.5,
        run: (k) => {
          this.reaching = bell(k);
          if (k > 0.5 && !this.held) this.hold(prop);
        },
        end: () => (this.reaching = 0),
      });
    this.queue.push({ dur: 0.01, run: () => (this.carrying = 1) });
    this.walkTo(this.home);
    this.queue.push({
      dur: 0.7,
      run: (k) => (this.offering = ease(k)),
      end: () => {
        const p = this.held;
        this.held = null;
        this.carrying = 0;
        if (p) {
          // handed over where it is, in the world
          this.root.parent!.attach(p);
          offer(p);
        }
      },
    });
    this.queue.push({ dur: 0.6, run: (k) => (this.offering = 1 - ease(k)) });
    return true;
  }

  private hold(prop: THREE.Object3D) {
    this.held = prop;
    this.j.handR.add(prop);
    prop.position.set(0, 0, 0);
  }

  /** Turns toward a place, walks there, and turns the way it faces. */
  private walkTo(to: Pose) {
    let from = new THREE.Vector3();
    let y0 = 0;
    let dir = 0;
    const turnDur = (a: number, b: number) => Math.max(0.15, Math.abs(lerpAngle(0, b - a, 1)) / TURN);
    const turn: Step = {
      dur: 0.4,
      start: () => {
        from = this.root.getWorldPosition(new THREE.Vector3());
        y0 = this.yaw;
        dir = Math.hypot(to.at.x - from.x, to.at.z - from.z) > 0.05 ? Math.atan2(to.at.x - from.x, to.at.z - from.z) : y0;
        turn.dur = turnDur(y0, dir);
      },
      run: (k) => (this.yaw = lerpAngle(y0, dir, ease(k))),
    };
    this.queue.push(turn);
    const walk: Step = {
      dur: 1,
      start: () => {
        from = this.root.getWorldPosition(new THREE.Vector3());
        walk.dur = Math.max(0.2, from.distanceTo(to.at) / WALK);
      },
      run: (k) => {
        this.walking = Math.min(1, bell(k) * 3);
        this.setPosition(this.v.lerpVectors(from, to.at, k));
      },
      end: () => (this.walking = 0),
    };
    this.queue.push(walk);
    const face: Step = {
      dur: 0.4,
      start: () => {
        y0 = this.yaw;
        face.dur = turnDur(y0, to.yaw);
      },
      run: (k) => (this.yaw = lerpAngle(y0, to.yaw, ease(k))),
    };
    this.queue.push(face);
  }

  private setPosition(world: THREE.Vector3) {
    const p = this.root.parent;
    this.root.position.copy(p ? p.worldToLocal(world.clone()) : world);
    this.baseY = this.root.position.y;
  }

  private steam() {
    if (!this.steamAt || this.time < this.nextPuff) return;
    this.nextPuff = this.time + 0.12;
    const m = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
    m.position.copy(this.steamAt).add(this.v.set((Math.random() - 0.5) * 0.08, 0, (Math.random() - 0.5) * 0.08));
    this.root.parent!.add(m);
    this.puffs.push({ m, age: 0 });
  }

  /**
   * Moves him on by `dt` seconds; `viewer` is where the visitor's eyes are. Returns whether anything of him moved
   * (the page then draws again): always while he works, and while the visitor is near enough to see him breathe.
   */
  update(dt: number, viewer: THREE.Vector3): boolean {
    this.time += dt;
    // the task at hand
    if (!this.step && this.queue.length) {
      this.step = this.queue.shift()!;
      this.stepT = 0;
      this.step.start?.();
    }
    if (this.step) {
      this.stepT += dt;
      const s = this.step;
      const k = Math.min(1, this.stepT / s.dur);
      s.run(k);
      if (k >= 1) {
        s.end?.();
        this.step = null;
      }
    }
    // the steam
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

    const here = this.root.getWorldPosition(this.v);
    const far = Math.hypot(viewer.x - here.x, viewer.z - here.z);
    const active = this.busy || this.puffs.length > 0;
    if (!active && far > 10) return false;
    this.pose(dt, viewer, here, far);
    return true;
  }

  /** Sets every joint for this moment: standing at rest, then breathing, walking, working, reaching, holding out. */
  private pose(dt: number, viewer: THREE.Vector3, here: THREE.Vector3, far: number) {
    for (const [o, e] of this.rest) o.rotation.copy(e);
    const j = this.j;
    this.root.rotation.set(0, this.yaw, 0);
    this.root.position.y = this.baseY;
    // breathing and a slight sway
    const t = this.time;
    j.torso.scale.set(1, 1 + Math.sin(t * 2.1) * 0.006, 1 + Math.sin(t * 2.1) * 0.012);
    j.torso.rotation.z += Math.sin(t * 0.7) * 0.012;
    // walking: legs and arms swing
    if (this.walking) {
      this.walkPhase += dt * 7.5;
      const s = Math.sin(this.walkPhase) * this.walking;
      j.legL.rotation.x += s * 0.42;
      j.legR.rotation.x -= s * 0.42;
      j.armL.rotation.x -= s * 0.3;
      j.armR.rotation.x += s * 0.3 * (1 - this.carrying);
      this.root.position.y += (Math.abs(Math.cos(this.walkPhase)) - 0.5) * 0.012 * this.walking;
    }
    // at the machine: both hands at work, a little bent over it
    if (this.working) {
      const w = this.working;
      const jig = Math.sin(t * 9) * 0.08;
      j.torso.rotation.x += 0.12 * w;
      j.armL.rotation.x -= (0.95 + jig) * w;
      j.armR.rotation.x -= (0.85 - jig) * w;
      j.foreL.rotation.x -= 0.85 * w;
      j.foreR.rotation.x -= 0.95 * w;
    }
    // reaching for a cookie
    if (this.reaching) {
      const r = this.reaching;
      j.torso.rotation.x += 0.22 * r;
      j.armR.rotation.x -= 1.15 * r;
      j.foreR.rotation.x -= 0.25 * r;
    }
    // carrying it (the hand in front), then holding it out over the counter
    if (this.carrying || this.offering) {
      const c = Math.max(this.carrying, this.offering);
      const o = this.offering;
      j.armR.rotation.x -= 0.45 * c + 0.85 * o;
      j.foreR.rotation.x -= 0.95 * c * (1 - o) + 0.15 * o;
      j.torso.rotation.x += 0.08 * o;
    }
    // he looks at a visitor nearby, in front of him (not while busy at the machine)
    let want = 0;
    if (far < 6 && !this.working && !this.reaching) {
      const a = Math.atan2(viewer.x - here.x, viewer.z - here.z);
      const d = lerpAngle(0, a - this.yaw, 1);
      if (Math.abs(d) < 1.6) want = THREE.MathUtils.clamp(d, -0.75, 0.75);
    }
    this.look += (want - this.look) * (1 - Math.exp(-dt * 5));
    j.head.rotation.y += this.look;
    // what he holds stays upright in the world (facing the way he faces)
    if (this.held) {
      this.root.updateMatrixWorld(true);
      j.handR.getWorldQuaternion(this.q).invert();
      this.root.getWorldQuaternion(this.q2);
      this.held.quaternion.copy(this.q.multiply(this.q2));
    }
  }

  dispose() {
    for (const p of this.puffs) p.m.removeFromParent();
    this.puffGeo.dispose();
    this.puffMat.dispose();
  }
}
