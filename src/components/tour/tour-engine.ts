/**
 * The three.js side of a café's virtual tour (`/tour/<slug>`): loads the café's own model (a `.glb` made in metres,
 * Y up) and lets the visitor walk through it at eye height: the keys or the on-screen pad to walk, dragging to look.
 * The floor is followed (stairs and ramps of steps up to 45 cm), walls stop the visitor and slide them along.
 *
 * The model may name a few things (docs/TOURS.md):
 * - a node `START` (or `SPAWN`): where visitors begin, looking along its −Z (its forward);
 * - meshes whose name begins `NOCOLLIDE`: walked through (plants' leaves, curtains, light beams);
 * - meshes whose name begins `COLLIDER`: invisible walls (kept in the way, never drawn);
 * - nodes named `HOTSPOT_<key>` (e.g. `HOTSPOT_menu` at a counter): within 1.8 m the page is told (`onSpot`).
 *
 * Loaded on its own (dynamic import) so only the tour page downloads three.js. It draws only when something changes.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';

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
};

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
      if (named(m, 'NOCOLLIDE')) return;
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

  /** Whether walking from here by (dx, dz) runs into something between the knees and the head. */
  private blocked(dx: number, dz: number) {
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
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY };
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
  private onUp = () => {
    this.drag = null;
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
    if (f || s) {
      moving = true;
      const len = Math.max(1, Math.hypot(f, s));
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      this.step(((fx * f - fz * s) / len) * SPEED * dt, ((fz * f + fx * s) / len) * SPEED * dt);
    }
    // The eye follows the floor smoothly (stairs).
    const eyeY = this.floorY + EYE;
    if (Math.abs(this.pos.y - eyeY) > 0.002) {
      this.pos.y = this.o.reducedMotion ? eyeY : this.pos.y + (eyeY - this.pos.y) * (1 - Math.exp(-dt * 14));
      moving = true;
    }
    if (moving) this.checkSpot();
    if (moving || this.dirty) {
      this.camera.position.copy(this.pos);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.renderer.render(this.scene, this.camera);
      if (moving) this.adapt(frameMs);
      this.dirty = false;
    }
    if (moving) this.kick();
  };

  /** Tells the page when the visitor is at a spot (on its floor, within 1.8 m), or has left it. */
  private checkSpot() {
    if (!this.o.onSpot || !this.spots.length) return;
    let near: string | null = null;
    for (const s of this.spots) {
      if (Math.abs(s.at.y - this.floorY) > 2.2) continue;
      if (Math.hypot(s.at.x - this.pos.x, s.at.z - this.pos.z) < 1.8) near = s.key;
    }
    if (near !== this.spot) {
      this.spot = near;
      this.o.onSpot(near);
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

  dispose() {
    this.alive = false;
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
