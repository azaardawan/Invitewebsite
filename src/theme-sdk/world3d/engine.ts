/**
 * The three.js side of `<World3D>`: loads the design's model, paints it in the chosen colours, puts the customer's
 * photos and videos on their places and names on its plates, and lets the visitor walk (keys, a joystick, dragging to
 * look; stairs are walked or tapped) and tap things, which the design answers (`onTap`) by opening them (`set`).
 * Loaded on its own (dynamic import) so only designs with a 3D world download three.js.
 *
 * It draws only when something changes (a step, a look, something opening, a video playing).
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { canvasTexture, fitText, framed, loadImage, sameSite } from '../gallery3d/draw';
import { floorAt, roomAt, scaledPlan, type WorldPlan, type WorldText, type WorldThing } from './plan';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export type WorldPhoto = { index: number; src: string; focus: { x: number; y: number; zoom: number } };
export type WorldVideo = { src: string; poster: string } | null;
export type WorldLook = { font: string; ink: string; ground: string; line: string };
export type WorldTap = { kind: 'photo'; index: number } | { kind: 'screen'; place: number } | { kind: 'thing'; key: string };

export type WorldOptions = {
  container: HTMLElement;
  model: string;
  plan: WorldPlan;
  photos: readonly WorldPhoto[];
  videos: readonly WorldVideo[];
  /** The words on the plates, by the plan's text key ('' leaves a plate blank). */
  texts: Readonly<Record<string, string>>;
  /** The colour of each paint slot (the design's colours or the customer's colour set). */
  colors: Readonly<Record<string, string>>;
  look: WorldLook;
  dir: 'rtl' | 'ltr';
  reducedMotion: boolean;
  onProgress: (share: number) => void;
  onTap: (tap: WorldTap) => void;
  onRoom: (key: string) => void;
  onVideo: (place: number, state: 'playing' | 'paused' | 'ended') => void;
};

type Moving = { thing: WorldThing; group: THREE.Group; meshes: THREE.Mesh[]; open: boolean; t: number; base: THREE.Matrix4; size: THREE.Vector3 };

const SPEED = 2.4;
const RADIUS = 0.32;
const MAX_PIXEL_RATIO = 1.5;
const OPEN_SECONDS = 0.55;

const matches = (name: string, prefixes: readonly string[] | undefined) => !!prefixes?.some((p) => name.startsWith(THREE.PropertyBinding.sanitizeNodeName(p)));

export class WorldEngine {
  private o: WorldOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(72, 1, 0.05, 120);
  private colliders: THREE.Mesh[] = [];
  private tappable = new Map<THREE.Object3D, WorldTap>();
  private things = new Map<string, Moving>();
  private screens: (THREE.Mesh | null)[] = [];
  private posters: (THREE.Material | null)[] = [];
  private playing: { place: number; video: HTMLVideoElement; texture: THREE.VideoTexture } | null = null;
  private gates = new Set<string>();
  private ray = new THREE.Raycaster();
  private pos = new THREE.Vector3();
  private floorY = 0;
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private room = '';
  private frame = 0;
  private last = 0;
  private dirty = true;
  private alive = true;
  private observer: ResizeObserver;
  private drag: { id: number; x: number; y: number; moved: number } | null = null;
  private fade: HTMLDivElement;
  private disposables: { dispose(): void }[] = [];

  /** How many times bigger than the model the world is drawn (the plan's `scale`). */
  private size: number;

  constructor(options: WorldOptions) {
    this.size = options.plan.scale ?? 1;
    // From here on the plan is in the world's metres.
    this.o = { ...options, plan: scaledPlan(options.plan) };
    const { plan, container } = this.o;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = plan.light.exposure;
    const canvas = this.renderer.domElement;
    canvas.style.display = 'block';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.touchAction = 'none';
    canvas.tabIndex = 0;
    container.appendChild(canvas);
    // A short fade when the visitor is taken somewhere (the stairs' tap).
    this.fade = document.createElement('div');
    Object.assign(this.fade.style, { position: 'absolute', inset: '0', background: '#000', opacity: '0', pointerEvents: 'none', transition: 'opacity .22s ease' });
    container.appendChild(this.fade);

    this.camera.rotation.order = 'YXZ';
    this.scene.background = new THREE.Color(plan.sky);
    this.scene.add(new THREE.HemisphereLight(0xfff1e9, 0xe9e3ff, plan.light.ambient));
    const sun = new THREE.DirectionalLight(0xffe8df, plan.light.sun);
    sun.position.set(-4, 9, -6);
    this.scene.add(sun);
    this.ray.firstHitOnly = true;
    this.floorY = plan.start.y;
    this.pos.set(plan.start.x, plan.start.y + plan.eye, plan.start.z);
    this.yaw = plan.start.yaw;

    this.observer = new ResizeObserver(() => this.resize());
    this.observer.observe(container);
    this.resize();
    this.bindInput();
  }

  /** Downloads the model (reporting progress), builds the scene and draws the first frame. */
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
      if (total) this.o.onProgress(Math.min(0.95, got / total));
    }
    const data = await new Blob(parts as BlobPart[]).arrayBuffer();
    const gltf = await new GLTFLoader().parseAsync(data, '');
    if (!this.alive) return;
    this.build(gltf.scene);
    this.o.onProgress(1);
    this.checkRoom();
    this.kick();
    await Promise.all([this.hangPhotos(), this.drawScreens()]);
  }

  private build(root: THREE.Object3D) {
    const { plan, colors } = this.o;
    root.scale.setScalar(this.size);
    root.updateMatrixWorld(true);
    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    // Each paint slot's material (one per colour), and the model's own colours elsewhere, a little satin.
    const paints = new Map<string, THREE.MeshStandardMaterial>();
    for (const mesh of meshes) {
      if (matches(mesh.name, plan.hidden)) {
        mesh.visible = false;
        continue;
      }
      // Simple models often come without normals: light them face by face.
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
      const slot = Object.entries(plan.paint ?? {}).find(([, prefixes]) => matches(mesh.name, prefixes))?.[0];
      if (slot && colors[slot]) {
        let m = paints.get(slot);
        if (!m) {
          // Without an environment to reflect, a metal reads dark: gold is drawn as a bright satin paint.
          const color = new THREE.Color(colors[slot]);
          m = new THREE.MeshStandardMaterial({ color, roughness: slot === 'metal' ? 0.45 : 0.78, metalness: 0, flatShading: true });
          if (slot === 'metal') m.emissive = color.clone().multiplyScalar(0.18);
          paints.set(slot, m);
        }
        mesh.material = m;
      } else {
        const m = mesh.material as THREE.MeshStandardMaterial;
        if (m.isMeshStandardMaterial) {
          m.roughness = 0.8;
          m.metalness = 0;
          m.flatShading = true;
          m.needsUpdate = true;
        }
      }
    }
    this.scene.add(root);

    // Photos, screens and plates are not in the way; the plates' words are drawn on the plan's own quads.
    const photoParts = (name: string) => plan.photos.some((p) => (plan.photoParts ?? []).some((s) => name === THREE.PropertyBinding.sanitizeNodeName(p + s.suffix)));
    // A photo's frame in the design's frame colour; its glass clear (the photo shows through).
    const frame = new THREE.MeshStandardMaterial({ color: new THREE.Color(this.o.look.line), emissive: new THREE.Color(this.o.look.line).multiplyScalar(0.2), roughness: 0.45, side: THREE.DoubleSide });
    const glass = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.06, depthWrite: false, side: THREE.DoubleSide });
    for (const name of plan.photos) {
      for (const part of plan.photoParts ?? []) {
        const m = root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name + part.suffix)) as THREE.Mesh | undefined;
        if (m?.isMesh) m.material = part.role === 'glass' ? glass : frame;
      }
    }
    for (const [i, name] of plan.photos.entries()) {
      const mesh = root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)) as THREE.Mesh | undefined;
      if (mesh?.isMesh) this.tappable.set(mesh, { kind: 'photo', index: i });
    }
    this.screens = plan.screens.map((name) => {
      const mesh = root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)) as THREE.Mesh | undefined;
      return mesh?.isMesh ? mesh : null;
    });
    this.screens.forEach((m, place) => m && this.tappable.set(m, { kind: 'screen', place }));
    for (const t of plan.texts) this.drawText(t);

    // Things that move: each in its own pivot, so the model itself stays as it was.
    for (const thing of plan.things) {
      const parts = meshes.filter((m) => m.name === THREE.PropertyBinding.sanitizeNodeName(thing.node) || matches(m.name, thing.with));
      if (!parts.length) continue;
      const box = new THREE.Box3();
      for (const p of parts) box.expandByObject(p);
      const group = new THREE.Group();
      // Lids tip on their back top edge; everything else turns or moves about its middle.
      const pivot = thing.kind === 'lid' ? new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, box.max.z) : box.getCenter(new THREE.Vector3());
      group.position.copy(pivot);
      this.scene.add(group);
      group.updateMatrixWorld(true);
      for (const p of parts) {
        group.attach(p);
        this.tappable.set(p, { kind: 'thing', key: thing.key });
      }
      for (const m of meshes) if (matches(m.name, thing.touch)) this.tappable.set(m, { kind: 'thing', key: thing.key });
      this.things.set(thing.key, { thing, group, meshes: parts, open: false, t: 0, base: group.matrix.clone(), size: box.getSize(new THREE.Vector3()) });
    }

    const tapOnly = new Set([...this.tappable.keys()].filter((m) => this.tappable.get(m)!.kind !== 'thing'));
    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || !m.visible || tapOnly.has(m) || photoParts(m.name) || matches(m.name, plan.passThrough)) return;
      m.geometry.computeBoundsTree();
      this.colliders.push(m);
    });
    for (const t of this.things.values()) {
      for (const m of t.meshes) {
        m.geometry.computeBoundsTree();
        if (!this.colliders.includes(m)) this.colliders.push(m);
      }
    }
  }

  /** The customer's photos on their places; places without a photo are left out, frame and all. */
  private async hangPhotos() {
    const { plan, photos } = this.o;
    await Promise.all(
      plan.photos.map(async (name, index) => {
        const mesh = this.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name)) as THREE.Mesh | undefined;
        if (!mesh?.isMesh) return;
        const photo = photos.find((p) => p.index === index);
        const img = photo ? await loadImage(photo.src) : null;
        if (!this.alive) return;
        if (!photo || !img) {
          for (const suffix of ['', ...(plan.photoParts ?? []).map((p) => p.suffix)]) {
            const part = this.scene.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name + suffix));
            if (part) part.visible = false;
          }
          this.tappable.delete(mesh);
          return;
        }
        mesh.geometry.computeBoundingBox();
        const size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3());
        const w = Math.max(size.x, size.z);
        const aspect = w / (size.y || 1);
        const texture = canvasTexture(framed(img, aspect, 768, photo.focus), this.renderer);
        this.disposables.push(texture);
        mesh.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
        this.dirty = true;
        this.kick();
      }),
    );
  }

  /** Each screen shows its video's still with a play mark, or stays dark without one. */
  private async drawScreens() {
    await Promise.all(
      this.screens.map(async (mesh, place) => {
        if (!mesh) return;
        const video = this.o.videos[place] ?? null;
        mesh.geometry.computeBoundingBox();
        const size = mesh.geometry.boundingBox!.getSize(new THREE.Vector3());
        const aspect = Math.max(size.x, size.z) / (size.y || 1);
        const W = 640;
        const H = Math.round(W / aspect);
        const c = document.createElement('canvas');
        c.width = W;
        c.height = H;
        const g = c.getContext('2d')!;
        g.fillStyle = '#17121a';
        g.fillRect(0, 0, W, H);
        if (video) {
          const img = await loadImage(video.poster);
          if (!this.alive) return;
          if (img) g.drawImage(framed(img, aspect, W, { x: 50, y: 50, zoom: 1 }), 0, 0);
          // The play mark.
          const r = Math.min(W, H) * 0.14;
          g.fillStyle = 'rgba(0,0,0,.45)';
          g.beginPath();
          g.arc(W / 2, H / 2, r, 0, Math.PI * 2);
          g.fill();
          g.fillStyle = '#fff';
          g.beginPath();
          g.moveTo(W / 2 - r * 0.35, H / 2 - r * 0.5);
          g.lineTo(W / 2 + r * 0.55, H / 2);
          g.lineTo(W / 2 - r * 0.35, H / 2 + r * 0.5);
          g.closePath();
          g.fill();
        } else {
          this.tappable.delete(mesh);
        }
        const texture = canvasTexture(c, this.renderer);
        this.disposables.push(texture);
        const m = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
        this.posters[place] = m;
        mesh.material = m;
        this.dirty = true;
        this.kick();
      }),
    );
  }

  /** A plate's words, centred and shrunk to fit, on a quad just in front of it. */
  private drawText(t: WorldText) {
    const text = (this.o.texts[t.key] ?? '').trim();
    if (!text) return;
    const W = 1024;
    const H = Math.max(64, Math.round((W * t.height) / t.width));
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = this.o.look.ground;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = this.o.look.line;
    g.lineWidth = Math.max(4, H * 0.05);
    g.strokeRect(g.lineWidth, g.lineWidth, W - g.lineWidth * 2, H - g.lineWidth * 2);
    g.fillStyle = this.o.look.ink;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = this.o.dir;
    fitText(g, text, W / 2, H / 2 + H * 0.03, W * 0.88, Math.round(H * 0.58), this.o.look.font, 600);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    this.disposables.push(texture);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(t.width, t.height), new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }));
    const at = new THREE.Vector3(...t.at);
    mesh.position.copy(at);
    mesh.lookAt(at.clone().add(new THREE.Vector3(t.normal[0], 0, t.normal[1])));
    this.scene.add(mesh);
  }

  // ---- what the design asks ----

  /** Opens or closes a thing (a drawer slides, a lid tips, a door clears the way); the visitor sees it move. */
  set(key: string, open: boolean) {
    const m = this.things.get(key);
    if (!m || m.open === open) return;
    m.open = open;
    if (m.thing.kind === 'door') {
      if (open) this.gates.add(key);
      else this.gates.delete(key);
      // An open door is no longer in the way.
      this.colliders = open ? this.colliders.filter((c) => !m.meshes.includes(c)) : [...this.colliders, ...m.meshes];
    }
    if (m.thing.kind === 'teleport' && open) {
      this.teleport(m.thing.to);
      m.open = false;
      return;
    }
    if (this.o.reducedMotion) m.t = open ? 1 : 0;
    this.kick();
  }

  /** Whether a thing is open. */
  isOpen(key: string) {
    return this.things.get(key)?.open ?? false;
  }

  /** Plays the video at `place` on its screen (from a tap: browsers play sound only then). One at a time. */
  async playVideo(place: number) {
    const v = this.o.videos[place];
    const mesh = this.screens[place];
    if (!v || !mesh) return;
    if (this.playing?.place === place) {
      if (this.playing.video.paused) await this.playing.video.play().catch(() => {});
      else this.playing.video.pause();
      return;
    }
    this.stopVideo();
    const video = document.createElement('video');
    video.src = sameSite(v.src);
    video.playsInline = true;
    video.preload = 'auto';
    video.crossOrigin = 'anonymous';
    const texture = new THREE.VideoTexture(video);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    mesh.material = new THREE.MeshBasicMaterial({ map: texture, side: THREE.DoubleSide, toneMapped: false });
    this.playing = { place, video, texture };
    video.addEventListener('play', () => this.o.onVideo(place, 'playing'));
    video.addEventListener('pause', () => !video.ended && this.o.onVideo(place, 'paused'));
    video.addEventListener('ended', () => {
      this.o.onVideo(place, 'ended');
      this.stopVideo();
    });
    await video.play().catch(() => this.o.onVideo(place, 'paused'));
    this.kick();
  }

  pauseVideo() {
    this.playing?.video.pause();
  }

  /** Mutes or unmutes the video playing. */
  muteVideo(muted: boolean) {
    if (this.playing) this.playing.video.muted = muted;
  }

  /** Stops the video playing and lets its memory go; its screen shows the still again. */
  stopVideo() {
    const p = this.playing;
    if (!p) return;
    this.playing = null;
    p.video.pause();
    p.video.removeAttribute('src');
    p.video.load();
    p.texture.dispose();
    const mesh = this.screens[p.place];
    if (mesh) {
      (mesh.material as THREE.Material).dispose();
      mesh.material = this.posters[p.place] ?? mesh.material;
    }
    this.dirty = true;
    this.kick();
  }

  /** Takes the visitor somewhere (with a short fade), facing `yaw`. */
  teleport(to: { x: number; z: number; y: number; yaw: number }) {
    const go = () => {
      this.floorY = to.y;
      this.pos.set(to.x, to.y + this.o.plan.eye, to.z);
      this.yaw = to.yaw;
      this.pitch = 0;
      this.dirty = true;
      this.checkRoom();
      this.kick();
    };
    if (this.o.reducedMotion) return go();
    this.fade.style.opacity = '1';
    window.setTimeout(() => {
      go();
      this.fade.style.opacity = '0';
    }, 230);
  }

  /** The joystick's position, each axis −1…1 (y down = backwards). */
  setStick(x: number, y: number) {
    this.stick = { x, y };
    if (x || y) this.kick();
  }

  // ---- input ----

  private bindInput() {
    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onDown);
    canvas.addEventListener('pointermove', this.onMove);
    canvas.addEventListener('pointerup', this.onUp);
    canvas.addEventListener('pointercancel', this.onCancel);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('blur', this.onBlur);
  }

  private onDown = (e: PointerEvent) => {
    this.drag = { id: e.pointerId, x: e.clientX, y: e.clientY, moved: 0 };
    this.renderer.domElement.setPointerCapture(e.pointerId);
  };
  private onMove = (e: PointerEvent) => {
    const d = this.drag;
    if (!d || d.id !== e.pointerId) {
      // A pointer over something to tap (computers).
      if (e.pointerType === 'mouse') this.renderer.domElement.style.cursor = this.hit(e.clientX, e.clientY) ? 'pointer' : '';
      return;
    }
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (d.moved < 6) return;
    const k = e.pointerType === 'touch' ? 0.0055 : 0.0035;
    // The view follows the finger or the mouse: drag right to look right, drag up to look up.
    this.yaw -= dx * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch - dy * k, -1.1, 1.1);
    this.dirty = true;
    this.kick();
  };
  private onUp = (e: PointerEvent) => {
    if (this.drag && this.drag.moved < 6) {
      const tap = this.hit(e.clientX, e.clientY);
      if (tap) this.o.onTap(tap);
    }
    this.drag = null;
  };
  private onCancel = () => {
    this.drag = null;
  };
  private onKeyDown = (e: KeyboardEvent) => {
    const t = e.target as HTMLElement | null;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (!['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) return;
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

  /** What is under the pointer, when it is something to tap and near enough to reach. */
  private hit(clientX: number, clientY: number): WorldTap | null {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera);
    this.ray.far = 9;
    const targets = [...this.colliders, ...this.tappable.keys()].filter((m) => m.visible);
    const first = this.ray.intersectObjects(targets, false)[0];
    return first ? (this.tappable.get(first.object) ?? null) : null;
  }

  // ---- walking ----

  private blocked(dir: THREE.Vector3, dist: number) {
    for (const h of [0.3, 0.85, 1.4]) {
      this.ray.set(new THREE.Vector3(this.pos.x, this.floorY + h, this.pos.z), dir);
      this.ray.far = dist + RADIUS;
      if (this.ray.intersectObjects(this.colliders, false).length) return true;
    }
    return false;
  }

  /** Steps by (dx, dz) when the floor goes on there (a step up or down at most) and nothing is in the way. */
  private step(dx: number, dz: number) {
    const tryStep = (sx: number, sz: number) => {
      const len = Math.hypot(sx, sz);
      if (!len) return false;
      const y = floorAt(this.o.plan, this.pos.x + sx, this.pos.z + sz, this.floorY, this.gates);
      if (y === null) return false;
      // Low parts on the way up the stairs are the steps themselves: look ahead from the new height.
      const was = this.floorY;
      this.floorY = Math.max(was, y);
      const stop = this.blocked(new THREE.Vector3(sx / len, 0, sz / len), len);
      this.floorY = was;
      if (stop) return false;
      this.pos.x += sx;
      this.pos.z += sz;
      this.floorY = y;
      return true;
    };
    if (tryStep(dx, dz)) return;
    // Slide along the wall (or the floor's edge).
    if (!tryStep(dx, 0)) tryStep(0, dz);
  }

  private kick() {
    if (!this.frame && this.alive) {
      this.last = performance.now();
      this.frame = requestAnimationFrame(this.tick);
    }
  }

  private tick = (now: number) => {
    this.frame = 0;
    if (!this.alive) return;
    const dt = Math.min((now - this.last) / 1000, 0.05);
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
      // A bigger world is walked a little faster.
      const pace = SPEED * Math.sqrt(this.size);
      this.step(((fx * f - fz * s) / len) * pace * dt, ((fz * f + fx * s) / len) * pace * dt);
    }
    // The eye follows the floor smoothly (stairs).
    const eyeY = this.floorY + this.o.plan.eye;
    if (Math.abs(this.pos.y - eyeY) > 0.002) {
      this.pos.y += (eyeY - this.pos.y) * (1 - Math.exp(-dt * 14));
      moving = true;
    }

    // Things opening and closing.
    for (const m of this.things.values()) {
      const target = m.open ? 1 : 0;
      if (m.t === target && !(m.thing.kind === 'glow' && m.open)) continue;
      m.t = target > m.t ? Math.min(1, m.t + dt / OPEN_SECONDS) : Math.max(0, m.t - dt / OPEN_SECONDS);
      this.pose(m, now);
      moving = true;
    }
    if (this.playing && !this.playing.video.paused) moving = true;

    if (moving) this.checkRoom();
    if (moving || this.dirty) {
      this.camera.position.copy(this.pos);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    if (moving) this.kick();
  };

  /** A thing part of the way (t, 0…1) between closed and open. */
  private pose(m: Moving, now: number) {
    const e = m.t * m.t * (3 - 2 * m.t);
    const g = m.group;
    g.matrix.copy(m.base);
    g.matrix.decompose(g.position, g.quaternion, g.scale);
    const k = m.thing.kind;
    if (k === 'drawer') {
      g.position.x += m.thing.slide[0] * e;
      g.position.z += m.thing.slide[1] * e;
    } else if (k === 'lid') {
      g.rotateX(-1.9 * e);
    } else if (k === 'lift') {
      g.position.y += 0.28 * this.size * e;
      g.rotateY(Math.PI * 2 * e);
    } else if (k === 'press') {
      g.scale.setScalar(1 - 0.12 * Math.sin(Math.PI * e));
    } else if (k === 'door') {
      // Slides down into the floor, out of the way.
      g.position.y -= m.size.y * 0.98 * e;
    } else if (k === 'glow') {
      const pulse = m.open ? 0.55 + 0.25 * Math.sin(now / 260) : 0;
      for (const mesh of m.meshes) {
        const mat = mesh.material as THREE.MeshStandardMaterial;
        if (mat.isMeshStandardMaterial) {
          mat.emissive.set('#ffe7f0');
          mat.emissiveIntensity = pulse * e;
        }
      }
    }
    g.updateMatrixWorld(true);
  }

  /** Tells the design when the visitor walks into another room. */
  private checkRoom() {
    const r = roomAt(this.o.plan, this.pos.x, this.pos.z, this.floorY);
    if (!r || r.key === this.room) return;
    this.room = r.key;
    this.o.onRoom(r.key);
  }

  private resize() {
    const el = this.o.container;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    const fov = this.o.plan.fov ?? 72;
    this.camera.fov = w < h ? fov + 10 : fov;
    this.camera.updateProjectionMatrix();
    this.dirty = true;
    this.kick();
  }

  dispose() {
    this.alive = false;
    this.stopVideo();
    if (this.frame) cancelAnimationFrame(this.frame);
    this.observer.disconnect();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onDown);
    canvas.removeEventListener('pointermove', this.onMove);
    canvas.removeEventListener('pointerup', this.onUp);
    canvas.removeEventListener('pointercancel', this.onCancel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
        m.geometry.disposeBoundsTree?.();
        m.geometry.dispose();
        const mats = Array.isArray(m.material) ? m.material : [m.material];
        for (const mat of mats) {
          (mat as THREE.MeshStandardMaterial).map?.dispose();
          mat.dispose();
        }
      }
    });
    for (const d of this.disposables) d.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
    canvas.remove();
    this.fade.remove();
  }
}

