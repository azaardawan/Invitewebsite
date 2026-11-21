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
import { buildDoor, buildDrawer, ceilings, drawerContents, moveParts, movePhoto, outline, roundify, stand, texturePaint } from './build';

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
  /** What lies in each drawer (by thing key): a note's words and a photo, drawn as paper in it. */
  contents?: Readonly<Record<string, { note?: string; photo?: { src: string; focus: { x: number; y: number; zoom: number } } }>>;
  /** The things the visitor is next to and facing, nearest first (to offer a button for each; none: []). */
  onNear?: (keys: string[]) => void;
};

type Moving = { thing: WorldThing; group: THREE.Group; meshes: THREE.Mesh[]; open: boolean; t: number; base: THREE.Matrix4; size: THREE.Vector3; center: THREE.Vector3 };

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
  /** The footprints of everything in the way (see `touches`), but the things that move. */
  private solids: THREE.Box3[] = [];
  private tmpBox = new THREE.Box3();
  private frameAvg = 16;
  private framesSince = 0;
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
  private near = '';
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
    this.scene.add(new THREE.HemisphereLight(0xfff1e9, 0xfff4ec, plan.light.ambient));
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
    const paint = (slot: string) => {
      let m = paints.get(slot);
      if (!m) {
        // Without an environment to reflect, a metal reads dark: gold is drawn as a bright satin paint.
        const color = new THREE.Color(colors[slot] ?? '#ffffff');
        m = new THREE.MeshStandardMaterial({ color, roughness: slot === 'metal' ? 0.45 : 0.78, metalness: 0, flatShading: true });
        if (slot === 'metal') m.emissive = color.clone().multiplyScalar(0.18);
        paints.set(slot, m);
      }
      return m;
    };
    for (const mesh of meshes) {
      if (matches(mesh.name, plan.hidden)) {
        mesh.visible = false;
        continue;
      }
      // Simple models often come without normals: light them face by face.
      if (!mesh.geometry.attributes.normal) mesh.geometry.computeVertexNormals();
      const slot = Object.entries(plan.paint ?? {}).find(([, prefixes]) => matches(mesh.name, prefixes))?.[0];
      if (slot && colors[slot]) {
        mesh.material = paint(slot);
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

    // Round things drawn smoothly round.
    for (const mesh of meshes) {
      if (!mesh.visible) continue;
      if (matches(mesh.name, plan.round?.spheres)) roundify(mesh, 'sphere');
      else if (matches(mesh.name, plan.round?.cylinders)) roundify(mesh, 'cylinder');
      else if (matches(mesh.name, plan.round?.soft)) roundify(mesh, 'soft');
    }
    // Things that give light of their own (flames).
    for (const [prefix, color] of Object.entries(plan.glow ?? {})) {
      const m = new THREE.MeshBasicMaterial({ color: new THREE.Color(color) });
      for (const mesh of meshes) if (mesh.visible && matches(mesh.name, [prefix])) mesh.material = m;
    }
    // The ceilings the model lacks.
    const added: THREE.Mesh[] = [];
    if (plan.ceilings) {
      for (const m of ceilings(plan.ceilings.at, paint(plan.ceilings.paint))) {
        this.scene.add(m);
        added.push(m);
      }
    }
    // Parts moved (things that floated, set down on what holds them; buttons against their walls).
    for (const move of plan.moves ?? []) moveParts(meshes.filter((m) => matches(m.name, move.nodes)), move);
    // Pedestals the model lacks.
    for (const s of plan.stands ?? []) {
      const m = stand(s, paint(s.paint));
      this.scene.add(m);
      added.push(m);
    }
    // Photo places clear of the furniture in front of them.
    for (const [name, move] of Object.entries(plan.photoMoves ?? {})) {
      const main = root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name));
      if (!main) continue;
      const parts = [main, ...(plan.photoParts ?? []).map((p) => root.getObjectByName(THREE.PropertyBinding.sanitizeNodeName(name + p.suffix))).filter((o): o is THREE.Object3D => !!o)];
      movePhoto(parts, new THREE.Box3().setFromObject(main).getCenter(new THREE.Vector3()), move);
    }

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
    const housings: THREE.Mesh[] = [];
    const pending: { key: string; inside: ReturnType<typeof buildDrawer>['inside']; contents: NonNullable<WorldOptions['contents']>[string] }[] = [];
    for (const thing of plan.things) {
      let parts = meshes.filter((m) => m.name === THREE.PropertyBinding.sanitizeNodeName(thing.node) || matches(m.name, thing.with));
      // A door drawn by the world, in a doorway of the model.
      if (thing.kind === 'door' && thing.build) {
        parts = buildDoor(thing.build, thing.hinge ?? 'min', paint);
        for (const m of parts) this.scene.add(m);
      }
      if (!parts.length) continue;
      // A drawer drawn by the world: the model's drawer (and what it replaces) left out.
      if (thing.kind === 'drawer' && thing.build) {
        for (const m of [...parts, ...meshes.filter((x) => matches(x.name, thing.build!.hide))]) m.visible = false;
        const built = buildDrawer(thing.build, thing.slide, paint);
        const contents = this.o.contents?.[thing.key];
        if (contents) pending.push({ key: thing.key, inside: built.inside, contents });
        for (const m of [...built.drawer, ...built.housing]) this.scene.add(m);
        for (const m of built.housing) {
          this.tappable.set(m, { kind: 'thing', key: thing.key });
          housings.push(m);
        }
        parts = built.drawer;
      }
      const box = new THREE.Box3();
      for (const p of parts) box.expandByObject(p);
      const group = new THREE.Group();
      // Lids tip on their back top edge; doors swing on their hinge edge; everything else turns or moves about its middle.
      const size = box.getSize(new THREE.Vector3());
      const along = size.x > size.z ? 'x' : 'z';
      const pivot =
        thing.kind === 'lid'
          ? new THREE.Vector3((box.min.x + box.max.x) / 2, box.max.y, box.max.z)
          : thing.kind === 'door'
            ? box.getCenter(new THREE.Vector3()).setComponent(along === 'x' ? 0 : 2, (thing.hinge ?? 'min') === 'min' ? box.min[along] : box.max[along])
            : box.getCenter(new THREE.Vector3());
      group.position.copy(pivot);
      this.scene.add(group);
      group.updateMatrixWorld(true);
      for (const p of parts) {
        group.attach(p);
        this.tappable.set(p, { kind: 'thing', key: thing.key });
      }
      for (const m of meshes) if (matches(m.name, thing.touch)) this.tappable.set(m, { kind: 'thing', key: thing.key });
      this.things.set(thing.key, { thing, group, meshes: parts, open: false, t: 0, base: group.matrix.clone(), size: box.getSize(new THREE.Vector3()), center: box.getCenter(new THREE.Vector3()) });
    }
    for (const m of [...housings, ...added]) {
      m.geometry.computeBoundsTree();
      if (m.name !== 'WORLD_CEILING') this.colliders.push(m);
    }
    // Textured paint (plaster, tiles), on the model and on what the world added.
    for (const [slot, spec] of Object.entries(plan.textures ?? {})) {
      const material = paints.get(slot);
      if (!material) continue;
      const targets: THREE.Mesh[] = [];
      this.scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.isMesh && m.material === material) targets.push(m);
      });
      void texturePaint(material, targets, spec, this.renderer).then((t) => {
        if (!t) return;
        this.disposables.push(t);
        this.dirty = true;
        this.kick();
      });
    }
    // Black lines on the edges of what opens, so visitors see what to open.
    if (plan.outline) {
      const ink = new THREE.LineBasicMaterial({ color: 0x1a1016 });
      this.disposables.push(ink);
      for (const t of this.things.values()) {
        if (t.thing.kind === 'teleport') continue;
        for (const m of [...t.meshes, ...meshes.filter((x) => matches(x.name, t.thing.touch))]) {
          if (!m.visible) continue;
          outline(m, ink);
          // The faces a hair behind their lines, so the lines don't shimmer as the visitor moves.
          const mat = m.material as THREE.Material;
          mat.polygonOffset = true;
          mat.polygonOffsetFactor = 1;
          mat.polygonOffsetUnits = 1;
        }
      }
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
    // The notes and photos in the drawers, laid in once drawn (they move with their drawer).
    for (const p of pending) {
      void drawerContents(p.inside, p.contents, this.o.look, this.o.dir, this.renderer).then((meshes) => {
        const m = this.things.get(p.key);
        if (!m || !this.alive) return;
        for (const mesh of meshes) {
          m.group.attach(mesh);
          this.disposables.push((mesh.material as THREE.MeshStandardMaterial).map!);
        }
        this.dirty = true;
        this.kick();
      });
    }
    // What is in the way of walking: the solid parts' footprints (not floors, ceilings or roofs, nor small things).
    const moving = new Set([...this.things.values()].flatMap((t) => t.meshes));
    const flat = ['FLOOR', 'CEILING', 'ROOF', 'WORLD_CEILING'];
    for (const m of this.colliders) {
      if (moving.has(m) || !m.visible || matches(m.name, flat) || matches(m.name, plan.walkPast)) continue;
      this.solids.push(new THREE.Box3().setFromObject(m));
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

  /**
   * Whether a visitor standing at (x, z) on a floor at `y` would touch anything: every solid part of the world is its
   * footprint (a box on the floor plan, between its bottom and top), and the visitor a circle; only parts between the
   * ankles and the top of the head count. Boxes rather than rays: nothing thin slips between them, and walls slide.
   */
  private touches(x: number, z: number, y: number) {
    const lo = y + 0.12 * this.size;
    const hi = y + 1.8;
    const r = RADIUS;
    const hit = (b: THREE.Box3) => {
      if (b.max.y < lo || b.min.y > hi) return false;
      const dx = Math.max(b.min.x - x, 0, x - b.max.x);
      const dz = Math.max(b.min.z - z, 0, z - b.max.z);
      return dx * dx + dz * dz < r * r;
    };
    for (const b of this.solids) if (hit(b)) return true;
    // Things that move (an open door is out of the way).
    for (const m of this.things.values()) {
      if (m.thing.kind === 'teleport' || (m.thing.kind === 'door' && m.open)) continue;
      for (const mesh of m.meshes) {
        if (!mesh.visible) continue;
        if (hit(this.tmpBox.setFromObject(mesh))) return true;
      }
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
      // Already touching something (a door closed on the visitor): any step out is allowed.
      if (this.touches(this.pos.x + sx, this.pos.z + sz, Math.max(this.floorY, y)) && !this.touches(this.pos.x, this.pos.z, this.floorY)) return false;
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
    // Walking keeps its pace on a slower computer too (up to a tenth of a second a frame).
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

    if (moving) {
      this.checkRoom();
      this.checkNear();
    }
    if (moving || this.dirty) {
      this.camera.position.copy(this.pos);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.renderer.render(this.scene, this.camera);
      if (moving) this.adapt(frameMs);
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
      // Swings open on its hinge, like a door.
      g.rotateY(((m.thing.kind === 'door' && m.thing.hinge === 'max' ? 1 : -1) * Math.PI * 0.55) * e);
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

  /** Tells the design which things the visitor is next to and facing (within reach), nearest first. */
  private checkNear() {
    if (!this.o.onNear) return;
    const fx = -Math.sin(this.yaw);
    const fz = -Math.cos(this.yaw);
    const reach = 1.9 * this.size;
    const near: { key: string; d: number }[] = [];
    for (const [key, m] of this.things) {
      if (m.thing.kind === 'teleport' || !m.meshes.some((x) => x.visible)) continue;
      const dx = m.center.x - this.pos.x;
      const dz = m.center.z - this.pos.z;
      const d = Math.hypot(dx, dz);
      // On this floor, near, and ahead (within about 50° of where the visitor looks), however low it is.
      if (m.center.y < this.floorY - 0.3 || m.center.y > this.floorY + 2.6 * this.size) continue;
      if (d > reach || (d > 0.3 && (dx * fx + dz * fz) / d < 0.64)) continue;
      near.push({ key, d });
    }
    const keys = near.sort((a, b) => a.d - b.d).slice(0, 3).map((n) => n.key);
    if (keys.join() === this.near) return;
    this.near = keys.join();
    this.o.onNear(keys);
  }

  /**
   * Keeps walking smooth: when frames come slowly (a computer drawing a large screen), the picture is drawn a little less
   * sharp, and sharper again when there is time to spare.
   */
  private adapt(frameMs: number) {
    if (frameMs <= 0 || frameMs > 250) return;
    this.frameAvg = this.frameAvg * 0.92 + frameMs * 0.08;
    if (++this.framesSince < 45) return;
    const ratio = this.renderer.getPixelRatio();
    const best = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    let next = ratio;
    if (this.frameAvg > 24 && ratio > 0.6) next = Math.max(0.6, ratio - 0.2);
    else if (this.frameAvg < 13 && ratio < best) next = Math.min(best, ratio + 0.1);
    if (next !== ratio) {
      this.renderer.setPixelRatio(next);
      this.resize();
      this.framesSince = 0;
    }
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

