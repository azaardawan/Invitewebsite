/**
 * What a visitor has in a café's tour (owner, 2026-11-23; rebuilt 2026-11-24 with the character and NPC interaction
 * skills, and KOUP's menu): anything on the café's menu (a drink in its cup, a cookie), in their own hands at the
 * bottom of the picture (drawn over the place, never into a wall), a sip or a bite at a time (`SIPS`, `BITES`), put down
 * on the table by their seat and picked up again; and the money they pay with.
 *
 * Nothing flies: every change of hands is a hand reaching. Ordering at the counter, the barista makes it, comes back
 * and holds out his free hand: the visitor's hand comes up with the notes (the exact price in Iraqi dinars) and puts
 * them in it; then it reaches what he holds out, the fingers close, and only then is it theirs (it doesn't move as it
 * changes hands). Seated, they order from the paper menu on their table: the waiter comes for the order, fetches it
 * from the barista and brings it; they pay him the same way. The visitor's hands are in the picture's own space (the
 * camera's); a world point reached is converted to it each frame (the hand meets the thing where it is seen).
 */
import * as THREE from 'three';
import { Barista } from './barista';
import { Cleaner, type SeatSpot, type SurfaceAt } from './staff';
import { BITES, SIPS, disposeProp, makeCookie, makeFPHand, type Cookie, type FPHand } from './props';
import { makeCash, makeDrink, type Cash, type Drink } from './drink';
import { holdingQuat } from './character';
import { Actor, CONTACTS, HOLD, holdAt, logContact, type Pay } from './interaction';
import { approach } from './ik';
import { notesFor, readMenu, slotOf, type Menu, type MenuItem } from './menu';

export type Treat = 'coffee' | 'cookie';
type Where = 'staff' | 'reaching' | 'hand' | 'placing' | 'table' | 'offering';
type Held = {
  kind: Treat | 'cash';
  /** What it is (on the menu). */
  item: MenuItem | null;
  /** Sips (or bites) left. */
  left: number;
  where: Where;
  prop: Drink | Cookie | Cash;
  /** The visitor's hand holding it (or reaching for it), and which hand. */
  hand: FPHand | null;
  side: 1 | -1 | 0;
  /** Where the hand's holding point is now (camera space), and how the thing is turned there (camera space). */
  grip: THREE.Vector3;
  itemQ: THREE.Quaternion;
  /** A world point the hand is reaching (to take it there, or to put it down there). */
  target: (() => THREE.Vector3) | null;
  /** Putting down: where its base goes, and how it is turned there (world). */
  place: { at: THREE.Vector3; q: THREE.Quaternion } | null;
  /** A sip or a bite under way (0…1). */
  act: number | null;
  acted: boolean;
  /** Finished (empty, eaten): going out of the picture, then gone. */
  done: number | null;
};

/** Where each hand holds things in the picture (camera space: its holding point), and how the hand is turned. */
const SLOT = {
  1: new THREE.Vector3(0.19, -0.17, -0.46),
  [-1]: new THREE.Vector3(-0.19, -0.16, -0.46),
} as const;
/** The holding point at the mouth (a sip, a bite): for a cup whose rim is 4.3 cm above where it is held. */
const MOUTH: Record<Treat, THREE.Vector3> = { coffee: new THREE.Vector3(0.025, -0.06, -0.2), cookie: new THREE.Vector3(0.0, -0.045, -0.165) };
const DOWN = new THREE.Vector3(0, -0.42, 0.05);
const ACT_TIME = 1.25;
/** How far a visitor's hand reaches from their eye (metres). */
const REACH = 0.9;
/** A hand's contact: within this of where it reaches (metres). */
const TOUCH = 0.02;
const Y = new THREE.Vector3(0, 1, 0);
const TURN = new THREE.Quaternion().setFromAxisAngle(Y, Math.PI); // the body's frame (+Z ahead) to the camera's (−Z)

const bell = (k: number) => Math.sin(Math.PI * Math.min(1, Math.max(0, k)));

/** A café without a menu in its model: a coffee and a cookie (as before menus; nothing to pay). */
const PLAIN: Menu = {
  currency: 'IQD',
  cell: 0,
  cols: 1,
  categories: [{ id: 'all', label: '' }],
  bottles: {},
  items: [
    { id: 1, cat: 'all', name: 'Latte', price: 0, cup: 'hot', photo: -1, make: [{ s: 'shot', c: '#4a2716', to: 0.25 }, { s: 'steam', c: '#ddc8b3', to: 0.9, art: 'heart', artC: '#f6f1e8' }], look: { ring: '#9b6a42' } },
    { id: 2, cat: 'all', name: 'Cookie', price: 0, cup: 'cookie', photo: -1, make: [] },
  ],
};

export type OrderState = { item: MenuItem; price: number; stage: 'making' | 'pay' | 'ready'; by: 'barista' | 'waiter' };

export class Visit {
  readonly barista: Barista | null;
  /** The waiter going round the place, wiping the tables. */
  private cleaner: Cleaner | null;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private hud = new THREE.Scene();
  private hudCam = new THREE.PerspectiveCamera(70, 1, 0.01, 10);
  private items: Record<Treat, Held | null> = { coffee: null, cookie: null };
  /** The money in the visitor's hand, paying. */
  private cash: Held | null = null;
  /** A hand that just paid, open, waiting to take the order (it reaches for it next). */
  private spare: { hand: FPHand; side: 1 | -1; grip: THREE.Vector3 } | null = null;
  /** Hands going back down after letting something go. */
  private leaving: { hand: FPHand; t: number }[] = [];
  private crumbs: { m: THREE.Mesh; v: THREE.Vector3; age: number }[] = [];
  private crumbGeo = new THREE.SphereGeometry(0.0035, 6, 4);
  private crumbMat = new THREE.MeshStandardMaterial({ color: '#c68a4c', roughness: 0.9 });
  private bob = 0;
  /** The order under way (for the page). */
  private current: OrderState | null = null;
  /** The waiter serving the seated visitor: on his way, here for the order, fetching it, bringing it. */
  private waiter: 'coming' | 'here' | 'fetching' | 'bringing' | null = null;
  private waiterSpot: SeatSpot | null = null;
  private waiterTable: THREE.Vector3 | null = null;
  /** What the seated visitor asked the waiter for (chosen on the paper menu before he came). */
  private waiterWants: MenuItem | null = null;
  /** Somewhere the visitor's eyes turn to (the waiter's face, when he comes to their seat). */
  lookAt: THREE.Vector3 | null = null;
  /** An order waiting at the counter for the barista to be free. */
  private pending: { item: MenuItem; prop: Drink | Cookie } | null = null;
  /** Whether the visitor is seated (the waiter hands it to them only then). */
  seated = false;
  /** The café's menu (and its photos, a picture's address), or the plain coffee and cookie. */
  readonly menu: Menu;
  readonly photos: string | null;
  private v = new THREE.Vector3();
  private frustum = new THREE.Frustum();
  private m4 = new THREE.Matrix4();
  private sphere = new THREE.Sphere();

  /** The debug view (`?debug=1`): each hand's socket (green) and where it reaches (red), and the contacts' errors. */
  private debug: THREE.Mesh[] | null = null;

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera, env: THREE.Texture | null, surface: SurfaceAt, debug = false) {
    this.scene = scene;
    this.camera = camera;
    this.barista = Barista.find(scene);
    this.cleaner = Cleaner.find(scene, surface);
    const m = readMenu(scene);
    this.menu = m?.menu ?? PLAIN;
    this.photos = m?.photos ?? null;
    this.hud.environment = env;
    this.hud.environmentIntensity = 0.75;
    this.hud.add(new THREE.HemisphereLight(0xfff6ee, 0x8a8178, 0.5));
    const sun = new THREE.DirectionalLight(0xfff1e2, 0.8);
    sun.position.set(0.4, 1, 0.6);
    this.hud.add(sun);
    if (debug) {
      const geo = new THREE.SphereGeometry(0.012, 8, 6);
      const green = new THREE.MeshBasicMaterial({ color: '#19c25a', depthTest: false });
      const red = new THREE.MeshBasicMaterial({ color: '#e0342c', depthTest: false });
      this.debug = Array.from({ length: 8 }, (_, i) => {
        const m = new THREE.Mesh(geo, i % 2 ? red : green);
        m.renderOrder = 20;
        scene.add(m);
        return m;
      });
      (window as unknown as { tourContacts: typeof CONTACTS }).tourContacts = CONTACTS;
    }
  }

  // ---------- what the page shows ----------

  /** What the visitor has, for the page's buttons. `near`: where the visitor's eye is. */
  state(near: THREE.Vector3) {
    const one = (k: Treat) => {
      const h = this.items[k];
      if (!h || h.done !== null || (h.where !== 'hand' && h.where !== 'table')) return null;
      const p = Actor.holdPoint(h.prop, k);
      const reach = h.where === 'table' && p.distanceTo(near) < REACH;
      return { left: h.left, where: h.where as 'hand' | 'table', reach, name: h.item?.name ?? '' };
    };
    const busy = Object.values(this.items).some((h) => h && (h.act !== null || h.where === 'reaching' || h.where === 'placing'));
    return {
      order: this.current,
      coffee: one('coffee'),
      cookie: one('cookie'),
      busy,
      serving: !!this.barista,
      waiter: this.waiter,
    };
  }

  // ---------- the barista ----------

  private slotFree(item: MenuItem) {
    const h = this.items[slotOf(item)];
    return !h || h.where === 'table' || h.done !== null;
  }

  /** Whether the barista can be asked for it now (he is free, nothing else is on its way, the hand for it is free). */
  canOrder(item: MenuItem) {
    return !!this.barista?.can(item) && !this.barista.busy && !this.current && !this.pending && !this.waiter && this.slotFree(item);
  }

  order(id: number) {
    const item = this.menu.items.find((i) => i.id === id);
    if (!item || !this.canOrder(item) || !this.barista) return false;
    const slot = slotOf(item);
    const old = this.items[slot];
    if (old) this.drop(old);
    const prop = this.makeProp(item);
    this.current = { item, price: item.price, stage: 'making', by: 'barista' };
    const ok = this.barista.order(item, prop, this.scene, {
      // over the counter's middle, if the visitor is near enough to reach it; else he puts it on the counter
      meet: () => this.counterMeet('R', slot),
      taken: (p, at) => this.receive(slot, item, p as Drink | Cookie, at),
      placed: (p) => {
        this.current = null;
        this.payDone();
        this.items[slot] = this.held(slot, item, p as Drink | Cookie, 'table');
      },
      pay: item.price > 0 ? this.payment(item, () => this.counterMeet('L', slot)) : undefined,
    });
    if (!ok) this.current = null;
    return ok;
  }

  private makeProp(item: MenuItem): Drink | Cookie {
    return item.cup === 'cookie' ? makeCookie() : makeDrink(item.cup, item.look);
  }

  /**
   * Where two hands meet to pass something: part of the way from the giver's shoulder to the visitor's hand at rest, so
   * both can reach it (null when they are too far apart: each arm reaches about 0.6 m).
   */
  private meetBetween(shoulder: THREE.Vector3, side: 1 | -1): THREE.Vector3 | null {
    const hand = this.camera.localToWorld(SLOT[side].clone());
    const d = shoulder.distanceTo(hand);
    if (d > 1.15) return null;
    const meet = shoulder.clone().lerp(hand, 0.5);
    // a little below both: the giver's hand comes forward and down, the visitor's up
    meet.y = Math.min(meet.y, shoulder.y - 0.18);
    return meet;
  }

  /** Where the visitor's hand meets the barista's (his `side` hand) over the counter (null: too far). */
  private counterMeet(side: 'L' | 'R', slot: Treat): THREE.Vector3 | null {
    if (!this.barista || this.seated) return null;
    return this.meetBetween(this.barista.character.shoulder(side), this.sideFor(slot));
  }

  /**
   * Paying for `item`: when the giver holds out his hand (`meet()`), the visitor's hand (the one that will take the
   * order) comes up with the notes and puts them in it.
   */
  private payment(item: MenuItem, meet: () => THREE.Vector3 | null): Pay {
    return {
      meet: () => {
        const at = meet();
        if (at && this.current) {
          this.current.stage = 'pay';
          if (!this.cash) this.takeOutMoney(item);
          if (this.cash && this.cash.where !== 'offering') {
            const target = at.clone();
            this.cash.where = 'reaching';
            this.cash.target = () => target;
          }
        }
        return at;
      },
      given: (at) => {
        const c = this.cash;
        if (!c || c.where !== 'offering') return null;
        // the notes are in his fingers: his now, exactly where they are (from the picture's space to the place's)
        if (this.camera.localToWorld(c.grip.clone()).distanceTo(at) > TOUCH * 2) return null;
        const worldQ = this.camera.quaternion.clone().multiply(c.prop.quaternion);
        const worldP = this.camera.localToWorld(c.prop.position.clone());
        c.prop.removeFromParent();
        this.scene.add(c.prop);
        c.prop.position.copy(worldP);
        c.prop.quaternion.copy(worldQ);
        c.prop.updateMatrixWorld(true);
        logContact('visitor pays', 'VISITOR', this.camera.localToWorld(c.grip.clone()).distanceTo(at));
        // the hand stays up, open, to take the order next
        if (c.hand) this.spare = { hand: c.hand, side: c.side as 1 | -1, grip: c.grip.clone() };
        this.cash = null;
        if (this.current) this.current.stage = 'ready';
        return c.prop;
      },
    };
  }

  /** The visitor's hand comes up from below with the money for `item`. */
  private takeOutMoney(item: MenuItem) {
    const cash = makeCash(notesFor(item.price));
    const h: Held = this.held('cash', item, cash, 'hand');
    this.hud.add(cash);
    h.side = this.sideFor(slotOf(item));
    const hand = makeFPHand(h.side === 1);
    this.hud.add(hand);
    h.hand = hand;
    h.grip.copy(SLOT[h.side]).add(DOWN);
    this.cash = h;
  }
  /** Paying is over (paid, or he put it down instead): the money goes back in the pocket. */
  private payDone() {
    if (this.cash) {
      if (this.cash.hand) this.leaving.push({ hand: this.cash.hand, t: 0 });
      disposeProp(this.cash.prop);
      this.cash = null;
    }
    if (this.spare) {
      this.leaving.push({ hand: this.spare.hand, t: 0 });
      this.spare = null;
    }
  }

  // ---------- the waiter ----------

  /** Whether the waiter can come to this seat at all. */
  canServe(spot: SeatSpot | null) {
    return !!this.cleaner?.canServe(spot);
  }

  canCallWaiter(spot: SeatSpot | null) {
    return !!this.cleaner?.canServe(spot) && !this.waiter && !this.current;
  }

  /**
   * The seated visitor orders from the paper menu: the waiter comes to their seat for the order (`table`: their
   * table's spot), fetches it from the barista and brings it.
   */
  callWaiter(spot: SeatSpot, table: THREE.Vector3 | null, id?: number) {
    const item = id === undefined ? null : (this.menu.items.find((i) => i.id === id) ?? null);
    if (!this.cleaner || !this.canCallWaiter(spot) || (item && !this.slotFree(item))) return false;
    this.waiter = 'coming';
    this.waiterSpot = spot;
    this.waiterTable = table;
    this.waiterWants = item;
    if (item) this.current = { item, price: item.price, stage: 'making', by: 'waiter' };
    this.cleaner.summon(spot, () => {
      if (this.waiter !== 'coming') return;
      this.waiter = 'here';
      this.lookAt = this.cleaner!.facePosition();
      // he takes the order (a nod), then goes for it
      if (this.waiterWants) {
        const want = this.waiterWants;
        this.cleaner!.nod(() => this.waiterOrder(want.id));
      }
    });
    return true;
  }

  dismissWaiter() {
    if (this.waiter !== 'coming' && this.waiter !== 'here') return;
    this.waiter = null;
    this.waiterSpot = null;
    this.waiterWants = null;
    this.current = null;
    this.cleaner?.resume();
  }

  /** The order, given to the waiter at the seat: he fetches it at the counter (the barista makes it) and brings it. */
  waiterOrder(id: number) {
    const item = this.menu.items.find((i) => i.id === id);
    const spot = this.waiterSpot;
    if (!item || this.waiter !== 'here' || !spot || !this.cleaner || !this.slotFree(item)) return false;
    this.waiter = 'fetching';
    this.waiterWants = null;
    this.current = { item, price: item.price, stage: 'making', by: 'waiter' };
    this.cleaner.fetch(() => {
      this.pending = { item, prop: this.makeProp(item) };
    });
    return true;
  }

  /** At the counter: the barista makes the waiter's order when he is free, and hands it to him over the counter. */
  private serveCounter() {
    const p = this.pending;
    const cleaner = this.cleaner;
    if (!p || !cleaner) return;
    const kind = slotOf(p.item);
    const bring = () => {
      this.waiter = 'bringing';
      this.bring(p.item);
    };
    if (this.barista?.can(p.item)) {
      if (this.barista.busy) return;
      this.pending = null;
      this.barista.order(p.item, p.prop, this.scene, {
        meet: () => cleaner.meetAtCounter(this.barista!.position),
        taken: (prop, at) => {
          const ok = cleaner.receive(prop, kind, at);
          if (ok) bring();
          return ok;
        },
        // not taken in time: on the counter; he picks it up from there
        placed: (prop) => {
          cleaner.pick(prop, kind);
          bring();
        },
      });
    } else {
      // no barista: it is waiting on the counter, in front of him
      this.pending = null;
      p.prop.position.copy(cleaner.meetAtCounter()).setY(cleaner.meetAtCounter().y - 0.16);
      this.scene.add(p.prop);
      cleaner.pick(p.prop, kind);
      bring();
    }
  }

  private bring(item: MenuItem) {
    const spot = this.waiterSpot!;
    const slot = slotOf(item);
    this.cleaner!.bring(
      spot,
      () => this.seatMeet('R', slot),
      (p, at) => this.receive(slot, item, p as Drink | Cookie, at),
      () => this.waiterTable ?? spot.seat.clone().setY(spot.stand.y + 0.72),
      (placed) => {
        this.waiter = null;
        this.waiterSpot = null;
        this.current = null;
        this.payDone();
        if (placed) this.items[slot] = this.held(slot, item, placed as Drink | Cookie, 'table');
      },
      item.price > 0 ? this.payment(item, () => this.seatMeet('L', slot)) : undefined,
    );
  }

  /** Where the seated visitor's hand meets the waiter's (`side` hand). */
  private seatMeet(side: 'L' | 'R', slot: Treat): THREE.Vector3 | null {
    if (!this.seated || !this.cleaner) return null;
    return this.meetBetween(this.cleaner.character.shoulder(side), this.sideFor(slot));
  }

  // ---------- the visitor's hands ----------

  private held(kind: Treat | 'cash', item: MenuItem | null, prop: Drink | Cookie | Cash, where: Where): Held {
    return { kind, item, left: kind === 'coffee' ? SIPS : BITES, where, prop, hand: null, side: 0, grip: new THREE.Vector3(), itemQ: new THREE.Quaternion(), target: null, place: null, act: null, acted: false, done: null };
  }

  /** Which hand: the right, or the left for the cookie when a drink is in the right (owner: "a second hand"). */
  private sideFor(kind: Treat): 1 | -1 {
    const other = this.items[kind === 'coffee' ? 'cookie' : 'coffee'];
    const both = other && other.hand && other.done === null && (other.where === 'hand' || other.where === 'reaching' || other.where === 'placing');
    return both && kind === 'cookie' ? -1 : 1;
  }

  /** A hand (for side `side`) for this item: the one that just paid, or one coming up from below the picture. */
  private newHand(h: Held) {
    const side = this.sideFor(h.kind as Treat);
    if (this.spare && this.spare.side === side) {
      h.hand = this.spare.hand;
      h.grip.copy(this.spare.grip);
      this.spare = null;
    } else {
      h.hand = makeFPHand(side === 1);
      this.hud.add(h.hand);
      h.grip.copy(SLOT[side]).add(DOWN);
    }
    h.side = side;
    h.itemQ.identity();
  }

  /**
   * The visitor's hand taking `prop` held out at `at` (world), called each frame by the giver: the hand reaches it,
   * the fingers close; true once it is in the hand (it is the visitor's then).
   */
  private receive(kind: Treat, item: MenuItem, prop: Drink | Cookie, at: THREE.Vector3) {
    if (this.cash) return false; // paying first
    let h = this.items[kind];
    if (!h || h.prop !== prop) {
      if (h) this.drop(h);
      h = this.held(kind, item, prop, 'reaching');
      this.items[kind] = h;
    }
    if (h.where === 'hand') {
      this.current = null;
      return true;
    }
    if (!h.hand) this.newHand(h);
    const target = at.clone();
    h.target = () => target;
    return false;
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

  /** Puts it down at `spot` (a table by the seat; the cookie beside the drink, `side` along the table's edge). */
  putDown(kind: Treat, spot: THREE.Vector3, side: THREE.Vector3) {
    const h = this.items[kind];
    if (!h || h.where !== 'hand' || h.act !== null || h.done !== null) return false;
    const at = spot.clone();
    const q = new THREE.Quaternion();
    if (kind === 'cookie') {
      at.addScaledVector(side, 0.14).y += 0.0075;
      q.setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0.4));
    } else q.setFromAxisAngle(Y, Math.atan2(side.x, side.z));
    h.where = 'placing';
    h.place = { at, q };
    h.target = () => holdAt(h.prop, kind).applyQuaternion(q).add(at);
    return true;
  }

  /** Picks it up from the table: the hand reaches it there. */
  pickUp(kind: Treat) {
    const h = this.items[kind];
    if (!h || h.where !== 'table') return false;
    h.where = 'reaching';
    h.target = () => Actor.holdPoint(h.prop, kind);
    this.newHand(h);
    return true;
  }

  /** Gone for good (finished, or cleared from a table). */
  private drop(h: Held) {
    disposeProp(h.prop);
    if (h.hand) this.disposeHand(h.hand);
    if (h.kind !== 'cash' && this.items[h.kind] === h) this.items[h.kind] = null;
  }
  private disposeHand(hand: FPHand) {
    hand.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) (o as THREE.Mesh).geometry.dispose();
    });
    hand.removeFromParent();
  }

  /**
   * Moves everything on by `dt` (the staff, the hands reaching, sips and bites). `walking`: the hands bob. Returns
   * whether anything moved (the page draws again).
   */
  update(dt: number, walking: boolean): boolean {
    this.camera.updateMatrixWorld();
    // the people move on all the time, but are drawn again only while they are in the picture
    this.frustum.setFromProjectionMatrix(this.m4.multiplyMatrices(this.camera.projectionMatrix, this.camera.matrixWorldInverse));
    const seen = (at: THREE.Vector3) => this.frustum.intersectsSphere(this.sphere.set(this.v.copy(at).setY(at.y + 1), 1.1));
    let moved = this.barista?.update(dt, this.camera.position, seen) ?? false;
    if (this.cleaner?.update(dt, this.camera.position, seen)) moved = true;
    this.serveCounter();
    if (this.waiter || this.pending || this.current) moved = true;
    if (this.debug) {
      const pts = [...(this.barista?.character.debugPoints() ?? []), ...(this.cleaner?.character.debugPoints() ?? [])];
      this.debug.forEach((m, i) => {
        const p = pts[i >> 1];
        const at = p ? (i % 2 ? p.target : p.socket) : null;
        m.visible = !!at;
        if (at) m.position.copy(at);
      });
    }
    if (walking) this.bob += dt * 8;
    if (this.layout(dt, walking)) moved = true;
    for (const l of this.leaving) {
      l.t += dt;
      l.hand.position.addScaledVector(DOWN, dt * 1.6);
    }
    for (const l of this.leaving.filter((x) => x.t > 0.45)) this.disposeHand(l.hand);
    this.leaving = this.leaving.filter((x) => x.t <= 0.45);
    if (this.leaving.length) moved = true;
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

  /** The holding point at the mouth for this drink (a taller cup is held lower, its rim at the lips). */
  private mouthFor(h: Held) {
    const m = MOUTH[h.kind as Treat].clone();
    if (h.kind === 'coffee') {
      const d = h.prop as Drink;
      const rimAbove = (d.userData.hold.y / 0.48) * 0.52 - 0.043;
      m.y -= rimAbove * 0.55;
      m.z -= rimAbove * 0.3;
    }
    return m;
  }

  /** Each hand: reaching, holding (a sip, a bite), putting down, paying. Returns whether a hand is still moving. */
  private layout(dt: number, walking: boolean) {
    let moving = false;
    const camQ = this.camera.quaternion;
    // the hand that just paid waits, open, where it let the money go
    if (this.spare) {
      const s = this.spare;
      s.hand.userData.pose('open', dt);
      moving = true;
    }
    for (const h of [...Object.values(this.items), this.cash]) {
      if (!h || !h.hand || (h.where !== 'hand' && h.where !== 'reaching' && h.where !== 'placing' && h.where !== 'offering')) continue;
      const hand = h.hand;
      const sx = hand.userData.sx;
      const hold = HOLD[h.kind];
      let target: THREE.Vector3;
      let wantQ = new THREE.Quaternion();
      let speed = 0.11;
      if (h.where === 'reaching' || h.where === 'placing' || h.where === 'offering') {
        // a world point, where it is seen (the camera's space)
        target = this.camera.worldToLocal(h.target!());
        if (h.where === 'placing') wantQ = camQ.clone().invert().multiply(h.place!.q);
        else wantQ.copy(h.itemQ);
        speed = 0.09;
        hand.userData.pose(h.where === 'reaching' && h.kind !== 'cash' ? 'open' : hold.hand, dt);
      } else {
        target = SLOT[h.side as 1 | -1].clone();
        hand.userData.pose(hold.hand, dt);
        if (h.act !== null && h.kind !== 'cash') {
          h.act = Math.min(1, h.act + dt / ACT_TIME);
          const b = bell(h.act);
          target.lerp(this.mouthFor(h), b);
          // a sip tips the cup's rim to the mouth; a bite turns the cookie's top to it
          wantQ.setFromAxisAngle(new THREE.Vector3(1, 0, 0), (h.kind === 'coffee' ? 1.05 : 0.35) * b);
          speed = 0.04;
          if (!h.acted && h.act >= 0.5) {
            h.acted = true;
            h.left -= 1;
            if (h.kind === 'coffee') (h.prop as Drink).userData.setLevel(h.left / SIPS);
            else {
              (h.prop as Cookie).userData.setBites(BITES - h.left);
              this.crumble(h.grip);
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
      }
      // the holding point and the thing's turn, eased (frame-rate independent)
      h.grip.set(approach(h.grip.x, target.x, dt, speed), approach(h.grip.y, target.y, dt, speed), approach(h.grip.z, target.z, dt, speed));
      h.itemQ.slerp(wantQ, 1 - Math.pow(0.5, dt / 0.1));
      if (h.grip.distanceTo(target) > 0.0005) moving = true;
      // the hand round the holding point: as one holds it (turned with it), its socket on that point
      const handQ = h.itemQ.clone().multiply(TURN).multiply(holdingQuat(sx, h.kind === 'coffee' ? 'cup' : 'cookie'));
      const socket = hold.socket === 'grip' ? hand.userData.grip : hand.userData.pinch;
      hand.quaternion.copy(handQ);
      hand.position.copy(h.grip).sub(socket.clone().applyQuaternion(handQ));
      // the forearm toward the elbow: low, out to the side and a little back (out of the picture)
      const elbow = new THREE.Vector3(-sx * 0.3, -0.52, -0.12).sub(hand.position).applyQuaternion(handQ.clone().invert());
      hand.userData.aim(elbow);
      // the thing in the hand (in the picture's space)
      if (h.where === 'hand' || h.where === 'placing' || h.kind === 'cash') {
        h.prop.quaternion.copy(h.itemQ);
        h.prop.position.copy(h.grip).sub(holdAt(h.prop, h.kind).applyQuaternion(h.itemQ));
      }
      // contact: the hand has reached the thing (take it), the table (let it go), or his hand (the money)
      if ((h.where === 'reaching' || h.where === 'placing') && h.grip.distanceTo(target) < TOUCH) {
        if (h.kind === 'cash') {
          h.where = 'offering';
          continue;
        }
        logContact(`${h.where === 'reaching' ? 'visitor takes' : 'visitor puts down'} ${h.kind}`, 'VISITOR', h.grip.distanceTo(target));
        if (h.where === 'reaching') this.takeIntoHand(h);
        else this.letGo(h);
      }
    }
    return moving;
  }

  /** The fingers have closed on it: it goes into the visitor's hand, exactly where it is (then into the hold). */
  private takeIntoHand(h: Held) {
    const camQ = this.camera.quaternion;
    const worldQ = h.prop.getWorldQuaternion(new THREE.Quaternion());
    h.prop.removeFromParent();
    this.hud.add(h.prop);
    h.itemQ.copy(camQ.clone().invert().multiply(worldQ));
    h.where = 'hand';
    h.target = null;
    // seated (having looked up at the waiter): the eyes come back down to the table
    if (this.seated) {
      const ahead = new THREE.Vector3(0, 0, -1).applyQuaternion(camQ).setY(0).normalize();
      this.lookAt = this.camera.position.clone().add(ahead).add(new THREE.Vector3(0, -0.15, 0));
    }
  }

  /** On the table: it is put where it was set, its base on the top; the hand opens and goes back down. */
  private letGo(h: Held) {
    const p = h.place!;
    h.prop.removeFromParent();
    this.scene.add(h.prop);
    h.prop.position.copy(p.at);
    h.prop.quaternion.copy(p.q);
    h.prop.updateMatrixWorld(true);
    h.where = 'table';
    h.place = null;
    h.target = null;
    if (h.hand) {
      h.hand.userData.pose('open', 0.05);
      this.leaving.push({ hand: h.hand, t: 0 });
      h.hand = null;
    }
    h.side = 0;
  }

  private crumble(at: THREE.Vector3) {
    for (let i = 0; i < 5; i++) {
      const m = new THREE.Mesh(this.crumbGeo, this.crumbMat);
      m.position.copy(at).add(this.v.set((Math.random() - 0.5) * 0.03, 0.035, 0.01));
      this.hud.add(m);
      this.crumbs.push({ m, v: new THREE.Vector3((Math.random() - 0.5) * 0.15, 0.1 + Math.random() * 0.15, 0.05), age: 0 });
    }
  }

  /** Draws the hands over the place (after it): never cut by a wall the visitor stands against. */
  render(renderer: THREE.WebGLRenderer) {
    if (!Object.values(this.items).some((h) => h && h.hand) && !this.cash && !this.spare && !this.leaving.length && !this.crumbs.length) return;
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
    if (this.cash) this.drop(this.cash);
    for (const l of this.leaving) this.disposeHand(l.hand);
    this.barista?.dispose();
    this.crumbGeo.dispose();
    this.crumbMat.dispose();
    if (this.photos) URL.revokeObjectURL(this.photos);
  }
}
