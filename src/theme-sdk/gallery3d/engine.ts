/**
 * The three.js side of `<Gallery3D>`: loads the design's model, hangs the customer's photos on its spots, walls up the
 * rooms that are not shown, and lets the visitor walk (keys, a joystick, dragging to look, tapping a photo). Loaded
 * on its own (dynamic import) so only designs with a 3D gallery download three.js.
 *
 * It draws only when something changes (a walk, a look, a photo arriving), so a phone stays cool while a guest reads.
 */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree } from 'three-mesh-bvh';
import { openRooms, photoRooms, roomAt, route, type GalleryPlan, type Point } from './plan';

THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;

export type EnginePhoto = { index: number; src: string; focus: { x: number; y: number; zoom: number }; title: string | null; caption: string | null };
export type EngineSign = { text: string; dir: 'rtl' | 'ltr' };
export type EngineScreen = { image: string | null; title?: string; body?: string; dir: 'rtl' | 'ltr'; play: boolean };
export type EngineLook = { font: string; textFont: string; signInk: string; signGround: string; screenInk: string; screenGround: string; labelInk: string; labelGround: string; labelLine: string };

export type EngineOptions = {
  container: HTMLElement;
  model: string;
  plan: GalleryPlan;
  photos: readonly EnginePhoto[];
  signs: Readonly<Record<string, EngineSign>>;
  /** Each room's plaque: its name and few words, by room key. */
  plaques: Readonly<Record<string, { title: string; text: string }>>;
  screen: EngineScreen | null;
  look: EngineLook;
  reducedMotion: boolean;
  onProgress: (share: number) => void;
  onView: (index: number | null) => void;
  onRoom: (key: string) => void;
  onScreen: () => void;
  dir: 'rtl' | 'ltr';
};

type Spot = { mesh: THREE.Mesh; center: THREE.Vector3; normal: THREE.Vector3; aspect: number; index: number; width: number; bottom: number };
type Walk = { pts: Point[]; lengths: number[]; total: number; done: number; yaw: number; pitch: number; view: number | null };

const SPEED = 4.2;
const RADIUS = 0.45;
const MAX_PIXEL_RATIO = 1.75;
/** How much of the way up to a picture's middle the camera tilts (see goToPhoto). */
const TILT = 0.45;

/** A photo's address on this site: pictures drawn in WebGL must come from the page's own site (see `/media/`). */
export function sameSite(src: string): string {
  if (src.startsWith('/') || src.startsWith('data:') || src.startsWith('blob:')) return src;
  try {
    const url = new URL(src);
    return url.origin === window.location.origin ? src : `/media${url.pathname}`;
  } catch {
    return src;
  }
}

/** Loads a picture from this site, or null when it can't (a removed photo): the spot then stays empty. */
function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = sameSite(src);
  });
}

/** Draws a photo into a frame of `aspect` the way `<Photo>` shows it (cover, the customer's point kept, zoomed). */
function framed(img: HTMLImageElement, aspect: number, width: number, focus: EnginePhoto['focus']): HTMLCanvasElement {
  const W = width;
  const H = Math.round(width / aspect);
  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d')!;
  const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
  const dw = img.naturalWidth * s;
  const dh = img.naturalHeight * s;
  const fx = Math.min(100, Math.max(0, focus.x)) / 100;
  const fy = Math.min(100, Math.max(0, focus.y)) / 100;
  const zoom = Math.max(1, focus.zoom || 1);
  const ox = W * fx;
  const oy = H * fy;
  const dx = (W - dw) * fx;
  const dy = (H - dh) * fy;
  g.drawImage(img, ox + (dx - ox) * zoom, oy + (dy - oy) * zoom, dw * zoom, dh * zoom);
  return c;
}

function canvasTexture(c: HTMLCanvasElement, renderer: THREE.WebGLRenderer): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.flipY = false; // the model's pictures are mapped with the image's top at v = 0
  t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
  return t;
}

/** Writes `text` centred on a canvas, shrinking it until it fits. */
function fitText(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, size: number, font: string, weight = 400) {
  let s = size;
  do {
    g.font = `${weight} ${s}px ${font}`;
    if (g.measureText(text).width <= maxWidth) break;
    s -= 2;
  } while (s > 12);
  g.fillText(text, x, y);
}

/** Splits a text into lines no wider than `maxWidth` (at most `max` lines; the last ends with "…" when cut). */
function wrap(g: CanvasRenderingContext2D, text: string, maxWidth: number, max: number): string[] {
  const lines: string[] = [];
  for (const para of text.split(/\n+/)) {
    let line = '';
    for (const word of para.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (g.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else line = next;
    }
    if (line) lines.push(line);
  }
  if (lines.length > max) {
    const cut = lines.slice(0, max);
    cut[max - 1] = `${cut[max - 1]!.replace(/\s*\S*$/, '')} …`;
    return cut;
  }
  return lines;
}

function wrapYaw(a: number) {
  return Math.atan2(Math.sin(a), Math.cos(a));
}

export class GalleryEngine {
  private o: EngineOptions;
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(66, 1, 0.05, 220);
  private colliders: THREE.Mesh[] = [];
  private spots: Spot[] = [];
  private screenMesh: THREE.Mesh | null = null;
  private disposables: { dispose(): void }[] = [];
  private ray = new THREE.Raycaster();
  private pos = new THREE.Vector3();
  private yaw = 0;
  private pitch = 0;
  private keys = new Set<string>();
  private stick = { x: 0, y: 0 };
  private walk: Walk | null = null;
  private viewing: number | null = null;
  private room = '';
  private frame = 0;
  private last = 0;
  private dirty = true;
  private alive = true;
  private observer: ResizeObserver;
  private drag: { id: number; x: number; y: number; moved: number } | null = null;

  constructor(options: EngineOptions) {
    this.o = options;
    const { plan, container } = options;
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

    this.camera.rotation.order = 'YXZ';
    this.scene.background = new THREE.Color(options.look.signGround);
    this.scene.add(new THREE.HemisphereLight(0xfff1dc, 0x5a4630, plan.light.ambient));
    this.ray.firstHitOnly = true;
    this.pos.set(plan.start.x, plan.eye, plan.start.z);
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
    await this.hangPhotos();
  }

  private build(root: THREE.Object3D) {
    const { plan } = this.o;
    root.updateMatrixWorld(true);
    const named = (o: THREE.Object3D, prefixes: readonly string[]) =>
      prefixes.some((p) => o.name.startsWith(p) || (o.parent?.name ?? '').startsWith(p));
    const spotIndex = new Map<string, number>();
    for (const { room, first } of photoRooms(plan)) room.spots.forEach((name, i) => spotIndex.set(name, first + i));
    const photoAt = new Set(this.o.photos.map((p) => p.index));
    const open = openRooms(plan, [...photoAt]);
    const frames: THREE.Mesh[] = [];
    const empty: THREE.Box3[] = [];
    let wallMaterial: THREE.Material | null = null;
    const replaced = new Set<THREE.Material>();

    const meshes: THREE.Mesh[] = [];
    root.traverse((o) => {
      if ((o as THREE.Light).isLight) (o as THREE.Light).intensity *= plan.light.lamps;
      if ((o as THREE.Mesh).isMesh) meshes.push(o as THREE.Mesh);
    });
    for (const mesh of meshes) {
      const mat = mesh.material as THREE.Material;
      if (mat.name === plan.wallMaterial) wallMaterial = mat;
      if (named(mesh, plan.hidden)) {
        mesh.visible = false;
        continue;
      }
      const index = spotIndex.get(mesh.name);
      if (index !== undefined) {
        const geo = mesh.geometry;
        geo.computeBoundingBox();
        const box = geo.boundingBox!.clone().applyMatrix4(mesh.matrixWorld);
        const size = box.getSize(new THREE.Vector3());
        const normal = new THREE.Vector3().fromBufferAttribute(geo.attributes.normal as THREE.BufferAttribute, 0).transformDirection(mesh.matrixWorld);
        const aspect = Math.max(size.x, size.z) / size.y;
        replaced.add(mat);
        if (photoAt.has(index)) {
          this.spots.push({ mesh, center: box.getCenter(new THREE.Vector3()), normal, aspect, index, width: Math.max(size.x, size.z), bottom: box.min.y });
          mesh.visible = false; // until its photo arrives
        } else {
          mesh.visible = false;
          empty.push(box.expandByVector(new THREE.Vector3(0.6, 0.6, 0.6)));
        }
        continue;
      }
      if (named(mesh, plan.frames)) {
        // The model's small plaques: each photo gets the design's own label there instead.
        if (plan.plaques && mat.name === plan.plaques) {
          mesh.visible = false;
          continue;
        }
        frames.push(mesh);
      }
      if (plan.screen && mesh.name === plan.screen) {
        this.screenMesh = mesh;
        continue;
      }
      if (named(mesh, plan.passThrough)) {
        if (mat.transparent) mat.depthWrite = false;
        continue;
      }
      mesh.geometry.computeBoundsTree();
      this.colliders.push(mesh);
    }
    // Spots without a photo lose their frame and label, so no empty frame is ever shown.
    if (empty.length) for (const mesh of frames) this.cut(mesh, empty);
    // The model's own example pictures are never shown: free them.
    for (const m of replaced) {
      (m as THREE.MeshStandardMaterial).map?.dispose();
      m.dispose();
    }
    this.scene.add(root);

    for (const room of plan.rooms) {
      if (room.sign) {
        const sign = root.getObjectByName(room.sign) as THREE.Mesh | undefined;
        const text = this.o.signs[room.key];
        if (sign && open.has(room.key) && text?.text.trim()) this.drawSign(sign, text);
        else if (sign) sign.visible = false;
      }
      if (room.door && !open.has(room.key) && open.has(room.parent ?? '')) this.closeDoor(room.door, wallMaterial);
      const plaque = this.o.plaques[room.key];
      if (room.plaque && open.has(room.key) && (plaque?.title.trim() || plaque?.text.trim())) this.drawPlaque(room.plaque, plaque!);
    }
    for (const spot of this.spots) this.drawLabel(spot);
    if (this.screenMesh) this.drawScreen(this.screenMesh).catch((e) => console.warn('3D gallery screen', e));
  }

  /** Removes the triangles of `mesh` that sit inside any of the boxes (the frame and label around an empty spot). */
  private cut(mesh: THREE.Mesh, boxes: THREE.Box3[]) {
    const geo = mesh.geometry;
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const index = geo.index ? Array.from(geo.index.array) : Array.from({ length: pos.count }, (_, i) => i);
    const a = new THREE.Vector3();
    const b = new THREE.Vector3();
    const c = new THREE.Vector3();
    const kept: number[] = [];
    for (let i = 0; i < index.length; i += 3) {
      a.fromBufferAttribute(pos, index[i]!).applyMatrix4(mesh.matrixWorld);
      b.fromBufferAttribute(pos, index[i + 1]!).applyMatrix4(mesh.matrixWorld);
      c.fromBufferAttribute(pos, index[i + 2]!).applyMatrix4(mesh.matrixWorld);
      const centre = a.add(b).add(c).divideScalar(3);
      if (!boxes.some((box) => box.containsPoint(centre))) kept.push(index[i]!, index[i + 1]!, index[i + 2]!);
    }
    geo.setIndex(kept);
  }

  /** Walls up a doorway on its parent's side, so a room that isn't shown can't be seen or entered. */
  private closeDoor(door: NonNullable<GalleryPlan['rooms'][number]['door']>, material: THREE.Material | null) {
    const along = door.axis[0] !== 0;
    const thick = 0.14;
    const geo = new THREE.BoxGeometry(along ? thick : door.width, door.height, along ? door.width : thick);
    const mat = material ?? new THREE.MeshStandardMaterial({ color: 0xd8cfbd, roughness: 0.6 });
    const wall = new THREE.Mesh(geo, mat);
    const back = door.face - thick / 2 + 0.02;
    wall.position.set(door.x - door.axis[0] * back, door.height / 2, door.z - door.axis[1] * back);
    wall.updateMatrixWorld(true);
    geo.computeBoundsTree();
    this.scene.add(wall);
    this.colliders.push(wall);
    this.disposables.push(geo);
  }

  private drawSign(mesh: THREE.Mesh, sign: EngineSign) {
    const { look } = this.o;
    const geo = mesh.geometry;
    geo.computeBoundingBox();
    const size = geo.boundingBox!.getSize(new THREE.Vector3());
    const aspect = Math.max(size.x, size.z) / size.y;
    const W = 1024;
    const H = Math.round(W / aspect);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = look.signGround;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = look.signInk;
    g.lineWidth = 3;
    g.strokeRect(10, 10, W - 20, H - 20);
    g.fillStyle = look.signInk;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = sign.dir;
    fitText(g, sign.text, W / 2, H / 2 + 2, W - 90, Math.round(H * 0.5), look.font);
    const map = canvasTexture(c, this.renderer);
    mesh.material = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.35, roughness: 0.45, metalness: 0.2, side: THREE.FrontSide });
    this.disposables.push(map, mesh.material as THREE.Material);
  }

  /** A room's plaque on its wall: the room's name and its few words. */
  private drawPlaque(at: NonNullable<GalleryPlan['rooms'][number]['plaque']>, plaque: { title: string; text: string }) {
    const { look, dir } = this.o;
    const W = 1024;
    const g0 = document.createElement('canvas').getContext('2d')!;
    g0.font = `400 38px ${look.textFont}`;
    const lines = plaque.text.trim() ? wrap(g0, plaque.text.trim(), W - 140, 5) : [];
    const H = 70 + (plaque.title.trim() ? 110 : 0) + lines.length * 56 + 60;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = look.signGround;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = look.signInk;
    g.lineWidth = 3;
    g.strokeRect(14, 14, W - 28, H - 28);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = dir;
    g.fillStyle = look.signInk;
    let y = 70;
    if (plaque.title.trim()) {
      fitText(g, plaque.title.trim(), W / 2, y + 40, W - 140, 76, look.font);
      y += 110;
    }
    g.fillStyle = look.screenInk;
    g.font = `400 38px ${look.textFont}`;
    for (const line of lines) {
      g.fillText(line, W / 2, y + 22);
      y += 56;
    }
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    const width = 4;
    const height = (width * H) / W;
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.35, roughness: 0.5 });
    const mesh = new THREE.Mesh(geo, mat);
    const normal = new THREE.Vector3(at.normal[0], 0, at.normal[1]);
    const pos = new THREE.Vector3(at.x, this.o.plan.eye + 1.1, at.z).addScaledVector(normal, 0.03);
    mesh.position.copy(pos);
    mesh.lookAt(pos.clone().add(normal));
    this.scene.add(mesh);
    this.disposables.push(map, geo, mat);
  }

  /** The card under a photo with its title and few words (none when the photo has neither). */
  private drawLabel(spot: Spot) {
    const photo = this.o.photos.find((p) => p.index === spot.index);
    const title = photo?.title?.trim() ?? '';
    const caption = photo?.caption?.trim() ?? '';
    if (!title && !caption) return;
    const { look, dir } = this.o;
    const W = 1024;
    const g0 = document.createElement('canvas').getContext('2d')!;
    g0.font = `400 40px ${look.textFont}`;
    const lines = caption ? wrap(g0, caption, W - 100, 3) : [];
    const H = 40 + (title ? 90 : 0) + lines.length * 54 + 30;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = look.labelGround;
    g.fillRect(0, 0, W, H);
    g.strokeStyle = look.labelLine;
    g.lineWidth = 4;
    g.strokeRect(8, 8, W - 16, H - 16);
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.direction = dir;
    g.fillStyle = look.labelInk;
    let y = 40;
    if (title) {
      fitText(g, title, W / 2, y + 42, W - 100, 66, look.font);
      y += 90;
    }
    g.font = `400 40px ${look.textFont}`;
    g.globalAlpha = 0.85;
    for (const line of lines) {
      g.fillText(line, W / 2, y + 27);
      y += 54;
    }
    const map = new THREE.CanvasTexture(c);
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
    // Label width: most of the photo's; height from its text. Hung just under the frame.
    const width = spot.width * 0.92;
    const height = (width * H) / W;
    const geo = new THREE.PlaneGeometry(width, height);
    const mat = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.3, roughness: 0.7 });
    const label = new THREE.Mesh(geo, mat);
    const at = spot.center.clone().addScaledVector(spot.normal, 0.02);
    at.y = spot.bottom - 0.3 - height / 2;
    label.position.copy(at);
    label.lookAt(at.clone().add(spot.normal));
    this.scene.add(label);
    this.disposables.push(map, geo, mat);
  }

  private async drawScreen(mesh: THREE.Mesh) {
    const { screen, look } = this.o;
    const W = 1280;
    const H = 720;
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    const g = c.getContext('2d')!;
    g.fillStyle = look.screenGround;
    g.fillRect(0, 0, W, H);
    const img = screen?.image ? await loadImage(screen.image) : null;
    if (!this.alive) return;
    if (img) {
      const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);
      g.drawImage(img, (W - img.naturalWidth * s) / 2, (H - img.naturalHeight * s) / 2, img.naturalWidth * s, img.naturalHeight * s);
    }
    if (screen?.play && img) {
      g.fillStyle = 'rgba(0,0,0,.28)';
      g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(255,255,255,.92)';
      g.beginPath();
      g.arc(W / 2, H / 2, 74, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = look.screenGround;
      g.beginPath();
      g.moveTo(W / 2 - 22, H / 2 - 36);
      g.lineTo(W / 2 + 40, H / 2);
      g.lineTo(W / 2 - 22, H / 2 + 36);
      g.closePath();
      g.fill();
    } else if (!img && screen?.title) {
      g.fillStyle = look.screenInk;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.direction = screen.dir;
      g.font = `400 40px ${look.font}`;
      const lines = screen.body ? wrap(g, screen.body, W - 220, 6) : [];
      // The title and the text as one block, centred on the screen.
      const top = (H - (120 + lines.length * 58)) / 2;
      fitText(g, screen.title, W / 2, top + 50, W - 160, 96, look.font);
      g.font = `400 40px ${look.font}`;
      lines.forEach((line, i) => g.fillText(line, W / 2, top + 150 + i * 58));
    }
    const map = canvasTexture(c, this.renderer);
    mesh.material = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.55, roughness: 0.3, side: THREE.FrontSide });
    this.disposables.push(map, mesh.material as THREE.Material);
    this.dirty = true;
    this.kick();
  }

  /** Loads every photo and puts it on its spot (nearest rooms first, as they come). */
  private async hangPhotos() {
    const width = Math.min(window.innerWidth, window.innerHeight) < 700 ? 512 : 768;
    const bySrc = new Map<string, Promise<HTMLImageElement | null>>();
    const photos = new Map(this.o.photos.map((p) => [p.index, p]));
    await Promise.all(
      this.spots.map(async (spot) => {
        const photo = photos.get(spot.index)!;
        if (!bySrc.has(photo.src)) bySrc.set(photo.src, loadImage(photo.src));
        const img = await bySrc.get(photo.src)!;
        if (!img || !this.alive) return;
        const map = canvasTexture(framed(img, spot.aspect, width, photo.focus), this.renderer);
        this.remapUv(spot.mesh);
        spot.mesh.material = new THREE.MeshStandardMaterial({ map, emissive: 0xffffff, emissiveMap: map, emissiveIntensity: 0.14, roughness: 0.55 });
        spot.mesh.visible = true;
        this.disposables.push(map, spot.mesh.material as THREE.Material);
        this.dirty = true;
        this.kick();
      }),
    );
  }

  /** A spot's corners mapped to the whole picture (the model maps each spot to its own part of one big image). */
  private remapUv(mesh: THREE.Mesh) {
    const uv = mesh.geometry.attributes.uv as THREE.BufferAttribute;
    let u0 = Infinity;
    let u1 = -Infinity;
    let v0 = Infinity;
    let v1 = -Infinity;
    for (let i = 0; i < uv.count; i++) {
      u0 = Math.min(u0, uv.getX(i));
      u1 = Math.max(u1, uv.getX(i));
      v0 = Math.min(v0, uv.getY(i));
      v1 = Math.max(v1, uv.getY(i));
    }
    const out = uv.clone();
    for (let i = 0; i < uv.count; i++) out.setXY(i, (uv.getX(i) - u0) / (u1 - u0 || 1), (uv.getY(i) - v0) / (v1 - v0 || 1));
    mesh.geometry.setAttribute('uv', out);
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
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    d.x = e.clientX;
    d.y = e.clientY;
    d.moved += Math.abs(dx) + Math.abs(dy);
    if (d.moved < 6) return;
    const k = e.pointerType === 'touch' ? 0.0055 : 0.0035;
    this.yaw += dx * k;
    this.pitch = THREE.MathUtils.clamp(this.pitch + dy * k, -1.1, 1.1);
    this.stopWalk();
    this.dirty = true;
    this.kick();
  };
  private onUp = (e: PointerEvent) => {
    if (this.drag && this.drag.moved < 6) this.pick(e.clientX, e.clientY);
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

  /** The joystick's position, each axis −1…1 (y down = backwards). */
  setStick(x: number, y: number) {
    this.stick = { x, y };
    if (x || y) this.kick();
  }

  private pick(clientX: number, clientY: number) {
    const r = this.renderer.domElement.getBoundingClientRect();
    this.ray.setFromCamera(new THREE.Vector2(((clientX - r.left) / r.width) * 2 - 1, -((clientY - r.top) / r.height) * 2 + 1), this.camera);
    this.ray.far = 60;
    const targets: THREE.Object3D[] = [...this.spots.filter((s) => s.mesh.visible).map((s) => s.mesh), ...this.colliders];
    if (this.screenMesh) targets.push(this.screenMesh);
    const hit = this.ray.intersectObjects(targets, false)[0];
    if (!hit) return;
    if (hit.object === this.screenMesh) return this.o.onScreen();
    const spot = this.spots.find((s) => s.mesh === hit.object);
    if (spot) this.goToPhoto(spot.index);
  }

  // ---- walking ----

  /** The photos on the walls, in place order. */
  photoOrder(): number[] {
    return this.spots.map((s) => s.index).sort((a, b) => a - b);
  }

  goToPhoto(index: number) {
    const spot = this.spots.find((s) => s.index === index);
    if (!spot) return;
    const { plan } = this.o;
    const phone = this.camera.aspect < 1;
    const dist = phone ? plan.view.phone : plan.view.distance;
    const tilt = (phone ? plan.view.tilt?.phone : plan.view.tilt?.computer) ?? TILT;
    const to = spot.center.clone().addScaledVector(spot.normal, dist);
    const look = spot.center.clone().sub(new THREE.Vector3(to.x, plan.eye, to.z));
    // Look up only part of the way: a level camera keeps the frame's sides upright, and the picture still fits above
    // the middle of the view.
    this.walkTo([to.x, to.z], Math.atan2(-look.x, -look.z), Math.atan2(look.y, Math.hypot(look.x, look.z)) * tilt, index);
  }

  goToStart() {
    const { start } = this.o.plan;
    this.walkTo([start.x, start.z], start.yaw, 0, null);
  }

  private walkTo(to: Point, yaw: number, pitch: number, view: number | null) {
    const pts: Point[] = [[this.pos.x, this.pos.z], ...route(this.o.plan, [this.pos.x, this.pos.z], to)];
    const lengths: number[] = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i]![0] - pts[i - 1]![0], pts[i]![1] - pts[i - 1]![1]);
      lengths.push(l);
      total += l;
    }
    this.setViewing(null);
    this.walk = { pts, lengths, total, done: this.o.reducedMotion ? total : 0, yaw, pitch, view };
    this.kick();
  }

  private stopWalk() {
    if (this.walk) this.walk = null;
    this.setViewing(null);
  }

  private setViewing(index: number | null) {
    if (this.viewing === index) return;
    this.viewing = index;
    this.o.onView(index);
  }

  private blocked(dir: THREE.Vector3, dist: number) {
    const eye = this.o.plan.eye;
    for (const h of [0.25, 0.6, 0.95]) {
      this.ray.set(new THREE.Vector3(this.pos.x, eye * h, this.pos.z), dir);
      this.ray.far = dist + RADIUS;
      if (this.ray.intersectObjects(this.colliders, false).length) return true;
    }
    return false;
  }

  private step(dx: number, dz: number) {
    const len = Math.hypot(dx, dz);
    if (!len) return;
    if (!this.blocked(new THREE.Vector3(dx / len, 0, dz / len), len)) {
      this.pos.x += dx;
      this.pos.z += dz;
      return;
    }
    // Slide along the wall.
    if (dx && !this.blocked(new THREE.Vector3(Math.sign(dx), 0, 0), Math.abs(dx))) this.pos.x += dx;
    if (dz && !this.blocked(new THREE.Vector3(0, 0, Math.sign(dz)), Math.abs(dz))) this.pos.z += dz;
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
    if (this.keys.has('ArrowLeft') || this.keys.has('ArrowRight')) {
      moving = true;
      this.stopWalk();
    }
    f -= this.stick.y;
    s += this.stick.x;
    if (f || s) {
      moving = true;
      this.stopWalk();
      const len = Math.max(1, Math.hypot(f, s));
      const fx = -Math.sin(this.yaw);
      const fz = -Math.cos(this.yaw);
      this.step(((fx * f - fz * s) / len) * SPEED * dt, ((fz * f + fx * s) / len) * SPEED * dt);
    }

    const w = this.walk;
    if (w) {
      moving = true;
      const left = w.total - w.done;
      w.done = Math.min(w.total, w.done + Math.min(6, 1.2 + left * 1.6, 1.2 + w.done * 3) * dt);
      let d = w.done;
      let i = 0;
      while (i < w.lengths.length - 1 && d > w.lengths[i]!) {
        d -= w.lengths[i]!;
        i++;
      }
      const [ax, az] = w.pts[i]!;
      const [bx, bz] = w.pts[i + 1] ?? w.pts[i]!;
      const t = w.lengths[i] ? Math.min(1, d / w.lengths[i]!) : 1;
      this.pos.x = ax + (bx - ax) * t;
      this.pos.z = az + (bz - az) * t;
      const near = w.total - w.done < 3.5;
      const yawTo = near || (bx === ax && bz === az) ? w.yaw : Math.atan2(-(bx - ax), -(bz - az));
      const k = 1 - Math.exp(-dt * (near ? 5 : 4));
      this.yaw += wrapYaw(yawTo - this.yaw) * k;
      this.pitch += ((near ? w.pitch : 0) - this.pitch) * k;
      const arrived = w.done >= w.total && Math.abs(wrapYaw(w.yaw - this.yaw)) < 0.01 && Math.abs(w.pitch - this.pitch) < 0.01;
      if (arrived || (this.o.reducedMotion && w.done >= w.total)) {
        this.yaw = w.yaw;
        this.pitch = w.pitch;
        this.walk = null;
        this.setViewing(w.view);
      }
    }

    if (moving) this.checkRoom();
    if (moving || this.dirty) {
      this.camera.position.copy(this.pos);
      this.camera.rotation.set(this.pitch, this.yaw, 0);
      this.renderer.render(this.scene, this.camera);
      this.dirty = false;
    }
    if (moving) this.kick();
  };

  /** Tells the design when the visitor walks into another room. */
  private checkRoom() {
    const key = roomAt(this.o.plan, this.pos.x, this.pos.z).key;
    if (key === this.room) return;
    this.room = key;
    this.o.onRoom(key);
  }

  private resize() {
    const el = this.o.container;
    const w = el.clientWidth || 1;
    const h = el.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    this.camera.fov = w < h ? 78 : 66;
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
    canvas.removeEventListener('pointercancel', this.onCancel);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('blur', this.onBlur);
    this.scene.traverse((o) => {
      const m = o as THREE.Mesh;
      if (m.isMesh) {
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
  }
}
