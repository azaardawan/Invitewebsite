// Where everything stands, read from the scan's floor plan (metres, the scan's own axes).
import * as THREE from 'three';
import { mat, rbox, cyl, rod, ball, slab, drawTex, group, contactShadow, rr, rnd, GLASS, add, speckleTex } from './lib.js';
import * as F from './furniture.js';
const { C, M } = F;

const FI = -1.24,
  FT = -1.45,
  XW = -4.1,
  XF = 2.1,
  ZN = -11.2;
const E = Math.PI / 2; // turn to face +x (east)
const Wt = -Math.PI / 2; // face -x (west)
const N = Math.PI; // face -z (north)

// ---------- textures for rugs and art ----------
const rugRed = drawTex(512, 512, (g, w, h) => {
  g.fillStyle = '#8f3036';
  g.fillRect(0, 0, w, h);
  const cx = w / 2,
    cy = h / 2;
  g.strokeStyle = '#d9a777';
  g.lineWidth = 10;
  g.beginPath();
  g.ellipse(cx, cy, w / 2 - 22, h / 2 - 22, 0, 0, 7);
  g.stroke();
  g.strokeStyle = '#5c1c24';
  g.lineWidth = 16;
  g.beginPath();
  g.ellipse(cx, cy, w / 2 - 48, h / 2 - 48, 0, 0, 7);
  g.stroke();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g.fillStyle = i % 2 ? '#c76b4c' : '#e0b58a';
    g.beginPath();
    g.ellipse(cx + Math.cos(a) * 150, cy + Math.sin(a) * 150, 14, 24, a, 0, 7);
    g.fill();
  }
  g.fillStyle = '#5c1c24';
  g.beginPath();
  g.ellipse(cx, cy, 80, 60, 0, 0, 7);
  g.fill();
  g.fillStyle = '#d9a777';
  g.beginPath();
  g.ellipse(cx, cy, 34, 24, 0, 0, 7);
  g.fill();
  for (let i = 0; i < 1500; i++) {
    g.fillStyle = `rgba(${rnd() < 0.5 ? '255,220,190' : '60,10,20'},0.12)`;
    g.fillRect(rnd() * w, rnd() * h, 2, 2);
  }
});
const rugBeige = drawTex(512, 768, (g, w, h) => {
  g.fillStyle = '#d6c3a0';
  g.fillRect(0, 0, w, h);
  g.strokeStyle = '#b59c74';
  g.lineWidth = 6;
  g.strokeRect(18, 18, w - 36, h - 36);
  g.lineWidth = 3;
  for (let y = 60; y < h - 40; y += 56)
    for (let x = 60; x < w - 40; x += 56) {
      g.beginPath();
      g.moveTo(x, y - 20);
      g.lineTo(x + 20, y);
      g.lineTo(x, y + 20);
      g.lineTo(x - 20, y);
      g.closePath();
      g.stroke();
    }
  // fringe
  g.fillStyle = '#efe4cf';
  for (let x = 0; x < w; x += 8) {
    g.fillRect(x, 0, 3, 12);
    g.fillRect(x, h - 12, 3, 12);
  }
});
const paintedTop = drawTex(512, 256, (g, w, h) => {
  const cols = ['#a9c29a', '#e2cf8f', '#cf8b6b', '#8fb3b0', '#e8e1c9'];
  g.fillStyle = '#cdd8b6';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 40; i++) {
    g.fillStyle = cols[i % cols.length];
    g.globalAlpha = 0.7;
    g.beginPath();
    g.ellipse(rnd() * w, rnd() * h, 20 + rnd() * 50, 8 + rnd() * 20, rnd() * 3, 0, 7);
    g.fill();
  }
  g.globalAlpha = 1;
});
const artAbstract = drawTex(256, 384, (g, w, h) => {
  g.fillStyle = '#e9dfcb';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#c9b38f';
  g.beginPath();
  g.ellipse(90, 130, 70, 95, 0.3, 0, 7);
  g.fill();
  g.fillStyle = '#3c3a35';
  g.beginPath();
  g.ellipse(170, 250, 45, 70, -0.4, 0, 7);
  g.fill();
  g.fillStyle = '#efe7d7';
  g.fillRect(40, 280, 90, 60);
});
// the abstract painting above the walnut table (owner's photo): textured cream, a tan band, a dark olive-brown half
// moon, a small black block, a pale pink-beige base, fine white scratches
const painting = drawTex(320, 590, (g, w, h) => {
  g.fillStyle = '#e4dccc';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = rnd() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(120,100,80,0.10)';
    g.fillRect(rnd() * w, rnd() * h, 2, 2);
  }
  g.fillStyle = '#b39478';
  g.beginPath();
  g.moveTo(0, h * 0.24);
  g.lineTo(w * 0.29, h * 0.26);
  g.lineTo(w * 0.27, h);
  g.lineTo(0, h);
  g.fill();
  g.fillStyle = '#4c4233';
  g.beginPath();
  g.moveTo(w, h * 0.14);
  g.lineTo(w * 0.86, h * 0.13);
  g.bezierCurveTo(w * 0.62, h * 0.15, w * 0.58, h * 0.4, w * 0.66, h * 0.52);
  g.lineTo(w, h * 0.54);
  g.fill();
  g.fillStyle = '#ead8cc';
  g.beginPath();
  g.moveTo(w * 0.27, h * 0.62);
  g.bezierCurveTo(w * 0.45, h * 0.58, w * 0.6, h * 0.55, w * 0.7, h * 0.6);
  g.bezierCurveTo(w * 0.8, h * 0.63, w * 0.9, h * 0.6, w, h * 0.6);
  g.lineTo(w, h);
  g.lineTo(w * 0.27, h);
  g.fill();
  g.fillStyle = '#141210';
  g.beginPath();
  g.moveTo(w * 0.24, h * 0.45);
  g.lineTo(w * 0.43, h * 0.44);
  g.lineTo(w * 0.4, h * 0.62);
  g.lineTo(w * 0.24, h * 0.63);
  g.fill();
  g.strokeStyle = 'rgba(255,255,255,0.75)';
  g.lineWidth = 2;
  for (const [x0, y0, x1, y1, x2, y2] of [
    [w * 0.05, h * 0.1, w * 0.4, h * 0.02, w * 0.6, h * 0.12],
    [w * 0.3, h * 0.37, w * 0.12, h * 0.4, w * 0.02, h * 0.37],
    [w * 0.55, h * 0.66, w * 0.65, h * 0.82, w * 0.75, h * 0.98],
    [w * 0.7, h * 0.42, w * 0.78, h * 0.47, w * 0.74, h * 0.5],
  ]) {
    g.beginPath();
    g.moveTo(x0, y0);
    g.quadraticCurveTo(x1, y1, x2, y2);
    g.stroke();
  }
});
const posterKoup = drawTex(256, 384, (g, w, h) => {
  g.fillStyle = '#1e1e1e';
  g.fillRect(0, 0, w, h);
  g.fillStyle = '#e8dcc3';
  g.font = 'bold 34px serif';
  g.fillText('KOUP', 20, 52);
  for (let i = 0; i < 14; i++) {
    g.fillStyle = ['#e8dcc3', '#c9a26a', '#9fae86'][i % 3];
    g.beginPath();
    g.ellipse(30 + rnd() * 200, 90 + rnd() * 270, 10 + rnd() * 22, 6 + rnd() * 14, rnd() * 3, 0, 7);
    g.fill();
  }
});
const patterned = drawTex(256, 256, (g, w, h) => {
  g.fillStyle = '#d9824f';
  g.fillRect(0, 0, w, h);
  for (let i = 0; i < 60; i++) {
    g.fillStyle = ['#7a2f2a', '#f0c88e', '#4f6b52', '#b84c3a'][i % 4];
    g.beginPath();
    g.arc(rnd() * w, rnd() * h, 6 + rnd() * 14, 0, 7);
    g.fill();
  }
});

// ================= North lounge (floor FI) =================
F.rug(0.65, FI, -8.55, 0.25, 2.1, 1.8, rugRed, true);
F.rug(0.9, FI, -5.45, 0, 2.0, 3.3, rugBeige);
// round the red rug
{
  const g = F.armchair(-0.25, FI, -8.85, E, C.cognac, 0.78);
  // its patterned seat cushion
  g.children.at(-1).material = mat('#ffffff', { map: patterned });
}
F.armchair(0.4, FI, -9.55, 0.25, C.navy, 0.78);
F.basket(1.65, FI, -9.2, 0.18, 0.32);
// round the beige rug
F.boxTable(0.95, FI, -5.4, 0, 0.75, 0.7, 0.38, M.woodLight, 0.04);
F.armchair(0.2, FI, -4.75, E, '#cfc8bb', 0.78);
F.armchair(1.4, FI, -6.6, 0.2, C.leatherBrown, 0.85);
F.armchair(1.45, FI, -4.35, N, C.linen, 0.8);
F.vase(0.95, FI + 0.38, -5.35, 0.06, 0.22, '#3f4a3c');
// north-west corner: olive chairs round a low walnut coffee table
{
  const g = group(-2.65, FI, -9.35, 0, 'coffee_table');
  rbox(0.85, 0.035, 0.85, 0.008, F.M.walnut, 0, 0.345, 0, 0, g);
  for (const [a, b] of [
    [-1, -1],
    [1, -1],
    [1, 1],
    [-1, 1],
  ])
    rod([a * 0.4, 0, b * 0.4], [a * 0.4, 0.36, b * 0.4], 0.012, M.frame, g);
  contactShadow(0.85, 0.85, -2.65, FI, -9.35);
}
F.loungeChair(-2.05, FI, -10.35, 0.5, C.olive);
F.loungeChair(-1.4, FI, -9.55, -1.6, C.olive);
F.loungeChair(-3.35, FI, -8.95, 1.5, C.oliveDark);
F.loungeChair(-2.95, FI, -7.95, 2.6, C.olive);
F.loungeChair(-2.3, FI, -8.0, 3.2, C.oliveDark);
// west: two puffy sofas, the painted table, the long sofa
F.puffySofa(-3.2, FI, -6.5, 0, C.cream, 1.75, 0.95);
F.boxTable(-2.85, FI, -5.5, 0, 1.35, 0.65, 0.4, mat('#ffffff', { map: paintedTop }), 0.04);
F.puffySofa(-3.05, FI, -4.3, N, C.linen, 1.85, 0.95);
// along the north wall
F.standingAC(-3.75, FI, ZN + 0.2, 0);
F.palm(-2.45, FI, -10.85, 1.6, 'basket', 0.2);
F.basket(-1.85, FI, -10.9, 0.15, 0.3);
F.bush(-1.15, FI, -10.85, 0.22, 'terracotta', 0.14, 0.25, ['#d8c23a', '#e9d65a', C.leaf]);
F.vase(-0.55, FI, -10.95, 0.1, 0.4, '#d6c2a3');
F.vase(1.35, FI, -10.95, 0.09, 0.45, '#c9a27e');
F.artPanel(posterKoup, 0.45, 0.66, 1.55, 1.15, ZN + 0.02, 0);
// west wall: the shop's tote bags and a plant
F.toteBag(XW + 0.02, 0.95, -9.4, '+x');
F.toteBag(XW + 0.02, 0.95, -5.6, '+x');
F.bigLeaf(-3.75, FI, -7.35, 1.2, 'basket', 0.17);
// the display shelves and the reception desk at the opening to the middle room
F.shelves(-2.95, FI, -3.45, 0, 1.3, 2.25, 0.35);
F.walnutCabinet(0.85, FI, -3.15, 0, 1.25, 0.55, 1.0);
F.gramophone(1.12, FI + 1.0, -3.18, -0.5);
F.blackVase(0.38, FI + 1.0, -3.05);
F.blackVase(0.6, FI + 1.0, -3.0);
F.whiteCeramics(0.8, FI + 1.0, -3.2);
F.bush(1.55, FI, -3.6, 0.3, 'white', 0.18, 0.3);

// ================= Middle room (floor FI) =================
// the big live-edge table and its round wooden chairs
F.walnutTable(-2.45, FI, -1.25, 0, 2.9, 1.1);
F.roundChair(-3.3, FI, -2.15, 0);
F.roundChair(-2.4, FI, -2.15, 0);
F.roundChair(-1.5, FI, -2.15, 0);
F.roundChair(-0.75, FI, -1.25, Wt);
// the long desk under the front window, with its round chairs
F.boxTable(1.77, FI, -1.1, 0, 0.5, 2.8, 0.76, M.wood, 0.02);
F.roundChair(1.2, FI, -1.9, E);
F.roundChair(1.2, FI, -0.7, E);
F.loungeChair(1.35, FI, 0.85, Wt, C.cognac);
F.loungeChair(1.35, FI, 2.2, Wt, C.black);
// four lounge chairs round a little table
F.walnutCabinet(-1.3, FI, 1.75, 0, 1.2, 0.55, 1.0);
F.recordPlayer(-1.5, FI + 1.0, 1.72, 0.08);
F.blanket(-0.92, FI + 1.0, 1.75, -0.05);
F.loungeChair(-1.95, FI, 0.85, N, C.black);
F.loungeChair(-0.65, FI, 0.85, N, C.oliveDark);
F.bistroTable(-1.3, FI, 0.55, '#1f2124');
F.loungeChair(-1.95, FI, 2.65, 0, C.olive);
F.loungeChair(-0.65, FI, 2.65, 0, C.navy);
F.bistroTable(-1.3, FI, 2.95, '#1f2124');
// west wall: the bench, the sign (signs()), the art, plants
F.boxTable(-3.83, FI, 1.95, 0, 0.45, 2.9, 0.45, M.woodDark, 0.03);
F.artPanel(painting, 0.95, 1.75, XW + 0.02, FI + 1.78, -1.25, E);
F.bigLeaf(-3.7, FI, -0.05, 1.0, 'white', 0.16);
// south side: the standing AC and the display of bags and cups
// against the south wall, side by side (as in the café): the walnut bookshelf (bags and ceramics) and the standing AC
// with the painting of the café on top; a tall plant in a white pot by the opening to the back
F.standingAC(-3.72, FI, 4.37, N);
F.palm(-2.2, FI, 4.12, 1.3, 'white', 0.13);
F.palm(1.65, FI, 3.55, 1.2, 'white', 0.17);

// ================= The bar (back area, floor FI) =================
// the menu: a visitor walking up to the counter is offered it (the tour page shows its button)
{
  const spot = new THREE.Object3D();
  spot.name = 'HOTSPOT_menu';
  spot.position.set(0.9, FI + 1.0, 4.65);
  add(spot);
}
// (owner's photo, 2026-11-22) a plain sand-coloured counter that starts at the left wall: the espresso machine and its
// cups on the left block, a glass cake case on the right block; behind, the dark door and the blue drinks fridge
const SAND = mat('#c9b39a', { rough: 0.7 });
{
  const g = group(1.27, FI, 5.45, 0, 'bar_counter');
  rbox(1.66, 1.0, 0.7, 0.015, SAND, 0, 0, 0, 0, g);
  contactShadow(1.66, 0.7, 1.27, FI, 5.45);
  // the espresso machine (facing the customers) and the paper cups on it
  const m = group(1.45, FI + 1.0, 5.4, N, 'espresso');
  const steel = mat('#cfd2d4', { metal: 0.8, rough: 0.25 });
  rbox(0.8, 0.4, 0.5, 0.03, steel, 0, 0, 0, 0, m);
  for (let i = 0; i < 4; i++) rbox(0.74, 0.012, 0.01, 0.003, mat('#8b8f92', { metal: 0.6 }), 0, 0.08 + i * 0.08, 0.255, 0, m);
  rbox(0.8, 0.05, 0.12, 0.01, mat('#2a2a2a'), 0, 0, 0.3, 0, m);
  for (const x of [-0.22, 0, 0.22]) cyl(0.035, 0.035, 0.05, mat('#2a2a2a'), x, 0.14, 0.28, 12, m);
  const cups = [
    ['#f4f1ea', 0.04],
    ['#b48a5a', 0.04],
    ['#f4f1ea', 0.045],
    ['#5b4032', 0.045],
    ['#5b4032', 0.045],
    ['#5b4032', 0.045],
  ];
  cups.forEach(([c, r], i) => cyl(r, r * 0.8, 0.28 + (i % 2) * 0.06, mat(c, { rough: 0.8 }), -0.3 + i * 0.12, 0.4, -0.05, 14, m));
  rbox(0.16, 0.08, 0.1, 0.01, mat('#1f1f1f'), 0.55, 0, 0.05, 0, m); // the card machine
  const sign = rbox(0.14, 0.12, 0.01, 0.003, mat('#f3efe6'), 0.38, 0, 0.18, 0, m);
  sign.rotation.x = -0.25;
}
{
  // the cake case on its block
  const g = group(-0.06, FI, 5.45, 0, 'cake_case');
  rbox(1.0, 0.86, 0.68, 0.015, SAND, 0, 0, 0, 0, g);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.98, 0.46, 0.6), GLASS());
  glass.position.set(0, 0.86 + 0.23, 0);
  g.add(glass);
  for (const [x0, x1, y0, y1, z0, z1] of [
    [-0.49, 0.49, 0.86, 0.875, -0.3, 0.3],
    [-0.49, 0.49, 1.31, 1.325, -0.3, 0.3],
  ])
    rbox(x1 - x0, y1 - y0, z1 - z0, 0.002, mat('#e9edef', { rough: 0.2 }), (x0 + x1) / 2, y0, 0, 0, g);
  rbox(0.98, 0.008, 0.58, 0.002, mat('#f6f6f4'), 0, 1.08, 0, 0, g); // the glass shelf
  // more sweets: small cakes, a tray of pastries, cups of dessert
  rbox(0.22, 0.03, 0.14, 0.01, mat('#d9c7a5'), -0.3, 1.088, 0.1, 0, g);
  for (let i = 0; i < 3; i++) ball(0.028, mat('#c98b4a'), -0.37 + i * 0.07, 1.13, 0.1, 1.2, 0.7, 1, g);
  for (let i = 0; i < 3; i++) cyl(0.03, 0.025, 0.06, mat('#f3efe6'), 0.32, 0.875, -0.12 + i * 0.09, 12, g);
  cyl(0.06, 0.06, 0.05, mat('#8a4b2c'), 0.34, 1.088, 0.08, 20, g);
  // cakes and pastries, cake domes on stands
  cyl(0.1, 0.1, 0.08, mat('#c98b4a'), -0.2, 0.875, -0.05, 20, g);
  rbox(0.16, 0.05, 0.08, 0.02, mat('#a8643a'), 0.15, 0.875, 0.05, 0, g);
  cyl(0.09, 0.09, 0.07, mat('#e2c08a'), 0.05, 1.088, -0.08, 20, g);
  for (const [cx, cz] of [
    [-0.18, -0.1],
    [0.2, 0.08],
  ]) {
    cyl(0.012, 0.05, 0.12, mat('#6b4a32'), cx, 1.335, cz, 12, g);
    cyl(0.1, 0.1, 0.012, mat('#6b4a32'), cx, 1.455, cz, 20, g);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(0.1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), GLASS());
    dome.position.set(cx, FI + 1.467, cz);
    dome.position.y = 1.467;
    g.add(dome);
  }
  contactShadow(1.0, 0.68, -0.06, FI, 5.45);
}
// the bar's side wall, just right of the case (the opening to the back is beyond it)
slab(-0.75, -0.56, FI, 1.55, 5.12, 8.6, mat('#ffffff', { map: speckleTex('#f1ead9', ['#fbf7ee', '#e4dccb'], 600, 128) }), 'bar_side_wall');
{
  // the back counter (short, by the window) with its syrup bottles
  const g = group(1.72, FI, 8.27, 0, 'back_counter');
  rbox(0.66, 0.9, 0.6, 0.02, mat('#f0e4c8'), 0, 0, 0, 0, g);
  rbox(0.7, 0.04, 0.64, 0.01, M.woodLight, 0, 0.9, 0, 0, g);
  F.bottles(group(1.45, FI + 0.94, 8.32, 0), 0, 0.5, 0, 0, ['#c4c6c7', '#b8babb', '#8a5b3a', '#d3d5d6']);
}
{
  // the split AC on the wall above
  const g = group(-0.05, FI + 2.28, 8.5, N, 'wall_ac');
  rbox(0.85, 0.28, 0.2, 0.05, mat('#f6f6f3', { rough: 0.4 }), 0, 0, 0, 0, g);
  rbox(0.75, 0.02, 0.01, 0.005, mat('#c9cbc8'), 0, 0.05, 0.1, 0, g);
}
{
  // the low fridges under the front window, and the shelf of bottles in the window
  const g = group(1.75, FI, 6.95, Wt, 'fridges');
  for (const dx of [-0.45, 0.45]) {
    rbox(0.88, 0.85, 0.6, 0.02, mat('#1f2226'), dx, 0, 0, 0, g);
    rbox(0.78, 0.7, 0.02, 0.01, GLASS(), dx, 0.08, 0.3, 0, g);
    for (let r = 0; r < 2; r++)
      for (let k = 0; k < 6; k++)
        cyl(0.03, 0.03, 0.2, mat(['#e03b3b', '#3b7be0', '#e8c23a', '#46a35a'][(k + r) % 4]), dx - 0.3 + k * 0.12, 0.12 + r * 0.33, 0.18, 10, g);
  }
  rbox(1.8, 0.04, 0.62, 0.01, M.woodLight, 0, 0.85, 0, 0, g);
  F.bottles(group(1.9, FI + 0.89, 6.1, Wt), 0, 1.6, 0, 0, ['#4a6b3a', '#8a5b3a', '#d6c9a3', '#3c3c3c'], 0.03, 0.26, 0.11);
}
{
  // the tall drinks fridge (Kafeen)
  const g = group(-0.12, FI, 8.27, N, 'drinks_fridge');
  rbox(0.62, 1.95, 0.6, 0.03, mat('#20357a'), 0, 0, 0, 0, g);
  rbox(0.52, 1.45, 0.02, 0.01, GLASS(), 0, 0.12, 0.3, 0, g);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) cyl(0.035, 0.035, 0.22, mat(['#f4f4f4', '#2e63c9'][k % 2]), -0.2 + k * 0.1, 0.18 + r * 0.35, 0.15, 10, g);
  const head = drawTex(256, 64, (c, w, h) => {
    c.fillStyle = '#20357a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    c.font = 'bold 34px sans-serif';
    c.textAlign = 'center';
    c.fillText('KAVIN', w / 2, 44);
  });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.14), mat('#ffffff', { map: head }));
  p.position.set(0, 1.78, 0.305);
  p.name = 'NOCOLLIDE_label';
  g.add(p);
}
{
  // a chrome bar stool behind the counter
  const g = group(0.35, FI, 7.0, 0, 'bar_stool');
  cyl(0.2, 0.2, 0.02, mat('#c9cbcc', { metal: 0.8, rough: 0.3 }), 0, 0, 0, 20, g);
  cyl(0.03, 0.03, 0.6, mat('#c9cbcc', { metal: 0.8, rough: 0.3 }), 0, 0, 0, 12, g);
  cyl(0.17, 0.17, 0.05, mat('#2c2c2c'), 0, 0.6, 0, 20, g);
}
F.bigLeaf(-3.75, FI, 4.95, 0.8, 'terracotta', 0.15);

// ================= Terrace (floor FT) =================
// the row of white ribbed planters along the lounge's glass, planted with a mix of purple Alternanthera 'Purple
// Knight' and Madagascar periwinkle (owner, 2026-11-22)
for (let z = -10.7, i = 0; z < -3.65; z += 0.88, i++) {
  F.ribbedPlanter(2.55, FT, z + 0.42, 0.42, 0.84, 0.3);
  // three plants to a box, spilling over its edges: no gaps along the line
  const plant = (dz, purple) => (purple ? F.purpleKnight : F.periwinkle)(2.55, FT + 0.3, z + 0.42 + dz, 0.3);
  plant(-0.29, i % 2 === 0);
  plant(0, i % 2 === 1);
  plant(0.29, i % 2 === 0);
}
slab(2.32, 2.78, FT, FT + 1.1, -10.7, -3.6, mat('#000000'), 'COLLIDER_planter');
// by the KOUP pillar: two wooden reclining chairs (one pale, one teak) with a slatted folding table and its ashtray
F.slatTable(3.02, FT, -10.05, 0.15, 0.4);
// a black and an olive lounge chair with a round black table, their backs to the planters
F.loungeChair(3.4, FT, -6.75, E, C.oliveDark);
F.loungeChair(3.4, FT, -5.25, E, C.black);
F.bistroTable(3.4, FT, -6.0, '#1f2124');
F.ribbedPlanter(2.55, FT, -3.25, 0.42, 0.7, 0.3);
F.periwinkle(2.55, FT + 0.3, -3.25, 0.3);
// the middle pairs of lounge chairs, facing each other
F.loungeChair(2.65, FT, -1.4, 0, C.olive);
F.loungeChair(3.42, FT, -1.4, 0, '#8a8f84');
F.loungeChair(2.65, FT, 0.5, N, C.navy);
F.loungeChair(3.42, FT, 0.5, N, C.navy);
F.frameTable(3.03, FT, -0.45, 0, 0.5, 0.45);
F.bigLeaf(2.55, FT, 2.65, 1.25, 'white', 0.22);
// south: chairs along the wall, planters, metal side tables at the edge
// under the bar's window: black and tan with a round beige table (owner's photos)
F.loungeChair(2.9, FT, 6.25, E, C.tan);
F.bistroTable(2.85, FT, 7.0, '#d8d2c6');
F.loungeChair(2.9, FT, 7.75, E, C.black);
// in the south corner: two tan and a black round a beige table
F.loungeChair(2.85, FT, 10.5, E, C.tan);
F.loungeChair(2.85, FT, 9.35, 0.59, C.tan);
F.loungeChair(3.9, FT, 9.35, -0.4, C.black);
F.bistroTable(3.72, FT, 10.55, '#d8d2c6');
// at the terrace's edge, facing the street: black and tan with a round black table
F.loungeChair(5.0, FT, 5.55, E, C.black);
F.bistroTable(5.0, FT, 6.3, '#1f2124');
F.loungeChair(5.0, FT, 7.05, E, C.tan);
// a floor lamp by the door
{
  const g = group(2.55, FT, 4.95, 0, 'floor_lamp');
  cyl(0.15, 0.15, 0.03, M.frame, 0, 0, 0, 20, g);
  cyl(0.015, 0.015, 1.45, M.frame, 0, 0, 0, 8, g);
  cyl(0.12, 0.2, 0.25, mat('#f3ead7', { emissive: '#fff1d2', ei: 0.5 }), 0, 1.4, 0, 20, g);
}

/** The two wooden reclining chairs (the owner's model, `models/wooden_reclining_chair.glb`), stood upright and sized. */
export async function terraceChairs() {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { SimplifyModifier } = await import('three/addons/modifiers/SimplifyModifier.js');
  const { mergeGeometries, mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
  const gltf = await new GLTFLoader().loadAsync('models/wooden_reclining_chair.glb');
  const LENGTH = 1.45; // a Kentucky-style lounger: about 1.45 m long, 0.6 m wide
  // lighter: its slats' many curve steps simplified (one geometry per material, keeping the wood's texture coordinates)
  gltf.scene.updateMatrixWorld(true);
  const byMat = new Map();
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    g.applyMatrix4(o.matrixWorld);
    if (!byMat.has(o.material)) byMat.set(o.material, []);
    byMat.get(o.material).push(g.index ? g.toNonIndexed() : g);
  });
  const lean = new THREE.Group();
  for (const [m, geos] of byMat) {
    let g = mergeVertices(mergeGeometries(geos), 1e-4);
    if (g.attributes.position.count > 4000) g = new SimplifyModifier().modify(g, Math.floor(g.attributes.position.count * 0.45));
    const mesh = new THREE.Mesh(g, m);
    lean.add(mesh);
  }
  const place = (x, z, ry, wood) => {
    const model = lean.clone(true);
    // the model lies Z-up with its head at -y: stand it up (head to +z), then turn the head toward the planters (-x)
    model.rotation.x = -Math.PI / 2;
    const s = LENGTH / 2.11;
    model.scale.setScalar(s);
    const g = group(x, FT, z, ry, 'reclining_chair');
    g.add(model);
    model.position.y = -0.0826 * s; // its feet on the floor
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = /cushion|linen/i.test(o.material.name) ? mat('#ece6da', { rough: 0.95 }) : /hook|metal|steel/i.test(o.material.name) ? mat('#9a9a96', { metal: 0.6, rough: 0.4 }) : wood;
    });
    contactShadow(0.62, LENGTH, x, FT, z, ry);
  };
  // turned 45° toward each other (feet toward each other), the table between them at the back (owner, 2026-11-22)
  place(3.95, -10.62, (-3 * Math.PI) / 4, M.woodLight);
  place(3.95, -9.25, -Math.PI / 4, M.woodDark);
}

/** Every lounge chair of the place, from the owner's model: lightened, stood up, sized, and in each chair's colour. */
export async function loungeChairs() {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const { mergeGeometries, mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
  const gltf = await new GLTFLoader().loadAsync('models/black_lounge_chair.glb');
  gltf.scene.updateMatrixWorld(true);
  // One geometry for the frame, one for the cushion; the sewn seams and piping (half its triangles, too small to see
  // from a step away) are left out, and the cushion is simplified.
  const parts = { frame: [], cushion: [] };
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const name = o.material.name;
    if (/piping|seam/i.test(name)) return;
    const g = o.geometry.clone();
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal'].includes(k)) g.deleteAttribute(k);
    g.applyMatrix4(o.matrixWorld);
    (/cushion/i.test(name) ? parts.cushion : parts.frame).push(g.index ? g.toNonIndexed() : g);
  });
  const frame = mergeVertices(mergeGeometries(parts.frame), 1e-4);
  const sling = mergeGeometries(parts.cushion);
  // Upright already (its parts' own transforms), its back toward +z: turn its front to +z, size it, feet on the floor.
  const S = LOUNGE_SCALE;
  for (const g of [frame, sling]) {
    g.rotateY(Math.PI);
    g.scale(S, S, S);
    g.translate(0, -0.019 * S, 0);
  }
  // The model's cushion gives the sling's line (front, low, to back, high); a fluffy leather cushion is made along it
  // (owner, 2026-11-22: "make them fluffy like actual cushions").
  const pts = sling.attributes.position;
  let lo = null,
    hi = null;
  for (let i = 0; i < pts.count; i++) {
    const p = new THREE.Vector3().fromBufferAttribute(pts, i);
    if (!lo || p.z - p.y > lo.z - lo.y) lo = p; // the front, lowest end
    if (!hi || p.y - p.z > hi.y - hi.z) hi = p; // the back, highest end
  }
  const axis = new THREE.Vector3(0, hi.y - lo.y, hi.z - lo.z);
  const L = axis.length();
  axis.normalize();
  const bins = Array.from({ length: 14 }, () => ({ y: 0, z: 0, n: 0 }));
  for (let i = 0; i < pts.count; i++) {
    const y = pts.getY(i),
      z = pts.getZ(i);
    const t = ((y - lo.y) * axis.y + (z - lo.z) * axis.z) / L;
    const k = Math.min(13, Math.max(0, Math.floor(t * 14)));
    bins[k].y += y;
    bins[k].z += z;
    bins[k].n++;
  }
  const profile = bins.filter((b) => b.n).map((b) => new THREE.Vector3(0, b.y / b.n + 0.03, b.z / b.n));
  const cushion = F.fluffyCushion(profile, 0.62, 0.22);
  console.log('lounge tris', frame.index.count / 3 + cushion.index.count / 3);
  const frameMat = mat('#1d2024', { metal: 0.5, rough: 0.4 });
  for (const c of F.lounges) {
    const g = group(c.x, c.y, c.z, c.ry, 'lounge_chair');
    g.add(new THREE.Mesh(frame, frameMat));
    g.add(new THREE.Mesh(cushion, mat(c.color, { rough: 0.55, side: THREE.DoubleSide })));
  }
}
const LOUNGE_SCALE = 0.85; // 1.23 m long in the model: the place's chairs are about 1.05 m (the scan)

/**
 * The walnut bookshelf by the standing AC, and the painting of the café on the AC (owner's photos, 2026-11-22). Made
 * after the signs, once the Arabic typeface is loaded (the totes and the painting carry کوپ).
 */
export async function koupCorner() {
  const walnut = mat('#ffffff', { map: woodTexV('#6a4c3b', '#4b3426', '#8a6b58'), rough: 0.55 });
  const x = -2.95,
    z = 4.36,
    W = 0.72,
    H = 2.12,
    D = 0.34;
  const g = group(x, FI, z, N, 'bookshelf');
  // sides, top, back panel, the boards
  rbox(0.03, H, D, 0.004, walnut, -W / 2 + 0.015, 0, 0, 0, g);
  rbox(0.03, H, D, 0.004, walnut, W / 2 - 0.015, 0, 0, 0, g);
  rbox(W, 0.03, D, 0.004, walnut, 0, H - 0.03, 0, 0, g);
  rbox(W - 0.04, H - 0.04, 0.012, 0.003, walnut, 0, 0.02, -D / 2 + 0.008, 0, g);
  for (const y of [0.02, 0.42, 0.8, 1.17, 1.5]) rbox(W - 0.04, 0.025, D - 0.02, 0.004, walnut, 0, y, 0.005, 0, g);
  contactShadow(W, D, x, FI, z, N);
  // the two KOUP totes, hanging on black hooks in the top section
  const tote = (dark) => {
    const t = drawTex(256, 384, (c, w, h) => {
      c.clearRect(0, 0, w, h);
      const bag = dark ? '#151515' : '#ece4d2';
      const ink = dark ? '#ece4d2' : '#1d1d1d';
      // straps
      c.strokeStyle = bag;
      c.lineWidth = 12;
      c.beginPath();
      c.moveTo(w * 0.26, h * 0.34);
      c.quadraticCurveTo(w * 0.5, -h * 0.08, w * 0.74, h * 0.34);
      c.stroke();
      c.fillStyle = bag;
      c.fillRect(w * 0.04, h * 0.33, w * 0.92, h * 0.65);
      c.fillStyle = ink;
      c.font = 'bold 15px serif';
      c.fillText('KOUP', w * 0.1, h * 0.42);
      c.font = 'bold 9px sans-serif';
      c.fillText('WHERE COFFEE AND', w * 0.38, h * 0.41);
      c.fillText('CULTURE MEET', w * 0.42, h * 0.44);
      c.font = '700 20px ar';
      c.textAlign = 'right';
      c.fillText('کوپ', w * 0.92, h * 0.43);
      c.textAlign = 'left';
      // the nine little drawings (moka pot, map, cup, a slice, a takeaway cup, the bridge, the citadel...)
      c.strokeStyle = ink;
      c.fillStyle = ink;
      c.lineWidth = 2;
      for (let r = 0; r < 3; r++)
        for (let k = 0; k < 3; k++) {
          const cx = w * (0.2 + k * 0.3),
            cy = h * (0.55 + r * 0.14);
          const kind = (r * 3 + k) % 5;
          c.beginPath();
          if (kind === 0) {
            c.moveTo(cx - 10, cy + 16);
            c.lineTo(cx - 6, cy - 4);
            c.lineTo(cx - 10, cy - 16);
            c.lineTo(cx + 10, cy - 16);
            c.lineTo(cx + 6, cy - 4);
            c.lineTo(cx + 10, cy + 16);
            c.closePath();
          } else if (kind === 1) {
            c.moveTo(cx - 20, cy);
            c.bezierCurveTo(cx - 10, cy - 16, cx + 6, cy - 6, cx + 20, cy - 12);
            c.bezierCurveTo(cx + 14, cy + 8, cx - 4, cy + 14, cx - 20, cy);
          } else if (kind === 2) {
            c.rect(cx - 9, cy - 14, 18, 26);
            c.moveTo(cx - 12, cy - 14);
            c.lineTo(cx + 12, cy - 14);
          } else if (kind === 3) {
            c.moveTo(cx - 20, cy + 12);
            c.lineTo(cx - 8, cy - 12);
            c.lineTo(cx + 20, cy + 12);
            c.closePath();
            c.moveTo(cx - 12, cy + 4);
            c.arc(cx - 2, cy + 4, 4, 0, 7);
          } else {
            c.moveTo(cx - 22, cy + 10);
            for (let i = 0; i < 4; i++) c.arc(cx - 16 + i * 11, cy + 10, 5, Math.PI, 0);
            c.moveTo(cx - 22, cy + 10);
            c.lineTo(cx + 22, cy + 10);
          }
          c.stroke();
        }
    });
    t.userData.mimeType = 'image/png';
    return t;
  };
  for (const [dx, dark] of [
    [-0.16, true],
    [0.16, false],
  ]) {
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.29, 0.435), new THREE.MeshStandardMaterial({ map: tote(dark), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 0.9 }));
    p.position.set(dx, 1.5 + 0.03 + 0.435 / 2 + 0.07, -D / 2 + 0.03);
    p.name = 'NOCOLLIDE_tote';
    g.add(p);
    rbox(0.025, 0.05, 0.03, 0.005, mat('#111111'), dx, 1.5 + 0.03 + 0.435 + 0.05, -D / 2 + 0.02, 0, g); // the hook
    // folded totes on the board below
    for (let i = 0; i < 4; i++) rbox(0.26, 0.018, 0.2, 0.004, mat(dark ? '#1a1a1a' : '#e9e1cf'), dx + (i % 2) * 0.008, 1.525 + i * 0.019, 0.02, 0, g);
  }
  // the white ceramics on the three lower shelves
  const white = mat('#f2eee6', { rough: 0.45 });
  const pieces = [
    (px, py) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.022, 10, 20), white);
      m.position.set(px, py + 0.075, 0.02);
      g.add(m);
    },
    (px, py) => ball(0.055, white, px, py + 0.05, 0.02, 1.3, 0.9, 1, g),
    (px, py) => {
      cyl(0.03, 0.04, 0.08, white, px, py, 0.02, 14, g);
      ball(0.035, white, px, py + 0.11, 0.02, 1, 1, 1, g);
    },
    (px, py) => ball(0.045, white, px, py + 0.05, 0.02, 1, 1.2, 1, g),
    (px, py) => cyl(0.04, 0.035, 0.07, white, px, py, 0.02, 16, g),
    (px, py) => {
      const m = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.02, 10, 16, Math.PI), white);
      m.position.set(px, py + 0.01, 0.02);
      g.add(m);
    },
    (px, py) => cyl(0.022, 0.025, 0.1, white, px, py, 0.02, 12, g),
  ];
  [0.445, 0.825, 1.195].forEach((sy, r) => {
    for (let k = 0; k < 4; k++) pieces[(r * 4 + k) % pieces.length](-0.25 + k * 0.165, sy);
  });
  // the painting of the café, leaning on top of the standing AC
  const art = drawTex(400, 440, (c, w, h) => {
    c.fillStyle = '#f2f0ea';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#cfe3ea';
    c.fillRect(0, 0, w, h * 0.42);
    // birds
    c.strokeStyle = '#3a3a3a';
    c.lineWidth = 1.5;
    for (const [bx, by] of [
      [0.68, 0.07],
      [0.82, 0.05],
    ]) {
      c.beginPath();
      c.moveTo(w * bx - 7, h * by);
      c.quadraticCurveTo(w * bx - 3, h * by - 4, w * bx, h * by);
      c.quadraticCurveTo(w * bx + 3, h * by - 4, w * bx + 7, h * by);
      c.stroke();
    }
    // trees
    const tree = (tx, ty, s) => {
      c.fillStyle = '#5a3a26';
      c.fillRect(tx - 3, ty, 6, h * 0.36 * s);
      c.fillStyle = '#3f8a3d';
      for (let i = 0; i < 6; i++) {
        c.beginPath();
        c.ellipse(tx + Math.sin(i * 2.1) * 26 * s, ty - 10 - i * 18 * s, 36 * s * (1 - i * 0.08), 22 * s, 0, 0, 7);
        c.fill();
      }
    };
    tree(w * 0.06, h * 0.4, 0.8);
    tree(w * 0.86, h * 0.62, 1);
    // the café: a white block with a flat roof overhang, its window and awning
    c.lineWidth = 2;
    c.strokeStyle = '#6b3f2a';
    c.fillStyle = '#fbfaf5';
    c.beginPath();
    c.moveTo(w * 0.2, h * 0.36);
    c.lineTo(w * 0.62, h * 0.3);
    c.lineTo(w * 0.74, h * 0.37);
    c.lineTo(w * 0.74, h * 0.62);
    c.lineTo(w * 0.22, h * 0.7);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#efece4';
    c.beginPath();
    c.moveTo(w * 0.16, h * 0.34);
    c.lineTo(w * 0.36, h * 0.24);
    c.lineTo(w * 0.64, h * 0.23);
    c.lineTo(w * 0.76, h * 0.33);
    c.lineTo(w * 0.62, h * 0.3);
    c.lineTo(w * 0.2, h * 0.38);
    c.closePath();
    c.fill();
    c.stroke();
    c.fillStyle = '#9a9a96';
    c.fillRect(w * 0.48, h * 0.36, w * 0.16, h * 0.03);
    c.fillStyle = '#e8eef0';
    c.fillRect(w * 0.5, h * 0.39, w * 0.13, h * 0.13);
    c.strokeRect(w * 0.5, h * 0.39, w * 0.13, h * 0.13);
    c.fillStyle = '#6b3f2a';
    c.font = '700 26px ar';
    c.fillText('کوپ', w * 0.39, h * 0.47);
    // the step and the curb
    c.strokeStyle = '#6b3f2a';
    c.beginPath();
    c.moveTo(w * 0.22, h * 0.7);
    c.lineTo(w * 0.5, h * 0.73);
    c.lineTo(w * 0.8, h * 0.66);
    c.stroke();
    c.fillStyle = '#d8d4cc';
    c.beginPath();
    c.moveTo(0, h * 0.82);
    c.lineTo(w, h * 0.98);
    c.lineTo(w, h);
    c.lineTo(0, h * 0.86);
    c.fill();
    for (let i = 0; i < 12; i++) {
      c.beginPath();
      c.moveTo((w * i) / 12, h * (0.82 + i * 0.0133));
      c.lineTo((w * i) / 12, h * (0.86 + i * 0.0133));
      c.stroke();
    }
    // the couple at the window: him in black, her in a long red dress
    c.fillStyle = '#1e1e1e';
    c.fillRect(w * 0.5, h * 0.49, w * 0.06, h * 0.17);
    c.beginPath();
    c.arc(w * 0.53, h * 0.47, 8, 0, 7);
    c.fill();
    c.fillStyle = '#8f1f1f';
    c.beginPath();
    c.moveTo(w * 0.58, h * 0.49);
    c.lineTo(w * 0.62, h * 0.49);
    c.lineTo(w * 0.65, h * 0.67);
    c.lineTo(w * 0.56, h * 0.67);
    c.closePath();
    c.fill();
    c.fillStyle = '#151515';
    c.beginPath();
    c.ellipse(w * 0.6, h * 0.47, 8, 14, 0, 0, 7);
    c.fill();
    // three potted plants
    for (const [px, ph] of [
      [0.27, 0.16],
      [0.36, 0.1],
      [0.43, 0.12],
    ]) {
      c.fillStyle = '#9a9188';
      c.fillRect(w * px - 12, h * 0.63, 24, 24);
      c.fillStyle = '#3f7d35';
      for (let i = 0; i < 7; i++) {
        c.beginPath();
        c.ellipse(w * px + (i - 3) * 4, h * (0.63 - ph * 0.5), 4, h * ph * 0.45, (i - 3) * 0.25, 0, 7);
        c.fill();
      }
    }
  });
  // a canvas on a stretcher: a plain box, the painting on its face; leaning a little against the wall
  const canvasG = group(-3.72, FI + 1.85, 4.47, Math.PI, 'cafe_painting');
  canvasG.rotation.x = 0.08;
  rbox(0.5, 0.55, 0.025, 0.004, mat('#efece4'), 0, 0, 0, 0, canvasG);
  const face = new THREE.Mesh(new THREE.PlaneGeometry(0.49, 0.54), mat('#ffffff', { map: art, rough: 0.8 }));
  face.position.set(0, 0.275, 0.0135);
  face.name = 'NOCOLLIDE_painting';
  canvasG.add(face);
}
/** Wood with its grain running up (a bookshelf's boards and panels). */
function woodTexV(base, dark, light) {
  return drawTex(256, 512, (c, w, h) => {
    c.fillStyle = base;
    c.fillRect(0, 0, w, h);
    for (let i = 0; i < 60; i++) {
      c.strokeStyle = rnd() < 0.5 ? dark : light;
      c.globalAlpha = 0.18 + rnd() * 0.22;
      c.lineWidth = 1 + rnd() * 2.5;
      const x = rnd() * w;
      c.beginPath();
      c.moveTo(x, 0);
      for (let y = 0; y <= h; y += 32) c.lineTo(x + Math.sin(y / 70 + i) * 3, y);
      c.stroke();
    }
    c.globalAlpha = 1;
  });
}

/**
 * The owner's four standing mirrors (models/mirrors.glb, 2026-11-22), each in its place: the live-edge timber one on
 * the lounge's north wall (where the plants were), the olive ring in the north-west corner, the grey and raspberry
 * rock one by the red rug, the burgundy arch where the white armchair was.
 */
export async function mirrors() {
  const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
  const gltf = await new GLTFLoader().loadAsync('models/mirrors.glb');
  gltf.scene.updateMatrixWorld(true);
  // their sculpted frames are very finely made: lightened (the mirror glass itself is a few triangles)
  const { SimplifyModifier } = await import('three/addons/modifiers/SimplifyModifier.js');
  const { mergeVertices } = await import('three/addons/utils/BufferGeometryUtils.js');
  let before = 0,
    after = 0;
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const n = o.geometry.attributes.position.count;
    before += o.geometry.index ? o.geometry.index.count / 3 : n / 3;
    if (n > 3000) {
      let g = mergeVertices(o.geometry, 1e-5);
      g = new SimplifyModifier().modify(g, Math.floor(g.attributes.position.count * 0.75));
      o.geometry = g;
    }
    after += o.geometry.index ? o.geometry.index.count / 3 : o.geometry.attributes.position.count / 3;
  });
  console.log('mirror tris', before, '->', after);
  const byName = {};
  for (const c of gltf.scene.getObjectByName('world')?.children ?? gltf.scene.children[0].children) byName[c.name] = c;
  const place = (name, x, z, ry, scale) => {
    const src = byName[name];
    const box = new THREE.Box3().setFromObject(src);
    const centre = box.getCenter(new THREE.Vector3());
    const inner = new THREE.Group();
    // its own copy, centred on its middle, standing on the floor, facing +z
    const copy = src.clone(true);
    copy.applyMatrix4(src.parent.matrixWorld);
    inner.add(copy);
    inner.position.set(-centre.x, -box.min.y, -centre.z);
    const g = group(x, FI, z, ry, 'mirror');
    g.scale.setScalar(scale);
    g.add(inner);
    copy.traverse((o) => {
      if (!o.isMesh) return;
      const m = o.material;
      if (m.map) m.map.userData.mimeType = 'image/jpeg';
      if (/Mirror_Reflective/i.test(m.name)) {
        // a mirror: bright and smooth, catching the room's light
        m.color.set('#dfe6ea');
        m.metalness = 1;
        m.roughness = 0.04;
      }
    });
    const size = box.getSize(new THREE.Vector3()).multiplyScalar(scale);
    contactShadow(size.x, size.z, x, FI, z, ry);
  };
  place('Mirror_04_Live_Edge_Timber', 0.3, ZN + 0.12, 0, 0.8);
  place('Mirror_01_Olive_Green_Organic_Ring', XW + 0.25, -10.15, Math.PI / 2, 0.8);
  place('Mirror_03_Gray_Pink_Rock_Horseshoe', 1.7, -7.95, -Math.PI / 2, 0.9);
  place('Mirror_02_Burgundy_Organic_Arch', 0.2, -6.2, Math.PI / 2, 0.9);
}
