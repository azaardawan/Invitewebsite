/**
 * A café tour's waiter (owner, 2026-11-23): a person in the model named `CLEANER` with the barista's joints
 * (`CLEANER_torso`, `CLEANER_head`, `CLEANER_armL|R`, `CLEANER_foreL|R`, `CLEANER_handR`, `CLEANER_legL|R`), who goes
 * round the place wiping the tables: his round is the points `CLEANER_stop_<n>` (in order, looping; each faces the way
 * he faces there, its extras' `wipe` the seconds he wipes a table there, 0 to walk on). He waits, looking at them, when
 * a visitor stands in his way.
 *
 * A seated visitor can call him (the page's «Call the waiter»): he leaves his round and walks to them along the
 * café's walkways (`NAV_<n>`, extras `links`), takes their order, fetches it at the counter (`NAV_0`) and brings it,
 * then goes back to his round.
 */
import * as THREE from 'three';

const WALK = 0.75; // m/s: an unhurried round
const HURRY = 1.0; // m/s: on his way to a visitor
const TURN = 3.2; // rad/s
const JOINTS = ['torso', 'head', 'armL', 'armR', 'foreL', 'foreR', 'handR', 'legL', 'legR'] as const;
type Joint = (typeof JOINTS)[number];
/** Somewhere to go: where, the way to face there, how long to stay (wiping a table, or just waiting), then what. */
type Goal = { at: THREE.Vector3; yaw?: number; stay?: number; wipe?: boolean; serving?: boolean; done?: () => void };
/** Where the waiter stands by a seat, and the walkway point he comes from. */
export type SeatSpot = { stand: THREE.Vector3; seat: THREE.Vector3; nav: number };

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
  private stops: Goal[];
  private nextStop = 0;
  private nav: { at: THREE.Vector3; links: number[] }[];
  private goals: Goal[] = [];
  private phase: 'turn' | 'walk' | 'face' | 'stay' = 'turn';
  private stayed = 0;
  /** On his round, or serving a visitor (no round until he is done). */
  private serving = false;
  private yaw: number;
  private baseY: number;
  private time = 0;
  private walkPhase = 0;
  private walking = 0;
  private wiping = 0;
  private look = 0;
  private held: THREE.Object3D | null = null;
  private cloth: THREE.Object3D | null;
  private v = new THREE.Vector3();
  private q = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();

  static find(scene: THREE.Object3D): Cleaner | null {
    const root = scene.getObjectByName('CLEANER');
    if (!root) return null;
    const j = {} as Record<Joint, THREE.Object3D>;
    for (const k of JOINTS) {
      const o = root.getObjectByName(`CLEANER_${k}`);
      if (!o) return null;
      j[k] = o;
    }
    const stops: { n: number; s: Goal }[] = [];
    const nav: { n: number; at: THREE.Vector3; links: number[] }[] = [];
    scene.traverse((o) => {
      let m = /^CLEANER_stop_(\d+)/.exec(o.name);
      if (m) {
        const at = o.getWorldPosition(new THREE.Vector3());
        const fwd = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
        const wipe = Number((o.userData as { wipe?: number }).wipe) || 0;
        stops.push({ n: Number(m[1]), s: { at, yaw: wipe ? Math.atan2(fwd.x, fwd.z) : undefined, stay: wipe, wipe: wipe > 0 } });
      }
      m = /^NAV_(\d+)/.exec(o.name);
      if (m) {
        const links = (o.userData as { links?: unknown }).links;
        nav.push({ n: Number(m[1]), at: o.getWorldPosition(new THREE.Vector3()), links: Array.isArray(links) ? links.map(Number) : [] });
      }
    });
    if (stops.length < 2) return null;
    const navList: { at: THREE.Vector3; links: number[] }[] = [];
    for (const p of nav) navList[p.n] = { at: p.at, links: p.links };
    return new Cleaner(
      root,
      j,
      stops.sort((a, b) => a.n - b.n).map((x) => x.s),
      navList,
    );
  }

  private constructor(root: THREE.Object3D, j: Record<Joint, THREE.Object3D>, stops: Goal[], nav: { at: THREE.Vector3; links: number[] }[]) {
    this.root = root;
    this.j = j;
    this.stops = stops;
    this.nav = nav;
    this.cloth = root.getObjectByName('CLEANER_cloth') ?? null;
    for (const o of Object.values(j)) this.rest.set(o, o.rotation.clone());
    const fwd = new THREE.Vector3(0, 0, 1).transformDirection(root.matrixWorld);
    this.yaw = Math.atan2(fwd.x, fwd.z);
    this.baseY = root.position.y;
    // he begins at his first stop, wiping
    this.goals.push(stops[0]!);
    this.nextStop = 1;
    this.phase = 'face';
  }

  /** Whether he can serve seated visitors (the model has walkways, a counter and a way to the seat). */
  canServe(spot: SeatSpot | null) {
    return !!spot && this.nav.length > 1 && !!this.nav[0] && !!this.nav[spot.nav];
  }

  get busy() {
    return this.serving;
  }

  private get here() {
    return this.root.getWorldPosition(this.v);
  }

  /** The walkway points from the one nearest him to point `to` (the shortest way, by distance). */
  private route(to: number): THREE.Vector3[] {
    const here = this.here.clone();
    let from = -1;
    let best = Infinity;
    this.nav.forEach((p, i) => {
      if (!p) return;
      const d = p.at.distanceTo(here);
      if (d < best) {
        best = d;
        from = i;
      }
    });
    if (from < 0 || !this.nav[to]) return [];
    // Dijkstra over a handful of points
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

  /** Leaves what he is doing and walks along the walkways to `to` (via its walkway point `nav`), then `then`. */
  private goTo(nav: number, last: Goal) {
    this.goals = [...this.route(nav).map((at) => ({ at, serving: true })), { ...last, serving: true }];
    this.phase = 'turn';
  }

  /** A seated visitor calls him: he comes to their seat (`arrived` once he stands by it, facing them). */
  summon(spot: SeatSpot, arrived: () => void) {
    this.serving = true;
    if (this.held) this.held.removeFromParent();
    this.held = null;
    const yaw = Math.atan2(spot.seat.x - spot.stand.x, spot.seat.z - spot.stand.z);
    this.goTo(spot.nav, { at: spot.stand.clone(), yaw, done: arrived });
  }

  /** Off to the counter for the order: `pickUp` is called there (it gives him the order with `hold`). */
  fetch(pickUp: () => void) {
    this.goTo(0, { at: this.nav[0]!.at.clone(), yaw: 0, stay: 0, done: pickUp });
  }

  /** He takes it in his hand (the cloth goes in his pocket). */
  hold(prop: THREE.Object3D) {
    this.held = prop;
    this.j.handR.add(prop);
    prop.position.set(0, -0.02, 0.03);
    if (this.cloth) this.cloth.visible = false;
  }

  /** Where his face is (a seated visitor turns to look at him when he comes). */
  facePosition() {
    this.root.updateMatrixWorld(true);
    return this.j.head.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, -0.05, 0));
  }

  /** The world position of his right hand (where an order is handed to him). */
  handPosition() {
    this.root.updateMatrixWorld(true);
    return this.j.handR.getWorldPosition(new THREE.Vector3());
  }

  /** Back to the seat with it: `give` is told when he holds it out (the prop is then the page's). */
  bring(spot: SeatSpot, give: (prop: THREE.Object3D) => void) {
    const yaw = Math.atan2(spot.seat.x - spot.stand.x, spot.seat.z - spot.stand.z);
    this.goTo(spot.nav, {
      at: spot.stand.clone(),
      yaw,
      stay: 0.6,
      done: () => {
        const p = this.held;
        this.held = null;
        if (p) {
          this.root.parent!.attach(p);
          give(p);
        }
        this.resume();
      },
    });
  }

  /** Back to his round (from where he stands, along the walkways to the next table). */
  resume() {
    this.serving = false;
    if (this.cloth) this.cloth.visible = true;
    if (this.held) {
      this.held.removeFromParent();
      this.held = null;
    }
    const stop = this.stops[this.nextStop]!;
    // the walkway point nearest his next table, then the table
    let near = 0;
    this.nav.forEach((p, i) => {
      if (p && p.at.distanceTo(stop.at) < this.nav[near]!.at.distanceTo(stop.at)) near = i;
    });
    this.goals = this.route(near).map((at) => ({ at }));
    this.phase = 'turn';
  }

  /** Moves him on by `dt`; `viewer` is the visitor's eye. Returns whether he is near enough to be seen (draw again). */
  update(dt: number, viewer: THREE.Vector3, seen: (at: THREE.Vector3) => boolean = () => true): boolean {
    this.time += dt;
    if (!this.goals.length && !this.serving) {
      // on his round: the next table
      this.goals.push(this.stops[this.nextStop]!);
      this.nextStop = (this.nextStop + 1) % this.stops.length;
      this.phase = 'turn';
    }
    const here = this.here.clone();
    const toViewer = Math.hypot(viewer.x - here.x, viewer.z - here.z);
    this.walking = 0;
    this.wiping = 0;
    const goal = this.goals[0];
    if (!goal) {
      // serving: standing by the visitor's seat (taking the order) or at the counter (waiting for it)
      if (toViewer > 12 || !seen(here)) return false;
      this.pose(dt, viewer, here, toViewer);
      return true;
    }
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
    const finish = () => {
      this.goals.shift();
      this.phase = 'turn';
      goal.done?.();
    };
    if (this.phase === 'turn') {
      const dx = goal.at.x - here.x,
        dz = goal.at.z - here.z;
      if (Math.hypot(dx, dz) < 0.02 || turnTo(Math.atan2(dx, dz))) this.phase = 'walk';
    } else if (this.phase === 'walk') {
      const dx = goal.at.x - here.x,
        dz = goal.at.z - here.z;
      const d = Math.hypot(dx, dz);
      // a visitor in his way (just ahead): he waits for them (not the visitor he is serving, at their seat)
      const ahead = ((viewer.x - here.x) * dx + (viewer.z - here.z) * dz) / Math.max(d, 1e-6);
      const blocked = !goal.serving && toViewer < 0.9 && ahead > 0;
      if (!blocked) {
        const step = Math.min(d, (this.serving ? HURRY : WALK) * dt);
        // up and down a step (the terrace's door): his height follows the way's
        const k = d > 1e-6 ? step / d : 1;
        this.moveTo(here.clone().set(here.x + dx * k, here.y + (goal.at.y - here.y) * k, here.z + dz * k));
        this.walking = 1;
        if (d - step < 0.01) {
          if (goal.yaw !== undefined) this.phase = 'face';
          else if (goal.stay) {
            this.phase = 'stay';
            this.stayed = 0;
          } else finish();
        }
      }
    } else if (this.phase === 'face') {
      if (turnTo(goal.yaw!)) {
        this.phase = 'stay';
        this.stayed = 0;
      }
    } else {
      this.stayed += dt;
      const stay = goal.stay ?? 0;
      if (goal.wipe) this.wiping = Math.min(1, this.stayed * 3, Math.max(0, (stay - this.stayed) * 3));
      if (this.stayed >= stay && (stay > 0 || goal.done || !goal.serving)) finish();
    }
    // drawn again only while he can be seen: near, and in the picture
    if (toViewer > 12 || !seen(here)) return false;
    this.pose(dt, viewer, here, toViewer);
    return true;
  }

  private moveTo(world: THREE.Vector3) {
    const p = this.root.parent;
    this.root.position.copy(p ? p.worldToLocal(world.clone()) : world);
    this.baseY = this.root.position.y;
  }

  private pose(dt: number, viewer: THREE.Vector3, here: THREE.Vector3, far: number) {
    for (const [o, e] of this.rest) o.rotation.copy(e);
    const j = this.j;
    this.root.rotation.set(0, this.yaw, 0);
    this.root.position.y = this.baseY;
    const t = this.time;
    j.torso.scale.set(1, 1 + Math.sin(t * 2.1) * 0.006, 1);
    if (this.walking) {
      this.walkPhase += dt * (this.serving ? 8 : 6.5);
      const s = Math.sin(this.walkPhase);
      j.legL.rotation.x += s * 0.4;
      j.legR.rotation.x -= s * 0.4;
      j.armL.rotation.x -= s * 0.28;
      if (!this.held) j.armR.rotation.x += s * 0.2;
      j.foreR.rotation.x -= 0.35; // the cloth held a little forward
      this.root.position.y += (Math.abs(Math.cos(this.walkPhase)) - 0.5) * 0.012;
    }
    if (this.held) {
      // carrying an order: the hand up in front of him
      j.armR.rotation.x -= 0.4;
      j.foreR.rotation.x -= 1.0;
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
    // what he carries stays upright
    if (this.held) {
      this.root.updateMatrixWorld(true);
      j.handR.getWorldQuaternion(this.q).invert();
      this.root.getWorldQuaternion(this.q2);
      this.held.quaternion.copy(this.q.multiply(this.q2));
    }
  }
}
