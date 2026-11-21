/**
 * What `<World3D>` adds to or changes in a design's model (three.js only, loaded with the engine): smooth round shapes,
 * textured paint, ceilings, photo places moved clear of furniture, and real drawers in their housings.
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { decorTexture, tilesTexture, worldUv } from '../gallery3d/decor';
import { loadImage } from '../gallery3d/draw';
import type { Box, DoorBuild, DrawerBuild, Rect } from './plan';

/**
 * A shape drawn smoothly round, in the same box: a sphere (an ellipsoid), an upright cylinder, or a box with soft
 * rounded edges (cushions, a bed).
 */
export function roundify(mesh: THREE.Mesh, kind: 'sphere' | 'cylinder' | 'soft') {
  const old = mesh.geometry;
  old.computeBoundingBox();
  const box = old.boundingBox!;
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  let geo: THREE.BufferGeometry;
  if (kind === 'soft') {
    const r = Math.min(size.x, size.y, size.z) * 0.32;
    geo = new RoundedBoxGeometry(size.x || 0.001, size.y || 0.001, size.z || 0.001, 4, r);
  } else {
    geo = kind === 'sphere' ? new THREE.SphereGeometry(0.5, 40, 24) : new THREE.CylinderGeometry(0.5, 0.5, 1, 48, 1);
    geo.scale(size.x || 0.001, size.y || 0.001, size.z || 0.001);
  }
  geo.translate(center.x, center.y, center.z);
  // The model's own colour (its vertex colours) carried over.
  const color = old.attributes.color as THREE.BufferAttribute | undefined;
  if (color) {
    const c = [color.getX(0), color.getY(0), color.getZ(0)];
    const n = geo.attributes.position!.count;
    const out = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) out.set(c, i * 3);
    geo.setAttribute('color', new THREE.BufferAttribute(out, 3));
  }
  mesh.geometry = geo;
  old.dispose();
  const m = mesh.material as THREE.MeshStandardMaterial;
  // Round things are lit smoothly (the rest of the model stays crisp).
  if (m.flatShading) {
    const smooth = m.clone();
    smooth.flatShading = false;
    smooth.needsUpdate = true;
    mesh.material = smooth;
  }
}

/** A colour slot's paint with a texture (plaster or tiles), mapped by each surface's place in the world. */
export async function texturePaint(
  material: THREE.MeshStandardMaterial,
  meshes: readonly THREE.Mesh[],
  spec: { kind: 'plaster' | 'tiles'; size: number } | { kind: 'image'; src: string; size: number },
  renderer: THREE.WebGLRenderer,
): Promise<THREE.Texture | null> {
  if (spec.kind === 'image') {
    // The design's own picture (a wallpaper, a floor): light and shade around white, tinted by the paint.
    const img = await loadImage(spec.src);
    if (!img) return null;
    const map = new THREE.Texture(img);
    map.colorSpace = THREE.SRGBColorSpace;
    map.wrapS = map.wrapT = THREE.RepeatWrapping;
    map.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    map.needsUpdate = true;
    material.map = map;
    material.bumpMap = map;
    material.bumpScale = 0.4;
    material.needsUpdate = true;
    for (const m of meshes) worldUv(m, spec.size);
    return map;
  }
  // Painted plaster: a fine, even grain (no clouds, no joints); and light tiles with a gentle relief.
  const canvas = spec.kind === 'plaster' ? paintTexture() : tilesTexture('#ffffff', '#efeae3', '#cfc4b6');
  const map = decorTexture(canvas, renderer, true);
  material.map = map;
  material.bumpMap = map;
  material.bumpScale = spec.kind === 'plaster' ? 0.3 : 0.35;
  material.needsUpdate = true;
  for (const m of meshes) worldUv(m, spec.size);
  return map;
}

/** Smooth painted plaster: an even, fine grain and the faint strokes of a roller, nearly white (the paint gives the colour). */
function paintTexture(): HTMLCanvasElement {
  const S = 512;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fbfaf8';
  g.fillRect(0, 0, S, S);
  let seed = 3;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  // The roller's strokes: long, very faint bands.
  for (let i = 0; i < 40; i++) {
    const y = rnd() * S;
    g.fillStyle = rnd() < 0.5 ? 'rgba(0,0,0,0.006)' : 'rgba(255,255,255,0.025)';
    g.fillRect(0, y, S, 4 + rnd() * 18);
  }
  // A fine grain.
  const img = g.getImageData(0, 0, S, S);
  for (let i = 0; i < img.data.length; i += 4) {
    const n = (rnd() - 0.5) * 10;
    img.data[i] = img.data[i]! + n;
    img.data[i + 1] = img.data[i + 1]! + n;
    img.data[i + 2] = img.data[i + 2]! + n;
  }
  g.putImageData(img, 0, 0);
  return c;
}

/** Flat ceilings facing down. */
export function ceilings(at: readonly (Rect & { y: number })[], material: THREE.Material): THREE.Mesh[] {
  return at.map((c) => {
    const geo = new THREE.PlaneGeometry(c.maxX - c.minX, c.maxZ - c.minZ);
    geo.rotateX(Math.PI / 2);
    geo.translate((c.minX + c.maxX) / 2, c.y, (c.minZ + c.maxZ) / 2);
    const mesh = new THREE.Mesh(geo, material);
    mesh.name = 'WORLD_CEILING';
    return mesh;
  });
}

/** Moves parts of the model by `by` and scales them by `scale` about `pivot` (all in the world). */
export function moveParts(parts: readonly THREE.Object3D[], move: { by?: readonly [number, number, number]; scale?: number; pivot?: readonly [number, number, number] }) {
  if (!parts.length) return;
  const box = new THREE.Box3();
  for (const p of parts) box.expandByObject(p);
  const c = move.pivot ? new THREE.Vector3(...move.pivot) : box.getCenter(new THREE.Vector3());
  const s = move.scale ?? 1;
  const [dx, dy, dz] = move.by ?? [0, 0, 0];
  const m = new THREE.Matrix4()
    .makeTranslation(c.x + dx, c.y + dy, c.z + dz)
    .multiply(new THREE.Matrix4().makeScale(s, s, s))
    .multiply(new THREE.Matrix4().makeTranslation(-c.x, -c.y, -c.z));
  for (const p of parts) {
    p.updateMatrixWorld(true);
    const world = m.clone().multiply(p.matrixWorld);
    const parentInverse = p.parent ? p.parent.matrixWorld.clone().invert() : new THREE.Matrix4();
    parentInverse.multiply(world).decompose(p.position, p.quaternion, p.scale);
    p.updateMatrixWorld(true);
  }
}

/** A round pedestal (a stand for a cake). */
export function stand(s: { x: number; z: number; y0: number; y1: number; radius: number }, material: THREE.Material): THREE.Mesh {
  const geo = new THREE.CylinderGeometry(s.radius * 0.8, s.radius, s.y1 - s.y0, 48);
  geo.translate(s.x, (s.y0 + s.y1) / 2, s.z);
  const m = new THREE.Mesh(geo, material);
  m.name = 'WORLD_STAND';
  return m;
}

/** A door in a doorway: its panel with raised panels' lines and a round knob near the far edge from the hinge. */
export function buildDoor(build: DoorBuild, hinge: 'min' | 'max', paint: (slot: string) => THREE.Material) {
  const lo = new THREE.Vector3(...build.panel.min);
  const hi = new THREE.Vector3(...build.panel.max);
  const size = hi.clone().sub(lo);
  const wide = size.x > size.z ? 'x' : 'z';
  const thin = wide === 'x' ? 'z' : 'x';
  const panel = new THREE.Mesh(new THREE.BoxGeometry(size.x, size.y, size.z), paint(build.paint.panel));
  panel.position.copy(lo.clone().add(hi).multiplyScalar(0.5));
  const parts: THREE.Mesh[] = [panel];
  // A knob on each face, a hand's width from the edge away from the hinge, at hand height.
  const r = 0.04;
  for (const side of [-1, 1]) {
    const knob = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), paint(build.paint.knob));
    knob.position.copy(panel.position);
    knob.position.y = lo.y + Math.min(1.0, size.y * 0.42);
    knob.position[wide] = hinge === 'min' ? hi[wide] - 0.12 : lo[wide] + 0.12;
    knob.position[thin] = panel.position[thin] + side * (size[thin] / 2 + r * 0.7);
    parts.push(knob);
  }
  return parts;
}

/** Black lines on a mesh's edges (as its child, so they move with it): something that opens. */
export function outline(mesh: THREE.Mesh, material: THREE.LineBasicMaterial) {
  const lines = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry, 25), material);
  lines.name = 'WORLD_OUTLINE';
  lines.raycast = () => {};
  mesh.add(lines);
  return lines;
}

/** Moves a photo place (and its frame and glass) up or down, and makes it smaller about its middle. */
export function movePhoto(parts: readonly THREE.Object3D[], center: THREE.Vector3, move: { dy?: number; scale?: number }) {
  const s = move.scale ?? 1;
  const m = new THREE.Matrix4()
    .makeTranslation(center.x, center.y + (move.dy ?? 0), center.z)
    .multiply(new THREE.Matrix4().makeScale(s, s, 1))
    .multiply(new THREE.Matrix4().makeTranslation(-center.x, -center.y, -center.z));
  for (const p of parts) {
    p.updateMatrixWorld(true);
    const world = m.clone().multiply(p.matrixWorld);
    const parentInverse = p.parent ? p.parent.matrixWorld.clone().invert() : new THREE.Matrix4();
    parentInverse.multiply(world).decompose(p.position, p.quaternion, p.scale);
    p.updateMatrixWorld(true);
  }
}

const vec = (v: readonly [number, number, number]) => new THREE.Vector3(v[0], v[1], v[2]);

/** A box mesh between two corners (in the world). */
function slab(min: THREE.Vector3, max: THREE.Vector3, material: THREE.Material): THREE.Mesh | null {
  const size = max.clone().sub(min);
  if (size.x <= 0.001 || size.y <= 0.001 || size.z <= 0.001) return null;
  const geo = new THREE.BoxGeometry(size.x, size.y, size.z);
  geo.translate((min.x + max.x) / 2, (min.y + max.y) / 2, (min.z + max.z) / 2);
  return new THREE.Mesh(geo, material);
}

/**
 * A real drawer, closed at `build.drawer`, sliding out along `slide`: a front panel with a round knob, sides, a back and
 * a bottom; and its housing with an opening the drawer fits (the housing's solid parts around and behind the opening).
 */
export function buildDrawer(build: DrawerBuild, slide: readonly [number, number], paint: (slot: string) => THREE.Material) {
  const alongX = Math.abs(slide[0]) > Math.abs(slide[1]);
  const out = Math.sign(alongX ? slide[0] : slide[1]) || -1;
  const a = alongX ? 'x' : 'z'; // the axis it slides on
  const b = alongX ? 'z' : 'x'; // across it
  const lo = vec(build.drawer.min);
  const hi = vec(build.drawer.max);
  const front = out < 0 ? lo[a] : hi[a];
  const back = out < 0 ? hi[a] : lo[a];
  const T = 0.022; // board thickness
  const FRONT = 0.03;
  const at = (alongValue: [number, number], acrossValue: [number, number], y: [number, number]) => {
    const min = new THREE.Vector3();
    const max = new THREE.Vector3();
    min[a] = Math.min(...alongValue);
    max[a] = Math.max(...alongValue);
    min[b] = Math.min(...acrossValue);
    max[b] = Math.max(...acrossValue);
    min.y = y[0];
    max.y = y[1];
    return [min, max] as const;
  };
  const inward = -out;
  const drawer: THREE.Mesh[] = [];
  const add = (list: THREE.Mesh[], m: THREE.Mesh | null) => m && list.push(m);
  const across: [number, number] = [lo[b], hi[b]];
  const height: [number, number] = [lo.y, hi.y];
  const wallTop = lo.y + (hi.y - lo.y) * 0.82;
  // The front, a little proud of the housing so it reads as a drawer.
  add(drawer, slab(...at([front, front + inward * FRONT], across, height), paint(build.paint.front)));
  const inner: [number, number] = [front + inward * FRONT, back];
  add(drawer, slab(...at(inner, [lo[b], lo[b] + T], [lo.y, wallTop]), paint(build.paint.inside)));
  add(drawer, slab(...at(inner, [hi[b] - T, hi[b]], [lo.y, wallTop]), paint(build.paint.inside)));
  add(drawer, slab(...at([back - inward * T, back], across, [lo.y, wallTop]), paint(build.paint.inside)));
  add(drawer, slab(...at(inner, across, [lo.y, lo.y + T]), paint(build.paint.inside)));
  // A round knob in the middle of the front.
  const r = Math.min(0.035, (hi.y - lo.y) * 0.2);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 16), paint(build.paint.knob));
  knob.position.set((lo.x + hi.x) / 2, (lo.y + hi.y) / 2, (lo.z + hi.z) / 2);
  knob.position[a] = front + out * r * 0.8;
  drawer.push(knob);

  // The housing around the opening (a small gap round the drawer), solid behind it.
  const housing: THREE.Mesh[] = [];
  if (build.housing) {
    const H = { lo: vec(build.housing.min), hi: vec(build.housing.max) };
    const g = 0.006;
    const c = { lo: lo.clone().subScalar(g), hi: hi.clone().addScalar(g) };
    const m = paint(build.paint.housing);
    const hAlong: [number, number] = [H.lo[a], H.hi[a]];
    const hAcross: [number, number] = [H.lo[b], H.hi[b]];
    add(housing, slab(...at(hAlong, hAcross, [H.lo.y, c.lo.y]), m)); // below
    add(housing, slab(...at(hAlong, hAcross, [c.hi.y, H.hi.y]), m)); // above
    add(housing, slab(...at(hAlong, [H.lo[b], c.lo[b]], [c.lo.y, c.hi.y]), m)); // one side
    add(housing, slab(...at(hAlong, [c.hi[b], H.hi[b]], [c.lo.y, c.hi.y]), m)); // the other
    // Behind the drawer, to the housing's back.
    const behind: [number, number] = out < 0 ? [c.hi[a], H.hi[a]] : [H.lo[a], c.lo[a]];
    add(housing, slab(...at(behind, [c.lo[b], c.hi[b]], [c.lo.y, c.hi.y]), m));
    // The opening's inside (dark, so the drawer reads as going in).
    const shade = new THREE.MeshStandardMaterial({ color: 0x5a3a48, roughness: 1 });
    add(housing, slab(...at(out < 0 ? [c.hi[a] - 0.004, c.hi[a]] : [c.lo[a], c.lo[a] + 0.004], [c.lo[b], c.hi[b]], [c.lo.y, c.hi.y]), shade));
  }
  return { drawer, housing, center: lo.clone().add(hi).multiplyScalar(0.5) };
}

export type { Box };
