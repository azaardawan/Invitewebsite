// The café's walkways (owner, 2026-11-23: a seated visitor calls the waiter, who walks to them, to the counter and back):
// points along the aisles (`NAV_<n>`, their extras' `links` = the points reached in a straight, clear line), and for
// each seat the point the waiter comes from and where he stands by it. The build checks every line against the
// furniture's blocks and tells which ones are in the way.
import * as THREE from 'three';
import { root } from './lib.js';

const FI = -1.24,
  FT = -1.45;
// [x, z, floor]
export const NAV = [
  [0.75, 4.55, FI], // 0 at the counter (where an order is picked up)
  [0.3, 3.6, FI], // 1
  [0.3, 2.35, FI], // 2
  [0.3, 1.15, FI], // 3
  [0.3, -0.25, FI], // 4
  [0.3, -2.4, FI], // 5
  [-1.0, -3.2, FI], // 6 into the lounge
  [-1.0, -5.5, FI], // 7
  [-1.0, -7.3, FI], // 8
  [-1.3, 1.15, FI], // 9 by the first round table
  [-1.3, 2.35, FI], // 10 by the second
  [-2.45, -0.4, FI], // 11 by the walnut table
  [0.75, -1.3, FI], // 12 by the tall table
  [1.2, 4.2, FI], // 13 the door to the terrace
  [2.7, 4.2, FT], // 14 outside it
  [4.15, 4.2, FT], // 15
  [4.2, -0.45, FT], // 16
  [4.2, -3.1, FT], // 17
  [4.2, -6.0, FT], // 18
  [4.7, -8.0, FT], // 19 by the reclining chairs
  [3.95, 6.3, FT], // 20
  [4.3, 8.0, FT], // 21
  [5.1, 9.0, FT], // 22 the south corner
  [-1.6, 3.6, FI], // 23
  [-2.4, -2.9, FI], // 24 behind the long table's chairs
  [-1.0, -9.0, FI], // 25 the lounge's far end
  [-2.4, -7.3, FI], // 26 between the sofa and the olive chairs
  [0.9, -8.2, FI], // 27 on the red rug
  [3.3, 8.45, FT], // 28 between the window pair and the corner
  [4.6, 11.2, FT], // 29 the terrace's south end
  [3.3, 11.25, FT], // 30 behind the corner table
];
const LINKS = [
  [0, 1], [0, 13], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [3, 9], [2, 10], [4, 11], [4, 12], [12, 5],
  [1, 13], [13, 14], [14, 15], [15, 16], [16, 17], [17, 18], [18, 19], [15, 20], [20, 21], [21, 22], [1, 23], [6, 24],
  [8, 25], [7, 26], [8, 27], [21, 28], [22, 29], [29, 30],
];

/** Adds the walkway points, links each seat to the nearest one it can be reached from, and reports blocked lines. */
export function walkways(seats) {
  root.updateMatrixWorld(true);
  const solid = [];
  root.traverse((o) => {
    if (!o.isMesh) return;
    let skip = false;
    for (let p = o; p; p = p.parent) if (/^(NOCOLLIDE|BARISTA|CLEANER)/.test(p.name)) skip = true;
    if (!skip) solid.push(o);
  });
  const ray = new THREE.Raycaster();
  // a straight walk at knee and hip height (the furniture's blocks are 1.1 m high), 15 cm to each side
  const clear = (a, b) => {
    const d = new THREE.Vector3(b.x - a.x, 0, b.z - a.z);
    const len = d.length();
    if (len < 0.01) return true;
    d.normalize();
    const side = new THREE.Vector3(-d.z, 0, d.x);
    for (const h of [0.35, 0.9])
      for (const s of [-0.15, 0, 0.15]) {
        ray.set(new THREE.Vector3(a.x + side.x * s, Math.max(a.y, b.y) + h, a.z + side.z * s), d);
        ray.far = len;
        if (ray.intersectObjects(solid, false).length) return false;
      }
    return true;
  };
  // nothing there to stand in (furniture, a table): looking down, the first thing met is the floor
  const onFloor = (p) => {
    ray.set(new THREE.Vector3(p.x, p.y + 1.6, p.z), new THREE.Vector3(0, -1, 0));
    ray.far = 1.75;
    for (const dx of [-0.15, 0, 0.15])
      for (const dz of [-0.15, 0, 0.15]) {
        ray.set(new THREE.Vector3(p.x + dx, p.y + 1.6, p.z + dz), new THREE.Vector3(0, -1, 0));
        const hit = ray.intersectObjects(solid, false)[0];
        if (!hit || hit.point.y > p.y + 0.06) return false;
      }
    return true;
  };
  const pts = NAV.map(([x, z, y]) => new THREE.Vector3(x, y, z));
  const links = pts.map(() => []);
  for (const [a, b] of LINKS) {
    if (!clear(pts[a], pts[b])) console.log(`walkway ${a}-${b} blocked`);
    links[a].push(b);
    links[b].push(a);
  }
  pts.forEach((p, i) => {
    const o = new THREE.Object3D();
    o.name = `NAV_${i}`;
    o.position.copy(p);
    o.userData = { links: links[i] };
    root.add(o);
  });
  // each seat: the nearest walkway point from which a spot beside the seat is reached in a clear line
  let unreached = 0;
  return seats.map((s) => {
    const at = s.g.localToWorld(new THREE.Vector3(s.dx, 0, s.dz * s.fwd));
    const floor = s.g.getWorldPosition(new THREE.Vector3()).y;
    at.y = floor;
    const fwd = new THREE.Vector3(0, 0, s.fwd).transformDirection(s.g.matrixWorld).setY(0).normalize();
    // a spot in front of the seated visitor, a little to one side (so they see him), on free floor, reached in a clear
    // line from a walkway point on the same floor
    for (const ang of [0.8, -0.8, 1.15, -1.15, 0.45, -0.45, 1.55, -1.55, 2.2, -2.2])
      for (const r of [1.3, 1.1, 1.5, 0.9, 1.75]) {
        const dir = fwd.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), ang);
        const stand = at.clone().addScaledVector(dir, r);
        if (!onFloor(stand)) continue;
        const order = pts.map((p, i) => ({ i, d: p.distanceTo(stand) })).sort((a, b) => a.d - b.d);
        for (const { i } of order.slice(0, 5)) {
          const p = pts[i];
          if (Math.abs(p.y - floor) > 0.3) continue;
          if (clear(p, stand)) return { nav: i, stand: [stand.x, floor, stand.z].map((n) => Math.round(n * 1000) / 1000) };
        }
      }
    unreached++;
    console.log(`seat at ${at.x.toFixed(2)},${at.z.toFixed(2)}: no clear way for the waiter`);
    return null;
  }).map((r, k, all) => {
    if (k === all.length - 1 && unreached) console.log(`walkways: ${unreached} seats unreached`);
    return r;
  });
}
