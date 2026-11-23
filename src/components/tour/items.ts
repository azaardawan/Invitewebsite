/**
 * The items of a tour's model (owner, 2026-11-23): every piece of furniture and decor is a node `ITEM_<code>` (its
 * extras' `label` says what it is), so the owner can move and turn each one in Admin → Tours → the editor, and name it
 * by its code ("#37"). Their changes (`TourEdits`) are applied when the tour loads; visitors then get all the items
 * merged again into a few meshes (a phone draws them in few calls).
 */
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

/** An item's change: moved by x, y, z (metres) and turned by ry (radians, round the vertical). */
export type ItemEdit = { x?: number; y?: number; z?: number; ry?: number };
export type TourEdits = Record<string, ItemEdit>;

export type Item = { code: string; label: string; node: THREE.Object3D; basePos: THREE.Vector3; baseQuat: THREE.Quaternion };

const UP = new THREE.Vector3(0, 1, 0);

/** The model's items, by code. */
export function collectItems(root: THREE.Object3D): Map<string, Item> {
  const items = new Map<string, Item>();
  root.traverse((o) => {
    const m = /^ITEM_(\w+)/.exec(o.name);
    if (!m) return;
    const code = m[1]!;
    if (items.has(code)) return;
    const label = String((o.userData as { label?: unknown }).label ?? 'item');
    items.set(code, { code, label, node: o, basePos: o.position.clone(), baseQuat: o.quaternion.clone() });
  });
  return items;
}

/** Puts an item where its change says (from where the model has it). */
export function applyEdit(item: Item, edit: ItemEdit | undefined) {
  item.node.position.copy(item.basePos).add(new THREE.Vector3(edit?.x ?? 0, edit?.y ?? 0, edit?.z ?? 0));
  item.node.quaternion.setFromAxisAngle(UP, edit?.ry ?? 0).multiply(item.baseQuat);
  item.node.updateMatrixWorld(true);
}

/** The change that puts an item where it now is (rounded to the millimetre and the tenth of a degree). */
export function editOf(item: Item): ItemEdit {
  const d = item.node.position.clone().sub(item.basePos);
  const q = item.node.quaternion.clone().multiply(item.baseQuat.clone().invert());
  const ry = 2 * Math.atan2(q.y, q.w);
  const mm = (n: number) => Math.round(n * 1000) / 1000;
  const e: ItemEdit = {};
  if (Math.abs(d.x) >= 0.0005) e.x = mm(d.x);
  if (Math.abs(d.y) >= 0.0005) e.y = mm(d.y);
  if (Math.abs(d.z) >= 0.0005) e.z = mm(d.z);
  const r = Math.atan2(Math.sin(ry), Math.cos(ry));
  if (Math.abs(r) >= 0.0009) e.ry = Math.round(r * 10000) / 10000;
  return e;
}

/**
 * For visitors: every item's meshes merged into the model's own (by material, and walk-through / invisible wall /
 * solid), in the world where the owner's changes put them. The item nodes stay (their seats go with them).
 */
export function mergeItems(root: THREE.Object3D, items: Map<string, Item>) {
  root.updateMatrixWorld(true);
  const buckets = new Map<string, { mat: THREE.Material; name: string; geos: THREE.BufferGeometry[] }>();
  const done: THREE.Mesh[] = [];
  for (const item of items.values())
    item.node.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh || Array.isArray(m.material)) return;
      const prefix = /^NOCOLLIDE/i.test(m.name) ? 'NOCOLLIDE_' : /^COLLIDER/i.test(m.name) ? 'COLLIDER_' : 'part_';
      const g = m.geometry.clone();
      for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
      if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position!.count * 2), 2));
      if (!g.attributes.normal) g.computeVertexNormals();
      if (!g.index) g.setIndex([...Array(g.attributes.position!.count).keys()]);
      g.applyMatrix4(m.matrixWorld);
      const key = m.material.uuid + prefix;
      if (!buckets.has(key)) buckets.set(key, { mat: m.material, name: prefix, geos: [] });
      buckets.get(key)!.geos.push(g);
      done.push(m);
    });
  const into = new THREE.Group();
  into.name = 'ITEMS';
  let n = 0;
  for (const b of buckets.values()) {
    const merged = mergeGeometries(b.geos, false);
    for (const g of b.geos) g.dispose();
    if (!merged) continue;
    const mesh = new THREE.Mesh(merged, b.mat);
    mesh.name = b.name + 'items_' + n++;
    into.add(mesh);
  }
  for (const m of done) {
    m.removeFromParent();
    m.geometry.dispose();
  }
  root.add(into);
  root.updateMatrixWorld(true);
}
