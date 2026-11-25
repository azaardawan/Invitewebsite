/**
 * A tour's barista (owner, 2026-11-23; rebuilt 2026-11-24 with the character and NPC interaction skills, and to make
 * anything on the café's menu): a person of the model (`BARISTA`, skeleton as in character.ts) behind the counter.
 *
 * His places are named points of the model: `BARISTA_coffee` (at the machine), `BARISTA_cups` (the top of the stack
 * of hot cups; `_cups_espresso`, `_cups_iced` the others), `BARISTA_fill` (under the group head), `BARISTA_shot` (the
 * group head's spout), `BARISTA_water_cup` / `BARISTA_water` (the hot water tap), `BARISTA_wand` (the steam wand's
 * tip), `BARISTA_steam`, `BARISTA_cold` (where a cup is made at the window counter), `BARISTA_ice`,
 * `BARISTA_blender`, `BARISTA_garnish_<lime|lemon|mint>`, `BARISTA_cookies` / `BARISTA_pile` (the cookies),
 * `BARISTA_handout` (on the counter, where an order waits for a visitor standing back), `BARISTA_coldwork` (where he
 * stands at the window counter). The things he picks up: `PROP_bottle_<key>` (the syrups and jars, milk, soda,
 * water), `PROP_pitcher`, `PROP_jug`, `PROP_scoop`, `PROP_drawer` (the till's).
 *
 * An order is the menu item's steps (tours/koupup/menu.json), each done with his hands: the cup from its stack to
 * where it is made; a syrup's bottle taken from the rack, tipped over the cup, put back; the shot under the group head;
 * milk steamed in the pitcher at the wand and poured (its pattern on top); ice scooped in; the blender run and its jug
 * poured; a slice or mint from the tray. Then he carries it to the counter and holds it out: the visitor pays (their
 * notes into his other hand), and it changes hands once their hand is on it; nobody near, he puts it on the counter.
 * The money goes in the till.
 */
import * as THREE from 'three';
import { Character } from './character';
import { Actor, logContact, type Kind, type Pay, type Step } from './interaction';
import { makeGarnish, type Drink } from './drink';
import type { MakeStep, MenuItem } from './menu';

type Place = { at: THREE.Vector3; yaw: number };
/** Whom he hands an order to: where their hand will meet it (null: put it on the counter), and their hand taking it. */
export type Handoff = {
  meet: () => THREE.Vector3 | null;
  taken: (prop: THREE.Object3D, at: THREE.Vector3) => boolean;
  placed: (prop: THREE.Object3D) => void;
  /** They pay as they are given it (the visitor at the counter; the waiter's orders are paid at the table). */
  pay?: Pay;
};

const PLACES = ['coffee', 'cookies', 'cups', 'cups_espresso', 'cups_iced', 'fill', 'shot', 'water_cup', 'water', 'wand', 'steam', 'cold', 'ice', 'blender', 'garnish_lime', 'garnish_lemon', 'garnish_mint', 'handout', 'pile', 'coldwork'] as const;
type PlaceName = (typeof PLACES)[number];

function placeOf(o: THREE.Object3D): Place {
  const at = o.getWorldPosition(new THREE.Vector3());
  const f = new THREE.Vector3(0, 0, 1).transformDirection(o.matrixWorld);
  return { at, yaw: Math.atan2(f.x, f.z) };
}
const Y = new THREE.Vector3(0, 1, 0);

export class Barista {
  private a: Actor;
  private home: Place;
  private p: Partial<Record<PlaceName, Place>> = {};
  /** The things he picks up, and where each lives. */
  private props = new Map<string, { o: THREE.Object3D; home: THREE.Vector3; kind: Kind }>();
  private drawer: { o: THREE.Object3D; closed: THREE.Vector3; open: THREE.Vector3; money: THREE.Vector3 } | null = null;
  private puffs: { m: THREE.Mesh; age: number }[] = [];
  private puffGeo = new THREE.SphereGeometry(0.03, 10, 8);
  private puffMat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.5, depthWrite: false });
  private nextPuff = 0;
  private time = 0;
  /** Steam from the wand (or the machine) while true. */
  private steaming = false;
  /** A stream falling (a shot, hot water, a pour): from, to, colour. */
  private stream: THREE.Mesh;
  private streamOn: { from: THREE.Vector3; to: THREE.Vector3; color: string; r: number } | null = null;
  /** The blender's jug: what is in it (shown as it fills and blends). */
  private jugFill: THREE.Mesh | null = null;
  private busyWith: MenuItem | null = null;

  static find(scene: THREE.Object3D): Barista | null {
    const ch = Character.find(scene, 'BARISTA');
    if (!ch) return null;
    const b = new Barista(ch, scene);
    for (const k of PLACES) {
      const o = scene.getObjectByName(`BARISTA_${k}`);
      if (o) b.p[k] = placeOf(o);
    }
    return b.p.coffee || b.p.cookies ? b : null;
  }

  private constructor(ch: Character, scene: THREE.Object3D) {
    this.a = new Actor(ch);
    this.home = { at: ch.root.getWorldPosition(new THREE.Vector3()), yaw: ch.yaw() };
    scene.traverse((o) => {
      const m = /^PROP_(bottle_(\w+)|pitcher|jug|scoop|drawer)$/.exec(o.name);
      if (!m) return;
      if (m[1] === 'drawer') {
        const d = o.userData as { open?: number[]; money?: number[] };
        this.drawer = {
          o,
          closed: o.position.clone(),
          open: o.position.clone().add(new THREE.Vector3(...(d.open ?? [0, 0, 0.14]))),
          money: new THREE.Vector3(...(d.money ?? [0, 0.045, 0])),
        };
        return;
      }
      const key = m[2] ?? m[1]!;
      const kind = ((o.userData as { kind?: Kind }).kind ?? 'bottle') as Kind;
      // where it is held and its mouth, as the model says (its own space)
      const ud = o.userData as { hold?: number[]; mouth?: number[] };
      if (Array.isArray(ud.hold)) o.userData.hold = new THREE.Vector3(...ud.hold);
      if (Array.isArray(ud.mouth)) o.userData.mouth = new THREE.Vector3(...ud.mouth);
      this.props.set(key, { o, home: o.getWorldPosition(new THREE.Vector3()), kind });
    });
    const jug = this.props.get('jug')?.o;
    if (jug) {
      this.jugFill = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.043, 1, 18), new THREE.MeshStandardMaterial({ roughness: 0.3 }));
      this.jugFill.visible = false;
      jug.add(this.jugFill);
    }
    this.stream = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 8, 1, true), new THREE.MeshStandardMaterial({ roughness: 0.2 }));
    this.stream.visible = false;
    scene.add(this.stream);
    // behind the counter he works on his lines: along the bar (facing the machine) and along the window counter
    this.a.standFor = (q) => {
      const cold = this.p.coldwork;
      if (q.z < 5.98 && this.p.coffee) return { at: new THREE.Vector3(THREE.MathUtils.clamp(q.x, 0.55, 1.62), this.p.coffee.at.y, this.p.coffee.at.z), yaw: Math.PI };
      if (cold && q.x > cold.at.x + 0.2 && q.z > 6.02 && q.z < 7.95) return { at: new THREE.Vector3(cold.at.x, cold.at.y, THREE.MathUtils.clamp(q.z - 0.05, 6.15, 7.8)), yaw: cold.yaw };
      return null;
    };
    // round the corner of the window counter (not through it)
    this.a.viaFor = (from, to) => {
      const cold = this.p.coldwork;
      if (!cold) return [];
      const corner = new THREE.Vector3(cold.at.x - 0.12, cold.at.y, 6.12);
      const near = (p: THREE.Vector3) => p.z < 6.1;
      return near(from) !== near(to) && Math.max(from.x, to.x) > corner.x ? [corner] : [];
    };
  }

  /** What he can make (a drink needs his machine and cups, a cookie his pile). */
  can(item: MenuItem) {
    if (item.cup === 'cookie') return !!(this.p.cookies && this.p.pile);
    const stack = item.cup === 'espresso' ? 'cups_espresso' : item.cup === 'iced' ? 'cups_iced' : 'cups';
    return !!(this.p.coffee && this.p[stack] && this.p.fill);
  }
  get busy() {
    return this.a.busy;
  }
  get position() {
    return this.a.position;
  }
  /** What he is making (for the page). */
  get making() {
    return this.busyWith;
  }

  /** Makes a menu item into `prop` (its cup, or the cookie), and hands it over as `to` says. */
  order(item: MenuItem, prop: THREE.Object3D, scene: THREE.Object3D, to: Handoff) {
    if (!this.can(item) || this.busy) return false;
    this.busyWith = item;
    const a = this.a;
    const P = this.p;
    if (item.cup === 'cookie') {
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
    } else this.recipe(item, prop as Drink, scene);
    // back to the counter, up to its edge, and holding it out (they pay first)
    const serve = (): THREE.Vector3 => this.home.at.clone().add(new THREE.Vector3(Math.sin(this.home.yaw), 0, Math.cos(this.home.yaw)).multiplyScalar(0.17));
    const pay: Pay | undefined = to.pay;
    a.then(
      ...a.walkTo(serve),
      a.face(() => this.home.yaw),
      ...a.handOver('R', to.meet, to.taken, () => P.handout!.at, to.placed, 8, pay),
      { run: () => ((this.busyWith = null), true) },
    );
    // the money in the till
    if (pay && this.drawer) a.then(...Actor.onlyIf(() => a.held.L?.kind === 'cash', this.till()));
    a.then(...a.walkTo(() => this.home.at), a.face(() => this.home.yaw));
    return true;
  }

  // ---------- making a drink ----------

  /** The steps of a drink, done in order: the cup goes where each is done (the machine, or the window counter). */
  private recipe(item: MenuItem, cup: Drink, scene: THREE.Object3D) {
    const a = this.a;
    const P = this.p;
    const make = cup.userData.make;
    const stack = P[item.cup === 'espresso' ? 'cups_espresso' : item.cup === 'iced' ? 'cups_iced' : 'cups']!;
    // the top cup of its stack (empty), its print toward the visitor
    a.then({
      run: () => {
        cup.position.copy(stack.at);
        cup.quaternion.setFromAxisAngle(Y, Math.PI / 2);
        scene.add(cup);
        cup.updateMatrixWorld(true);
        return true;
      },
    });
    a.then(...a.take('R', cup, 'coffee', 0.15));
    // where each step is done
    const site = (s: MakeStep): 'cold' | 'fill' | 'water' | 'jug' => (s.s === 'shot' || s.s === 'steam' ? 'fill' : s.s === 'water' ? 'water' : s.s === 'syrup' && s.into === 'jug' ? 'jug' : 'cold');
    const spot = (w: 'cold' | 'fill' | 'water') => (w === 'cold' ? P.cold : w === 'fill' ? P.fill : P.water_cup) ?? P.fill!;
    let where: 'hand' | 'cold' | 'fill' | 'water' = 'hand';
    const putCup = (w: 'cold' | 'fill' | 'water') => {
      if (where === w) return;
      if (where !== 'hand') a.then(...a.take('R', cup, 'coffee', 0.15));
      a.then(...a.place('R', () => spot(w).at.clone(), 0.18));
      where = w;
    };
    const rim = () => cup.userData.rim();
    let jugColour: string | null = null;
    // the cup goes down first where its first step is done (the blender's steps leave it waiting by the window)
    const first = item.make.map(site).find((w) => w !== 'jug');
    putCup(first === 'fill' || first === 'water' ? first : 'cold');
    for (const st of item.make) {
      const w = site(st);
      if (w !== 'jug') putCup(w);
      switch (st.s) {
        case 'syrup':
        case 'pour': {
          const into = w === 'jug' ? () => this.jugRim() : rim;
          this.useProp(st.b, into, 1.4, (k) => {
            if (w === 'jug') {
              jugColour = st.c;
              this.fillJug(st.c, Math.min(0.55, 0.15 + k * 0.2));
            } else {
              make.pour(st.c, st.to, k);
              if (st.s === 'pour' && st.mix) make.mix(st.mix, k);
              if (st.s === 'pour' && st.foam && k >= 1) make.foam(st.foam);
            }
          });
          break;
        }
        case 'ice':
          this.useProp('scoop', rim, 0.8, (k) => k > 0.3 && make.ice(), () => P.ice?.at ?? null);
          break;
        case 'shot':
        case 'water': {
          // a hand on the group head's button (or the tap), the stream into the cup
          const spout = st.s === 'shot' ? P.shot : P.water;
          const at = spot(st.s === 'shot' ? 'fill' : 'water');
          const time = st.s === 'shot' ? 2.2 + 0.8 * ((st.n ?? 1) - 1) : 1.6;
          a.then(...a.approach(() => at.at));
          // the group head's button above its spout; the tap's knob above it
          const knob = st.s === 'shot' ? new THREE.Vector3(0, 0.137, -0.035) : new THREE.Vector3(0, 0.09, -0.03);
          a.then(a.reach('L', () => (spout?.at ?? at.at).clone().add(knob), { limit: 1.2 }), {
            limit: time + 0.3,
            start: () => {
              this.a.ch.look(at.at);
            },
            run: (_dt, t) => {
              const k = Math.min(1, t / time);
              const from = (spout?.at ?? rim()).clone();
              const into = cup.localToWorld(new THREE.Vector3(0, Math.max(0.004, cup.userData.level() * (cup.userData.hold.y / 0.48)), 0));
              this.streamOn = { from, to: into, color: st.c, r: st.s === 'shot' ? 0.0022 : 0.003 };
              make.pour(st.c, st.to, k);
              if (st.s === 'shot' && st.mix) make.mix(st.mix, k);
              return t >= time;
            },
            end: () => {
              this.streamOn = null;
              this.a.ch.look(null);
            },
          });
          a.then(a.release('L'));
          break;
        }
        case 'steam': {
          // the milk steamed in the pitcher at the wand, then poured into the cup: its pattern on top
          const pitcher = this.props.get('pitcher');
          if (!pitcher) {
            a.then({ limit: 2, run: (_d, t) => (make.pour(st.c, st.to, t / 1.8), t > 1.8) });
            if (st.art) a.then({ run: () => (make.art(st.art!, st.artC ?? '#f6f1e8'), true) });
            break;
          }
          a.then(...a.take('R', pitcher.o, 'pitcher', 0.15));
          a.then(
            a.reach('R', () => (P.wand?.at ?? P.fill!.at).clone().add(new THREE.Vector3(0, -0.03, 0)), { socket: 'grip', quat: () => a.holdQuat('R', 'pitcher'), limit: 1.6 }),
            {
              limit: 2.6,
              start: () => (this.steaming = true),
              run: (_d, t) => {
                a.ch.reach.R = { at: (P.wand?.at ?? P.fill!.at).clone().add(new THREE.Vector3(Math.sin(t * 9) * 0.004, -0.03 - Math.sin(t * 2) * 0.006, 0)), quat: a.holdQuat('R', 'pitcher'), socket: 'grip', weight: 1 };
                return t > 2.4;
              },
              end: () => (this.steaming = false),
            },
          );
          a.then(
            ...a.pour('R', rim, 1.8, (k, mouth) => {
              this.streamOn = k < 1 ? { from: mouth, to: rim().add(new THREE.Vector3(0, -0.02, 0)), color: st.c, r: 0.004 } : null;
              make.pour(st.c, st.to, k);
              if (k >= 1 && st.art) make.art(st.art, st.artC ?? '#f6f1e8');
            }),
            { run: () => ((this.streamOn = null), true) },
          );
          a.then(...a.place('R', () => pitcher.home.clone(), 0.15));
          break;
        }
        case 'blend': {
          // the blender runs (what is in the jug turns), then the jug is poured into the cup
          const jug = this.props.get('jug');
          const colour = st.c;
          a.then(...a.approach(() => P.blender?.at ?? rim()));
          a.then(a.reach('L', () => (P.blender?.at ?? rim()).clone().add(new THREE.Vector3(-0.07, -0.05, 0)), { limit: 1.2 }), {
            limit: 2.4,
            run: (_d, t) => {
              this.fillJug(jugColour ? new THREE.Color(jugColour).lerp(new THREE.Color(colour), Math.min(1, t / 1.5)).getStyle() : colour, 0.55, t * 30);
              return t > 2.2;
            },
          });
          a.then(a.release('L'));
          if (jug) {
            a.then(...a.take('R', jug.o, 'jug', 0.15));
            a.then(
              ...a.pour('R', rim, 1.6, (k, mouth) => {
                this.streamOn = k < 1 ? { from: mouth, to: rim().add(new THREE.Vector3(0, -0.03, 0)), color: colour, r: 0.006 } : null;
                make.pour(colour, st.to, k);
                this.fillJug(colour, 0.55 * (1 - k));
              }),
              { run: () => ((this.streamOn = null), true) },
            );
            a.then(...a.place('R', () => jug.home.clone(), 0.15));
          } else a.then({ limit: 1.6, run: (_d, t) => (make.pour(colour, st.to, t / 1.5), t > 1.5) });
          jugColour = null;
          break;
        }
        case 'top': {
          if (st.b && this.props.has(st.b)) {
            // a dusting, crumbs or a drizzle: from its shaker, jar or bottle
            this.useProp(st.b, rim, 1.0, (k) => k >= 1 && make.top(st.g, st.c));
          } else {
            // a slice or mint from the tray: picked up, laid on top
            const from = P[`garnish_${st.g === 'lemon' ? 'lemon' : st.g === 'mint' ? 'mint' : 'lime'}` as PlaceName];
            if (!from) {
              a.then({ run: () => (make.top(st.g, st.c), true) });
              break;
            }
            const piece = makeGarnish(st.g);
            a.then({
              run: () => {
                piece.position.copy(from.at);
                scene.add(piece);
                piece.updateMatrixWorld(true);
                return true;
              },
            });
            a.then(...a.take('R', piece, 'cookie', 0.2));
            // held over the cup, let go: it drops onto the top
            a.then(
              ...a.approach(rim),
              a.reach('R', () => rim().add(new THREE.Vector3(0, 0.03, 0)), { socket: 'pinch', quat: () => a.holdQuat('R', 'cookie'), limit: 2 }),
              {
                run: () => {
                  logContact(`garnish ${st.g}`, 'BARISTA', a.ch.socket('R', 'pinch').getWorldPosition(new THREE.Vector3()).distanceTo(rim().add(new THREE.Vector3(0, 0.03, 0))));
                  a.held.R = null;
                  a.ch.hand.R = 'relaxed';
                  piece.removeFromParent();
                  make.top(st.g, st.c);
                  return true;
                },
              },
              a.release('R'),
            );
          }
          break;
        }
      }
    }
    // the finished drink, taken up to serve
    a.then(...a.take('R', cup, 'coffee', 0.15));
  }

  /** Takes a bottle (or the scoop) from its place, (dips the scoop in the ice), tips it over `into`, puts it back. */
  private useProp(key: string, into: () => THREE.Vector3, time: number, flow: (k: number) => void, dipAt?: () => THREE.Vector3 | null) {
    const a = this.a;
    const it = this.props.get(key);
    if (!it) {
      // no such bottle in this café: the step happens without it
      a.then({ limit: time, run: (_d, t) => (flow(Math.min(1, t / time)), t >= time) });
      return;
    }
    a.then(...a.take('R', it.o, it.kind, 0.2));
    const dip = dipAt?.();
    if (dip) a.then(a.reach('R', () => dip.clone().add(new THREE.Vector3(0.02, 0.01, 0)), { socket: 'grip', quat: () => a.holdQuat('R', it.kind), limit: 1.4 }), { run: (_d, t) => t > 0.35 });
    const color = (it.o.userData as { color?: string }).color ?? '#cccccc';
    a.then(
      ...a.pour('R', into, time, (k, mouth) => {
        this.streamOn = k < 1 && key !== 'scoop' ? { from: mouth, to: into().add(new THREE.Vector3(0, -0.03, 0)), color, r: 0.0025 } : null;
        flow(k);
      }),
      { run: () => ((this.streamOn = null), true) },
    );
    a.then(...a.place('R', () => it.home.clone(), 0.2));
  }

  private jugRim() {
    const jug = this.props.get('jug');
    return jug ? jug.o.localToWorld(new THREE.Vector3(0, 0.2, 0)) : (this.p.blender?.at.clone() ?? this.position);
  }
  /** What is in the blender's jug: a colour, up to `level` of it (0…1 of its 0.2 m), turning when it blends. */
  private fillJug(c: string, level: number, spin = 0) {
    const f = this.jugFill;
    if (!f) return;
    f.visible = level > 0.01;
    const h = 0.2 * level;
    f.scale.set(0.95, Math.max(0.001, h), 0.95);
    f.position.y = 0.004 + h / 2;
    f.rotation.y = spin;
    (f.material as THREE.MeshStandardMaterial).color.set(c);
  }

  /** The money into the till: the drawer slides out, the notes go in it, it slides shut. */
  private till(): Step[] {
    const a = this.a;
    const d = this.drawer!;
    const front = () => d.o.localToWorld(new THREE.Vector3(0, 0.024, 0.104));
    let k = 0;
    return [
      ...a.approach(() => front()),
      a.reach('R', front, { limit: 1.2 }),
      {
        limit: 1,
        run: (dt) => {
          k = Math.min(1, k + dt / 0.5);
          d.o.position.lerpVectors(d.closed, d.open, k);
          a.ch.reach.R = { at: front(), weight: 1 };
          return k >= 1;
        },
      },
      ...a.putAway('L', () => d.o.localToWorld(d.money.clone()), (prop) => {
        // the notes lie in the drawer (and go with it)
        d.o.attach(prop);
        prop.position.copy(d.money);
        prop.rotation.set(-Math.PI / 2, 0, 0);
      }),
      a.reach('R', front, { limit: 1 }),
      {
        limit: 1,
        run: (dt) => {
          k = Math.max(0, k - dt / 0.5);
          d.o.position.lerpVectors(d.closed, d.open, k);
          a.ch.reach.R = { at: front(), weight: 1 };
          if (k <= 0) {
            // shut: the money is in the till
            for (const c of [...d.o.children].slice(3)) c.removeFromParent();
            return true;
          }
          return false;
        },
      },
      a.release('R'),
    ];
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
    if (a.held.R && !this.steaming && !a.held.R.tilt && a.held.R.kind === 'coffee') a.carry('R');
    const here = a.position;
    const far = Math.hypot(viewer.x - here.x, viewer.z - here.z);
    // he looks at a visitor near him while not at work
    if (!this.busyWith) a.ch.look(far < 4.5 ? viewer : null);
    a.ch.brows = far < 2.5 ? 0.6 : 0;
    a.update(dt);
    this.steam(dt);
    this.drawStream();
    const active = a.busy || this.puffs.length > 0;
    return active || (far < 10 && seen(here));
  }

  private drawStream() {
    const s = this.streamOn;
    this.stream.visible = !!s;
    if (!s) return;
    const d = s.to.clone().sub(s.from);
    const len = d.length();
    if (len < 0.003) {
      this.stream.visible = false;
      return;
    }
    this.stream.position.copy(s.from).addScaledVector(d, 0.5);
    this.stream.quaternion.setFromUnitVectors(Y, d.normalize());
    this.stream.scale.set(s.r, len, s.r);
    (this.stream.material as THREE.MeshStandardMaterial).color.set(s.color);
  }

  private steam(dt: number) {
    const at = this.p.steam?.at;
    if (this.steaming && at && this.time > this.nextPuff) {
      this.nextPuff = this.time + 0.1;
      const m = new THREE.Mesh(this.puffGeo, this.puffMat.clone());
      m.position.copy(at).add(new THREE.Vector3((Math.random() - 0.5) * 0.06, 0, (Math.random() - 0.5) * 0.06));
      m.scale.setScalar(0.5);
      this.a.ch.root.parent!.add(m);
      this.puffs.push({ m, age: 0 });
    }
    for (const p of this.puffs) {
      p.age += dt;
      p.m.position.y += dt * 0.22;
      p.m.scale.setScalar(0.5 + p.age * 1.4);
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
    this.stream.removeFromParent();
    this.stream.geometry.dispose();
    this.puffGeo.dispose();
    this.puffMat.dispose();
  }
}
