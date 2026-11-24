/**
 * The three.js side of a café's virtual tour (`/tour/<slug>`): loads the café's own model (a `.glb` made in metres,
 * Y up) and lets the visitor walk through it at eye height: the keys or the on-screen pad to walk, dragging to look.
 * The floor is followed (stairs and ramps of steps up to 45 cm), walls stop the visitor and slide them along.
 *
 * The model may name a few things (docs/TOURS.md):
 * - a node `START` (or `SPAWN`): where visitors begin, looking along its −Z (its forward);
 * - meshes whose name begins `NOCOLLIDE`: walked through (plants' leaves, curtains, light beams);
 * - meshes whose name begins `COLLIDER`: invisible walls (kept in the way, never drawn);
 * - nodes named `HOTSPOT_<key>` (e.g. `HOTSPOT_menu` at a counter): within 1.8 m the page is told (`onSpot`);
 * - nodes named `SEAT_<n>` (a seat: its extras give `yaw`, the way a seated visitor faces, `eye`, their eye above the
 *   seat, and `table`, the spot nearest them on a table in reach): «Sit down» there;
 * - a barista (`BARISTA`, see barista.ts) at the counter (`HOTSPOT_counter`): «Get a coffee», «Get a cookie»;
 * - a member of staff going round wiping the tables (`CLEANER` and his round, see staff.ts).
 *
 * Loaded on its own (dynamic import) so only the tour page downloads three.js. It draws only when something changes.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { Visit, type Treat } from './visit';
import type { SeatSpot } from './staff';
import { applyEdit, collectItems, editOf, mergeItems, type Item, type ItemEdit, type TourEdits } from './items';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export type TourOptions = {
  container: HTMLElement;
  model: string;
  reducedMotion: boolean;
  onProgress: (share: number) => void;
  /** The visitor walked up to (or away from) a spot of the model (a node named `HOTSPOT_<key>`, e.g. the menu). */
  onSpot?: (key: string | null) => void;
  /** What the visitor can do (sit, order, sip…) changed: the page's buttons. */
  onActivity?: (a: TourActivity) => void;
  /** The debug view of the staff's hands (sockets, reach targets, contact errors): `?debug=1` on the link. */
  debug?: boolean;
  /** The owner's changes to the model's items (Admin → Tours → the editor), applied when it loads. */
  edits?: TourEdits;
  /**
   * The editor (Admin): the items stay apart, a click picks one (`onSelect`), dragging its handles moves or turns it
   * (`onChange`); the visitor walks through walls.
   */
  editor?: { onSelect: (item: { code: string; label: string } | null) => void; onChange: (code: string, edit: ItemEdit) => void };
};

export type TourTreat = { left: number; where: 'hand' | 'table'; reach: boolean };
export type TourActivity = {
  /** At the counter, the barista free: «Get a coffee», «Get a cookie» (each when it can be asked for). */
  order: { coffee: boolean; cookie: boolean };
  /** What the barista is making. */
  making: Treat | null;
  coffee: TourTreat | null;
  cookie: TourTreat | null;
  /** A seat within reach, or seated. */
  seat: 'near' | 'seated' | null;
  /** Something is under way (a sip, a bite, sitting down…): the buttons wait. */
  busy: boolean;
  /**
   * The waiter, for a seated visitor: «Call the waiter» (`call`), on his way (`coming`), by the seat for the order
   * (`here`, with what can be ordered in `waiterOrder`), fetching or bringing it (`fetching`, `bringing`).
   */
  waiter: 'call' | 'coming' | 'here' | 'fetching' | 'bringing' | null;
  waiterOrder: { coffee: boolean; cookie: boolean };
};
type Seat = { at: THREE.Vector3; yaw: number; eye: number; table: THREE.Vector3 | null; spot: SeatSpot | null };

const EYE = 1.6;
const SPEED = 2.3;
const RADIUS = 0.3;
/** The highest step walked up (a stair), and the deepest walked down. */
const STEP_UP = 0.45;
const STEP_DOWN = 0.7;
const MAX_PIXEL_RATIO = 1.5;
/** The most pixels drawn per frame (a large laptop screen is drawn a little softer, and stays smooth). */
const PIXEL_BUDGET = 2_000_000;
/** Blender's exported lamp strengths, to a room's light (as the museum's lamps). */
const BLENDER_LAMP = 0.0035;
const KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];

const named = (o: THREE.Object3D, prefix: string) => {
  for (let x: THREE.Object3D | null = o; x; x = x.parent) if (x.name.toUpperCase().startsWith(prefix)) return true;
  return false;
};

/**
 * A scanned place (photogrammetry: Polycam, Luma, RealityScan…) has its light already in its photos, and its materials
 * left at glTF's defaults (fully metallic, fully rough, a colour picture). Drawn as the photos are (unlit, not
 * tone-mapped, both sides), it looks as it was shot; lit, it would look dark and metallic. Other materials are kept.
 */
function baked(mat: THREE.Material): THREE.Material {
  const std = mat as THREE.MeshStandardMaterial;
  if (!std.isMeshStandardMaterial || !std.map || std.metalness !== 1 || std.roughness !== 1 || std.metalnessMap || std.normalMap || std.emissiveMap) return mat;
  const flat = new THREE.MeshBasicMaterial({ map: std.map, color: std.color, side: THREE.DoubleSide, transparent: std.transparent, alphaTest: std.alphaTest });
  flat.toneMapped = false;
  flat.name = std.name;
  std.dispose();
  return flat;
}

export class TourEngine {
  private o: TourOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  // near at 10 cm: enough depth precision that distant floors, rugs and steps never flicker
  private camera = new THREE.PerspectiveCamera(70, 1, 0.1, 400);
  private colliders: THREE.Mesh[] = [];
  private ray = new THREE.Raycaster();
  private pos = new THREE.Vector3();
  private floorY = 0;
  /** No floor found under the start: the visitor stays at the start's height (a model without floors). */
  private flat = false;
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private frame = 0;
  private last = 0;
  private dirty = true;
  private alive = true;
  private frameAvg = 16;
  private framesSince = 0;
  private observer: ResizeObserver;
  private drag: { id: number; x: number; y: number } | null = null;
  private env: THREE.Texture | null = null;
  private down = new THREE.Vector3(0, -1, 0);
  private spots: { key: string; at: THREE.Vector3 }[] = [];
  private spot: string | null = null;
  private v = new THREE.Vector3();
  private w = new THREE.Vector3();
  private visit: Visit | null = null;
  private seats: Seat[] = [];
  private nearSeat: Seat | null = null;
  private seated: { seat: Seat; pos: THREE.Vector3; floorY: number } | null = null;
  /** The eye moving to a seat (or back up). */
  private glide: { from: THREE.Vector3; to: THREE.Vector3; yaw0: number; yaw1: number; pitch0: number; pitch1: number; t: number; dur: number } | null = null;
  private activity = '';
  private items = new Map<string, Item>();
  // the editor's
  private picked: Item | null = null;
  private gizmo: import('three/addons/controls/TransformControls.js').TransformControls | null = null;
  private gizmoBusy = false;
  private labels: THREE.Sprite[] = [];
  private box: THREE.BoxHelper | null = null;
  private pointer = new THREE.Vector2();

  constructor(options: TourOptions) {
    this.o = options;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(this.bestRatio());
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    canvas.tabIndex = 0;
    canvas.setAttribute('aria-label', '3D');
    options.container.appendChild(canvas);

    this.camera.rotation.order = 'YXZ';
    this.scene.background = new THREE.Color('#ece7e1');
    const pmrem = new THREE.PMREMGenerator(this.renderer);
    this.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();
    this.scene.environment = this.env;
    this.scene.environmentIntensity = 0.75;
    this.scene.add(new THREE.HemisphereLight(0xfff6ee, 0x8a8178, 0.35));
    const sun = new THREE.DirectionalLight(0xfff1e2, 0.6);
    sun.position.set(-5, 10, 4);
    this.scene.add(sun);
    this.ray.firstHitOnly = true;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(options.container);
    this.resize();
    this.bindInput();
  }

  /** Downloads the model (reporting progress), finds the start and the floor, and draws the first frame. */
  async load(): Promise<void> {
    const res = await fetch(this.o.model);
    if (!res.ok || !res.body) throw new Error(`model ${res.status}`);
    const total = Number(res.headers.get('content-length')) || 0;
    const reader = res.body.getReader();
    const parts: Uint8Array[] = [];
    let got = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      parts.push(value);
      got += value.length;
      if (total) this.o.onProgress(Math.min(0.92, got / total));
    }
    if (!this.alive) return;
    const data = await new Blob(parts as BlobPart[]).arrayBuffer();
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    const gltf = await loader.parseAsync(data, '');
    if (!this.alive) return;
    this.build(gltf.scene);
    this.o.onProgress(1);
    // The first look at the place (before anything moves).
    this.dirty = true;
    this.kick();
  }

  private build(root: THREE.Object3D) {
    this.scene.add(root);
    root.updateMatrixWorld(true);
    // The items, where the owner's changes put them; for visitors, merged again into a few meshes.
    this.items = collectItems(root);
    for (const item of this.items.values()) applyEdit(item, this.o.edits?.[item.code]);
    if (this.items.size && !this.o.editor) mergeItems(root, this.items);
    const anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      if (named(m, 'COLLIDER')) m.visible = false;
      const mats = (Array.isArray(m.material) ? m.material : [m.material]).map((mat) => baked(mat));
      m.material = Array.isArray(m.material) ? mats : mats[0]!;
      for (const mat of mats) {
        const map = (mat as THREE.MeshStandardMaterial).map;
        if (map) map.anisotropy = anisotropy;
      }
      if (named(m, 'NOCOLLIDE') || named(m, 'BARISTA') || named(m, 'CLEANER')) return;
      m.geometry.computeBoundsTree();
      this.colliders.push(m);
    });

    // Lamps exported from Blender come in its own units (tens of thousands): brought down to a room's light.
    root.traverse((o) => {
      const light = o as THREE.PointLight;
      if ((light.isPointLight || (light as unknown as THREE.SpotLight).isSpotLight) && light.intensity > 500) light.intensity *= BLENDER_LAMP;
    });

    // The spots the page answers (a menu at a counter...).
    root.traverse((o) => {
      const m = /^HOTSPOT_(\w+)/.exec(o.name);
      if (m) this.spots.push({ key: m[1]!.toLowerCase(), at: o.getWorldPosition(new THREE.Vector3()) });
    });

    // The seats.
    root.traverse((o) => {
      if (!/^SEAT_/.test(o.name)) return;
      const d = o.userData as { yaw?: number; eye?: number; table?: number[]; tableItem?: string; stand?: number[]; nav?: number; local?: boolean };
      const vec = (a: unknown) => (Array.isArray(a) && a.length === 3 ? new THREE.Vector3(...(a.map(Number) as [number, number, number])) : null);
      // `local`: the seat is in its chair's item (it goes with it), its spots in their items
      const inItem = (v: THREE.Vector3 | null, item: THREE.Object3D | null | undefined) => (v && d.local && item ? item.localToWorld(v) : v);
      const table = inItem(vec(d.table), d.tableItem ? root.getObjectByName(d.tableItem) : null);
      const at = o.getWorldPosition(new THREE.Vector3());
      const stand = inItem(vec(d.stand), o.parent);
      // the way a seated visitor looks: its extras' yaw, or (in an item) the seat's own −Z
      const look = new THREE.Vector3(0, 0, -1).transformDirection(o.matrixWorld);
      if (d.yaw === undefined) d.yaw = Math.atan2(-look.x, -look.z);
      // where the waiter stands by it, and the walkway point he comes from
      const spot = stand && Number.isInteger(d.nav) ? { stand, seat: at.clone(), nav: Number(d.nav) } : null;
      this.seats.push({ at, yaw: Number(d.yaw) || 0, eye: Number(d.eye) || 0.72, table, spot });
    });
    // The barista and what the visitor is given.
    this.visit = new Visit(this.scene, this.camera, this.env, (x, z, from) => this.surfaceBelow(x, z, from), !!this.o.debug);

    // Where visitors begin: the START node, or an open spot near the middle of the model.
    let start: THREE.Object3D | undefined;
    root.traverse((o) => {
      if (!start && /^(START|SPAWN)/i.test(o.name)) start = o;
    });
    const box = new THREE.Box3().setFromObject(root);
    let floor: number | null;
    if (start) {
      start.getWorldPosition(this.pos);
      const forward = new THREE.Vector3(0, 0, -1).transformDirection(start.matrixWorld);
      this.yaw = Math.atan2(-forward.x, -forward.z);
      floor = this.floorBelow(this.pos.x, this.pos.z, this.pos.y + 1.2, Infinity);
      if (floor === null) floor = this.pos.y;
    } else floor = this.openSpot(box);
    if (floor === null) {
      // No floor anywhere: a model without one is looked at from its middle.
      this.flat = true;
      box.getCenter(this.pos);
      this.floorY = this.pos.y - EYE;
    } else this.floorY = floor;
    this.pos.y = this.floorY + EYE;
    // A small model (a table, a counter) is still seen from a little way off.
    this.camera.far = Math.max(60, box.getSize(this.v).length() * 2);
    this.camera.updateProjectionMatrix();
  }

  /**
   * Without a START: the main floor is the level with the most room to stand on (a grid over the model's plan, looking
   * down through every level: a surface with room for a visitor above it), and visitors start at the open spot of it
   * nearest its middle, looking the way with the most room. Sets the position and the look; returns the floor's height.
   */
  private openSpot(box: THREE.Box3): number | null {
    const size = box.getSize(new THREE.Vector3());
    const n = 28;
    const spots: THREE.Vector3[] = [];
    this.ray.firstHitOnly = false;
    for (let i = 0; i <= n; i++)
      for (let j = 0; j <= n; j++) {
        const x = box.min.x + (size.x * i) / n;
        const z = box.min.z + (size.z * j) / n;
        this.ray.set(this.v.set(x, box.max.y + 1, z), this.down);
        this.ray.near = 0;
        this.ray.far = size.y + 2;
        let above = Infinity;
        for (const hit of this.ray.intersectObjects(this.colliders, false)) {
          if (above - hit.point.y >= EYE + 0.25) spots.push(hit.point.clone());
          above = hit.point.y;
        }
      }
    this.ray.firstHitOnly = true;
    if (!spots.length) return null;
    // The level (half a metre deep) with the most places to stand.
    const levels = new Map<number, THREE.Vector3[]>();
    for (const p of spots) {
      const k = Math.round(p.y / 0.5);
      levels.set(k, [...(levels.get(k) ?? []), p]);
    }
    const main = [...levels.values()].sort((a, b) => b.length - a.length)[0]!;
    const middle = main.reduce((m, p) => m.add(p), new THREE.Vector3()).divideScalar(main.length);
    main.sort((a, b) => Math.hypot(a.x - middle.x, a.z - middle.z) - Math.hypot(b.x - middle.x, b.z - middle.z));
    for (const p of main) {
      this.pos.set(p.x, p.y, p.z);
      this.floorY = p.y;
      if (this.blocked(0.001, 0) || this.blocked(-0.001, 0) || this.blocked(0, 0.001) || this.blocked(0, -0.001)) continue;
      // Looking the way with the most room (at eye height, up to 30 m).
      let best = -1;
      for (let k = 0; k < 16; k++) {
        const yaw = (k / 16) * Math.PI * 2;
        this.ray.set(this.v.set(p.x, p.y + EYE, p.z), this.w.set(-Math.sin(yaw), 0, -Math.cos(yaw)));
        this.ray.far = 30;
        const d = this.ray.intersectObjects(this.colliders, false)[0]?.distance ?? 30;
        if (d > best) {
          best = d;
          this.yaw = yaw;
        }
      }
      return p.y;
    }
    return null;
  }

  /** The height of the floor under (x, z), looking down from `from`, no further down than `depth`. */
  private floorBelow(x: number, z: number, from: number, depth: number): number | null {
    this.ray.set(this.v.set(x, from, z), this.down);
    this.ray.near = 0;
    this.ray.far = depth;
    const hit = this.ray.intersectObjects(this.colliders, false)[0];
    return hit ? hit.point.y : null;
  }

  /** The top of what is really there under (x, z) (a table's top), looking down from `from`: invisible walls ignored. */
  private surfaceBelow(x: number, z: number, from: number): number | null {
    this.ray.set(this.v.set(x, from, z), this.down);
    this.ray.near = 0;
    this.ray.far = 2.5;
    for (const hit of this.ray.intersectObjects(this.colliders, false)) if (!named(hit.object, 'COLLIDER')) return hit.point.y;
    return null;
  }

  /** Whether walking from here by (dx, dz) runs into something between the knees and the head. */
  private blocked(dx: number, dz: number) {
    if (this.o.editor) return false;
    const len = Math.hypot(dx, dz);
    if (!len) return false;
    const dir = this.w.set(dx / len, 0, dz / len);
    for (const angle of [0, 0.6, -0.6]) {
      const d = angle ? dir.clone().applyAxisAngle(THREE.Object3D.DEFAULT_UP, angle) : dir;
      const reach = angle ? RADIUS : len + RADIUS;
      for (const h of [STEP_UP + 0.05, 1.05, EYE - 0.05]) {
        this.ray.set(this.v.set(this.pos.x, this.floorY + h, this.pos.z), d);
        this.ray.near = 0;
        this.ray.far = reach;
        if (this.ray.intersectObjects(this.colliders, false).length) return true;
      }
    }
    return false;
  }

  /** Steps by (dx, dz) when nothing is in the way and the floor goes on there (no walking off an edge). */
  private step(dx: number, dz: number) {
    const tryStep = (sx: number, sz: number) => {
      if (!sx && !sz) return false;
      if (this.blocked(sx, sz)) return false;
      const x = this.pos.x + sx;
      const z = this.pos.z + sz;
      if (!this.flat) {
        const y = this.floorBelow(x, z, this.floorY + STEP_UP, STEP_UP + STEP_DOWN);
        if (y === null) return false;
        this.floorY = y;
      }
      this.pos.x = x;
      this.pos.z = z;
      return true;
    };
    if (tryStep(dx, dz)) return;
    // Slide along the wall.
    if (!tryStep(dx, 0)) tryStep(0, dz);
  }

  /** The on-screen pad's position, each axis −1…1 (y down = backwards). */
  setStick(x: number, y: number) {
    this.stick = { x, y };
    if (x || y) this.kick();
  }

  private bindInput() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onDown = (e: PointerEvent) => {
    // the editor: a handle of the picked item is being dragged, not the view (on a touch screen there was no hover
    // before the touch: the handles are tested here first)
    const g = this.gizmo;
    if (g && this.picked) {
      const r = this.renderer.domElement.getBoundingClientRect();
      g.pointerHover({ x: ((e.clientX - r.left) / r.width) * 2 - 1, y: -((e.clientY - r.top) / r.height) * 2 + 1, button: e.button } as unknown as PointerEvent);
      if (g.axis) return;
    }
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
    this.downAt = { x: e.clientX, y: e.clientY };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };
  private onMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    const k = e.pointerType === 'touch' ? 0.0055 : 0.0035;
    this.yaw -= dx * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.1, 1.1);
    this.dirty = true;
    this.kick();
  };
  private downAt: { x: number; y: number } | null = null;
  private onUp = (e: PointerEvent) => {
    this.drag = null;
    // the editor: a click (not a drag) picks the item under it
    const d = this.downAt;
    this.downAt = null;
    if (this.o.editor && d && e.type === 'pointerup' && Math.hypot(e.clientX - d.x, e.clientY - d.y) < 6 && !this.gizmoBusy) this.pickAt(e.clientX, e.clientY);
  };
  private onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!KEYS.includes(e.code)) return;
    e.preventDefault();
    this.keys.add(e.code);
    this.kick();
  };
  private onKeyUp = (e: KeyboardEvent) => {
    this.keys.delete(e.code);
  };
  private onBlur = () => {
    this.keys.clear();
  };

  private kick() {
    if (!this.frame && this.alive) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  private tick = (now: number) => {
    this.frame = 0;
    if (!this.alive) return;
    const frameMs = now - this.last;
    const dt = Math.min(frameMs / 1000, 0.1);
    this.last = now;
    let moving = false;
    let f = 0;
    let s = 0;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) f += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) f -= 1;
    if (this.keys.has('KeyA')) s -= 1;
    if (this.keys.has('KeyD')) s += 1;
    if (this.keys.has('ArrowLeft')) this.yaw += 1.8 * dt;
    if (this.keys.has('ArrowRight')) this.yaw -= 1.8 * dt;
    if (this.keys.has('ArrowLeft') || this.keys.has('ArrowRight')) moving = true;
    f -= this.stick.y;
    s += this.stick.x;
    // seated (or sitting down, standing up): looking round only
    if (this.seated || this.glide) f = s = 0;
    if (f || s) {
      moving = true;
      const len = Math.max(1, Math.hypot(f, s));
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      this.step(((fx * f - fz * s) / len) * SPEED * dt, ((fz * f + fx * s) / len) * SPEED * dt);
    }
    // Sitting down or standing up: the eye glides there.
    const g = this.glide;
    if (g) {
      g.t = Math.min(1, g.t + dt / g.dur);
      const e = g.t * g.t * (3 - 2 * g.t);
      this.pos.lerpVectors(g.from, g.to, e);
      this.pos.y += Math.sin(Math.PI * g.t) * 0.08;
      this.yaw = g.yaw0 + (g.yaw1 - g.yaw0) * e;
      this.pitch = g.pitch0 + (g.pitch1 - g.pitch0) * e;
      if (g.t >= 1) {
        this.glide = null;
        this.emit();
      }
      moving = true;
    }
    // The eye follows the floor smoothly (stairs).
    const eyeY = this.floorY + EYE;
    if (!this.seated && !g && Math.abs(this.pos.y - eyeY) > 0.002) {
      this.pos.y = this.o.reducedMotion ? eyeY : this.pos.y + (eyeY - this.pos.y) * (1 - Math.exp(-dt * 14));
      moving = true;
    }
    if (moving) this.checkSpot();
    this.camera.position.copy(this.pos);
    this.camera.rotation.set(this.pitch, this.yaw, 0);
    this.camera.updateMatrixWorld();
    // the barista, and what the visitor holds
    let alive = false;
    // (in the editor the staff stand still: the place is drawn only when something changes)
    if (this.visit && !this.o.editor) {
      alive = this.visit.update(dt, !!(f || s));
      if (alive) this.emit();
      // the waiter has come to the seat: the visitor looks up at him
      const look = this.visit.lookAt;
      if (look && this.seated && !this.glide) {
        this.visit.lookAt = null;
        const dx = look.x - this.pos.x,
          dz = look.z - this.pos.z;
        const pitch = Math.atan2(look.y - this.pos.y, Math.hypot(dx, dz));
        this.glideTo(this.pos.clone(), Math.atan2(-dx, -dz), THREE.MathUtils.clamp(pitch * 0.75, -0.3, 0.3));
      } else if (look) this.visit.lookAt = null;
    }
    if (moving || alive || this.dirty) {
      this.renderer.render(this.scene, this.camera);
      this.visit?.render(this.renderer);
      if (moving || alive) this.adapt(frameMs);
      this.dirty = false;
    }
    if (moving || alive) this.kick();
  };

  // ---------- sitting, ordering, eating ----------

  /** Tells the page what the visitor can do now (only when it changed). */
  private emit() {
    if (!this.o.onActivity || !this.visit) return;
    const v = this.visit.state(this.pos);
    const atCounter = this.spot === 'counter' && !this.seated && !this.glide;
    const a: TourActivity = {
      order: { coffee: atCounter && this.visit.canOrder('coffee'), cookie: atCounter && this.visit.canOrder('cookie') },
      making: v.making,
      coffee: v.coffee,
      cookie: v.cookie,
      seat: this.seated ? 'seated' : this.nearSeat && !this.glide ? 'near' : null,
      busy: v.busy || !!this.glide,
      waiter: v.waiter ?? (this.seated && !this.glide && this.visit.canCallWaiter(this.seated.seat.spot) ? 'call' : null),
      waiterOrder: v.waiterOrder,
    };
    const key = JSON.stringify(a);
    if (key === this.activity) return;
    this.activity = key;
    this.o.onActivity(a);
  }

  /** Asks the barista for a coffee or a cookie (at the counter). */
  order(kind: Treat) {
    if (this.spot !== 'counter' || this.seated || !this.visit?.order(kind)) return;
    this.emit();
    this.kick();
  }

  /** A sip of the coffee, a bite of the cookie. */
  sip() {
    if (this.visit?.sip()) this.kick();
  }
  bite() {
    if (this.visit?.bite()) this.kick();
  }

  /** Sits on the seat in reach: the eye glides down onto it, facing the way the seat faces. */
  sit() {
    const seat = this.nearSeat;
    if (!seat || this.seated || this.glide) return;
    this.seated = { seat, pos: this.pos.clone(), floorY: this.floorY };
    if (this.visit) this.visit.seated = true;
    const to = seat.at.clone();
    to.y += seat.eye;
    this.glideTo(to, seat.yaw, -0.12);
    this.emit();
  }

  /** Calls the waiter to the seat (seated). */
  callWaiter() {
    const spot = this.seated?.seat.spot;
    if (spot && this.visit?.callWaiter(spot, this.seated?.seat.table ?? null)) {
      this.emit();
      this.kick();
    }
  }

  /** Gives the waiter the order (he is by the seat). */
  waiterOrder(kind: Treat) {
    if (this.visit?.waiterOrder(kind)) {
      this.emit();
      this.kick();
    }
  }

  /** Nothing after all: the waiter goes back to his round. */
  dismissWaiter() {
    this.visit?.dismissWaiter();
    this.emit();
    this.kick();
  }

  /** Stands up, back where the visitor was before sitting. */
  stand() {
    const s = this.seated;
    if (!s || this.glide) return;
    // a waiter on his way for the order is sent back (one already bringing it still hands it over)
    this.visit?.dismissWaiter();
    this.seated = null;
    if (this.visit) this.visit.seated = false;
    this.floorY = s.floorY;
    this.glideTo(s.pos.clone().setY(s.floorY + EYE), this.yaw, 0);
    this.emit();
  }

  private glideTo(to: THREE.Vector3, yaw: number, pitch: number) {
    // the short way round
    let yaw1 = yaw;
    while (yaw1 - this.yaw > Math.PI) yaw1 -= Math.PI * 2;
    while (yaw1 - this.yaw < -Math.PI) yaw1 += Math.PI * 2;
    this.glide = { from: this.pos.clone(), to, yaw0: this.yaw, yaw1, pitch0: this.pitch, pitch1: pitch, t: 0, dur: this.o.reducedMotion ? 0.01 : 0.8 };
    this.kick();
  }

  /** Puts the coffee (or cookie) down on the table by the seat (or on the floor beside it, without one). */
  putDown(kind: Treat) {
    const s = this.seated;
    if (!s || !this.visit || this.glide) return;
    const fwd = new THREE.Vector3(-Math.sin(s.seat.yaw), 0, -Math.cos(s.seat.yaw));
    const side = new THREE.Vector3(-fwd.z, 0, fwd.x);
    const spot = s.seat.table?.clone() ?? s.seat.at.clone().addScaledVector(side, -0.45).addScaledVector(fwd, 0.1).setY(s.floorY);
    if (this.visit.putDown(kind, spot, side)) this.kick();
  }

  pickUp(kind: Treat) {
    if (this.visit?.pickUp(kind)) this.kick();
  }

  /** Tells the page when the visitor is at a spot (on its floor, within 1.8 m), or has left it. */
  private checkSpot() {
    this.checkSeat();
    if (!this.spots.length) return;
    let near: string | null = null;
    for (const s of this.spots) {
      if (Math.abs(s.at.y - this.floorY) > 2.2) continue;
      if (Math.hypot(s.at.x - this.pos.x, s.at.z - this.pos.z) < 1.8) near = s.key;
    }
    if (near !== this.spot) {
      this.spot = near;
      this.o.onSpot?.(near);
      this.emit();
    }
  }

  /** The seat within reach (on this floor, within a metre), when standing. */
  private checkSeat() {
    if (this.seated || this.glide) return;
    let best: Seat | null = null;
    let bestD = 1.0;
    for (const s of this.seats) {
      if (Math.abs(s.at.y - this.floorY) > 1.0) continue;
      const d = Math.hypot(s.at.x - this.pos.x, s.at.z - this.pos.z);
      if (d < bestD) {
        bestD = d;
        best = s;
      }
    }
    if (best !== this.nearSeat) {
      this.nearSeat = best;
      this.emit();
    }
  }

  /** Keeps walking smooth on a slow device: draws a little less sharp while frames come slowly. */
  private adapt(frameMs: number) {
    if (frameMs <= 0 || frameMs > 250) return;
    this.frameAvg = this.frameAvg * 0.92 + frameMs * 0.08;
    if (++this.framesSince < 45) return;
    const ratio = this.renderer.getPixelRatio();
    const best = this.bestRatio();
    let next = ratio;
    if (this.frameAvg > 24 && ratio > 0.6) next = Math.max(0.6, ratio - 0.2);
    else if (this.frameAvg < 13 && ratio < best) next = Math.min(best, ratio + 0.1);
    if (next !== ratio) {
      this.renderer.setPixelRatio(next);
      this.resize();
      this.framesSince = 0;
    }
  }

  /** The sharpest the picture is drawn: the screen's own, at most 1.5, and within the pixel budget for this size. */
  private bestRatio() {
    const el = this.o.container;
    const area = Math.max(1, (el.clientWidth || 1) * (el.clientHeight || 1));
    return Math.max(0.6, Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO, Math.sqrt(PIXEL_BUDGET / area)));
  }

  private resize() {
    const el = this.o.container;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    const best = this.bestRatio();
    if (this.renderer.getPixelRatio() > best) this.renderer.setPixelRatio(best);
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 78 : 68;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.kick();
  }

  // ---------- the editor (Admin) ----------

  /** The model's items (code and what it is), by code. */
  itemList() {
    return [...this.items.values()].map((i) => ({ code: i.code, label: i.label })).sort((a, b) => Number(a.code) - Number(b.code) || a.code.localeCompare(b.code));
  }

  private pickAt(x: number, y: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1);
    const ray = new THREE.Raycaster();
    ray.setFromCamera(this.pointer, this.camera);
    const nodes = [...this.items.values()].map((i) => i.node);
    for (const hit of ray.intersectObjects(nodes, true)) {
      for (let o: THREE.Object3D | null = hit.object; o; o = o.parent) {
        const m = /^ITEM_(\w+)/.exec(o.name);
        if (m) return this.select(m[1]!);
      }
    }
    this.select(null);
  }

  /** Picks an item (its handles appear on it), or none. */
  async select(code: string | null) {
    const item = code ? (this.items.get(code) ?? null) : null;
    this.picked = item;
    if (this.box) {
      this.scene.remove(this.box);
      this.box.dispose();
      this.box = null;
    }
    if (item) {
      if (!this.gizmo) {
        const { TransformControls } = await import('three/addons/controls/TransformControls.js');
        if (!this.alive) return;
        const g = new TransformControls(this.camera, this.renderer.domElement);
        g.setSpace('world');
        g.setTranslationSnap(0.01);
        // bigger handles on a touch screen (a finger)
        if (window.matchMedia('(pointer: coarse)').matches) g.setSize(1.5);
        g.setRotationSnap(THREE.MathUtils.degToRad(1));
        g.addEventListener('dragging-changed', (ev) => {
          this.gizmoBusy = !!(ev as unknown as { value: boolean }).value;
        });
        g.addEventListener('objectChange', () => {
          if (!this.picked) return;
          // turned round the vertical only
          const e = editOf(this.picked);
          applyEdit(this.picked, e);
          this.box?.update();
          this.o.editor?.onChange(this.picked.code, e);
          this.dirty = true;
          this.kick();
        });
        g.addEventListener('change', () => {
          this.dirty = true;
          this.kick();
        });
        this.scene.add(g.getHelper());
        this.gizmo = g;
        this.setMode('translate');
      }
      this.gizmo.attach(item.node);
      this.box = new THREE.BoxHelper(item.node, 0xffb020);
      this.scene.add(this.box);
    } else this.gizmo?.detach();
    this.o.editor?.onSelect(item ? { code: item.code, label: item.label } : null);
    this.dirty = true;
    this.kick();
  }

  /** The handles: move (on the floor and up), or turn (round the vertical). */
  setMode(mode: 'translate' | 'rotate') {
    const g = this.gizmo;
    if (!g) return;
    g.setMode(mode);
    g.showX = g.showZ = mode === 'translate';
    g.showY = true;
    this.dirty = true;
    this.kick();
  }

  /** Sets an item's change (from the editor's fields and buttons). */
  setEdit(code: string, edit: ItemEdit) {
    const item = this.items.get(code);
    if (!item) return;
    applyEdit(item, edit);
    if (item === this.picked) this.box?.update();
    for (const l of this.labels) if (l.userData.code === code) this.placeLabel(l, item);
    this.dirty = true;
    this.kick();
  }

  /** Walks the visitor to look at an item from a couple of metres away. */
  focus(code: string) {
    const item = this.items.get(code);
    if (!item) return;
    const box = new THREE.Box3().setFromObject(item.node);
    const c = box.getCenter(new THREE.Vector3());
    const dir = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const at = c.clone().addScaledVector(dir, -2.4);
    const floor = this.floorBelow(at.x, at.z, box.min.y + 1.5, 4);
    this.floorY = floor ?? box.min.y;
    this.pos.set(at.x, this.floorY + EYE, at.z);
    this.pitch = Math.atan2(c.y - this.pos.y, 2.4);
    this.dirty = true;
    this.kick();
  }

  /** Each item's code on a little label over it (to tell which is which). */
  showCodes(on: boolean) {
    for (const l of this.labels) {
      this.scene.remove(l);
      l.material.map?.dispose();
      l.material.dispose();
    }
    this.labels = [];
    if (on)
      for (const item of this.items.values()) {
        const c = document.createElement('canvas');
        c.width = 128;
        c.height = 64;
        const g = c.getContext('2d')!;
        g.fillStyle = 'rgba(20,16,14,.82)';
        g.beginPath();
        g.roundRect(4, 8, 120, 48, 14);
        g.fill();
        g.fillStyle = '#ffd27a';
        g.font = 'bold 30px system-ui, sans-serif';
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillText('#' + item.code, 64, 33);
        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, depthTest: false, transparent: true }));
        sprite.scale.set(0.28, 0.14, 1);
        sprite.renderOrder = 10;
        sprite.userData.code = item.code;
        this.placeLabel(sprite, item);
        this.scene.add(sprite);
        this.labels.push(sprite);
      }
    this.dirty = true;
    this.kick();
  }

  private placeLabel(l: THREE.Sprite, item: Item) {
    const box = new THREE.Box3().setFromObject(item.node);
    const c = box.getCenter(new THREE.Vector3());
    l.position.set(c.x, box.max.y + 0.12, c.z);
  }

  dispose() {
    this.alive = false;
    this.gizmo?.dispose();
    this.showCodes(false);
    this.visit?.dispose();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onDown);
    canvas.removeEventListener('pointermove', this.onMove);
    canvas.removeEventListener('pointerup', this.onUp);
    canvas.removeEventListener('pointercancel', this.onUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      m.geometry.disposeBoundsTree?.();
      m.geometry.dispose();
      for (const mat of Array.isArray(m.material) ? m.material : [m.material]) {
        for (const v of Object.values(mat)) if (v instanceof THREE.Texture) v.dispose();
        mat.dispose();
      }
    });
    this.env?.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
  }
}
