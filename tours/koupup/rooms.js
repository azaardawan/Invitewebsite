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
F.stool(1.15, FI, -7.95, C.woodLight);
F.basket(1.65, FI, -9.2, 0.18, 0.32);
// round the beige rug
F.boxTable(0.95, FI, -5.4, 0, 0.75, 0.7, 0.38, M.woodLight, 0.04);
F.armchair(0.2, FI, -6.2, E, '#e9e4da', 0.78);
F.armchair(0.2, FI, -4.75, E, '#cfc8bb', 0.78);
F.armchair(1.4, FI, -6.6, 0.2, C.leatherBrown, 0.85);
F.armchair(1.45, FI, -4.35, N, C.linen, 0.8);
F.vase(0.95, FI + 0.38, -5.35, 0.06, 0.22, '#3f4a3c');
// north-west corner: olive chairs round a glass table
{
  const g = group(-2.65, FI, -9.35, 0, 'glass_table');
  rbox(0.85, 0.02, 0.85, 0.008, GLASS(), 0, 0.36, 0, 0, g);
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
F.loungeChair(-3.6, FI, -9.1, 1.5, C.oliveDark);
F.loungeChair(-3.15, FI, -8.15, 2.6, C.olive);
F.loungeChair(-2.3, FI, -8.0, 3.2, C.oliveDark);
F.frameTable(-3.55, FI, -10.5, 0.3, 0.45, 0.5);
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
F.palm(0.05, FI, -10.85, 1.4, 'basket', 0.18);
F.pampas(0.75, FI, -10.9, 1.3);
F.vase(1.35, FI, -10.95, 0.09, 0.45, '#c9a27e');
F.bigLeaf(1.75, FI, -10.7, 1.4, 'stone', 0.2);
F.artPanel(posterKoup, 0.45, 0.66, 1.25, 1.15, ZN + 0.02, 0);
// west wall: the shop's tote bags and a plant
F.toteBag(XW + 0.02, 0.95, -9.4, '+x');
F.toteBag(XW + 0.02, 0.95, -5.6, '+x');
F.bigLeaf(-3.75, FI, -7.35, 1.2, 'basket', 0.17);
// the display shelves and the reception desk at the opening to the middle room
F.shelves(-2.95, FI, -3.45, 0, 1.3, 2.25, 0.35);
F.boxTable(0.85, FI, -3.15, 0, 1.3, 0.55, 1.02, M.wood, 0.03);
F.bush(1.55, FI, -3.6, 0.3, 'white', 0.18, 0.3);

// ================= Middle room (floor FI) =================
// the big live-edge table and its round wooden chairs
F.liveEdgeTable(-2.45, FI, -1.25, 0, 2.9, 1.15);
F.roundChair(-3.3, FI, -2.15, 0);
F.roundChair(-2.4, FI, -2.15, 0);
F.roundChair(-1.5, FI, -2.15, 0);
F.roundChair(-0.75, FI, -1.25, Wt);
// the long desk under the front window, with its round chairs
F.boxTable(1.77, FI, 0.1, 0, 0.5, 5.2, 0.76, M.wood, 0.02);
F.roundChair(1.2, FI, -1.9, E);
F.roundChair(1.2, FI, -0.7, E);
F.loungeChair(1.3, FI, 0.9, Wt, C.cognac);
F.loungeChair(1.3, FI, 2.25, Wt, C.black);
// four lounge chairs round a little table
F.boxTable(-1.3, FI, 1.75, 0, 0.5, 0.55, 0.4, M.woodLight, 0.03);
F.loungeChair(-1.85, FI, 1.05, 0, C.olive);
F.loungeChair(-0.75, FI, 1.05, 0, C.black);
F.loungeChair(-1.85, FI, 2.45, N, C.olive);
F.loungeChair(-0.75, FI, 2.45, N, C.navy);
// west wall: the bench, the sign (signs()), the art, plants
F.boxTable(-3.83, FI, 1.95, 0, 0.45, 2.9, 0.45, M.woodDark, 0.03);
F.artPanel(artAbstract, 0.85, 1.25, XW + 0.02, 1.1, -0.6, E);
F.bigLeaf(-3.7, FI, 3.15, 1.1, 'stone', 0.17);
F.bigLeaf(-3.7, FI, -0.05, 1.0, 'white', 0.16);
// south side: the standing AC and the display of bags and cups
F.standingAC(-2.15, FI, 4.35, N);
F.shelves(-3.92, FI, 4.0, E, 1.0, 1.9, 0.33);
F.palm(1.65, FI, 3.55, 1.2, 'white', 0.17);

// ================= The bar (back area, floor FI) =================
{
  // the glass display counter with pastries
  const g = group(-0.5, FI, 5.45, 0, 'bar_counter');
  rbox(2.8, 0.95, 0.7, 0.03, mat('#efe1c3'), 0, 0, 0, 0, g);
  rbox(2.84, 0.04, 0.74, 0.01, M.woodLight, 0, 0.95, 0, 0, g);
  // its wooden front slats
  for (let i = 0; i < 13; i++) rbox(0.16, 0.85, 0.02, 0.005, M.woodLight, -1.32 + i * 0.22, 0.05, -0.36, 0, g);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.32, 0.45), GLASS());
  glass.position.set(0, 0.99 + 0.16, 0.05);
  g.add(glass);
  for (let i = 0; i < 9; i++) {
    const px = -1.16 + i * 0.29;
    cyl(0.1, 0.1, 0.015, mat('#e9e2d2'), px, 0.99, 0.05, 20, g);
    const kind = i % 3;
    if (kind === 0) cyl(0.075, 0.08, 0.06, mat('#c98b4a'), px, 1.005, 0.05, 20, g);
    else if (kind === 1) ball(0.06, mat('#e2b770'), px, 1.04, 0.05, 1.2, 0.6, 1, g);
    else rbox(0.14, 0.05, 0.08, 0.02, mat('#a8643a'), px, 1.005, 0.05, 0, g);
  }
  contactShadow(2.8, 0.7, -0.5, FI, 5.45);
}
{
  // the back counter: cabinets, the espresso machine, the grinder, syrups
  const g = group(-0.2, FI, 8.27, 0, 'back_counter');
  rbox(3.4, 0.9, 0.6, 0.02, mat('#f0e4c8'), 0, 0, 0, 0, g);
  rbox(3.44, 0.04, 0.64, 0.01, M.woodLight, 0, 0.9, 0, 0, g);
  for (let i = 0; i < 5; i++) rbox(0.62, 0.01, 0.01, 0.003, mat('#c7b994'), -1.36 + i * 0.68, 0.45, -0.305, 0, g);
  const machine = group(0.2, FI + 0.94, 8.25, N, 'espresso');
  rbox(0.62, 0.36, 0.42, 0.04, mat('#c9cbcc', { metal: 0.7, rough: 0.3 }), 0, 0, 0, 0, machine);
  rbox(0.62, 0.03, 0.42, 0.01, mat('#2c2c2c'), 0, 0.36, 0, 0, machine);
  for (const x of [-0.16, 0.16]) {
    cyl(0.035, 0.035, 0.05, mat('#2c2c2c'), x, 0.16, 0.23, 12, machine);
    rod([x, 0.17, 0.25], [x, 0.17, 0.36], 0.008, mat('#2c2c2c'), machine);
  }
  for (const x of [-0.2, 0, 0.2]) cyl(0.035, 0.03, 0.06, mat('#f4f1ea'), x, 0.37, -0.05, 14, machine);
  const grinder = group(-0.55, FI + 0.94, 8.3, 0, 'grinder');
  rbox(0.2, 0.32, 0.25, 0.04, mat('#2c2c2c'), 0, 0, 0, 0, grinder);
  cyl(0.1, 0.06, 0.18, GLASS(), 0, 0.32, 0, 16, grinder);
  F.bottles(group(0.85, FI + 0.94, 8.32, 0), -0.0, 0.5, 0, 0, ['#c4c6c7', '#b8babb', '#d3d5d6']);
  F.bottles(group(-1.5, FI + 0.94, 8.32, 0), 0, 0.35, 0, 0, ['#c4c6c7', '#8a5b3a', '#d3d5d6']);
}
{
  // the low fridges under the front window, and the shelf of bottles in the window
  const g = group(1.75, FI, 7.15, Wt, 'fridges');
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
  const g = group(-1.95, FI, 7.85, Math.PI / 2, 'drinks_fridge');
  rbox(0.62, 1.95, 0.6, 0.03, mat('#20357a'), 0, 0, 0, 0, g);
  rbox(0.52, 1.45, 0.02, 0.01, GLASS(), 0, 0.12, 0.3, 0, g);
  for (let r = 0; r < 4; r++) for (let k = 0; k < 5; k++) cyl(0.035, 0.035, 0.22, mat(['#f4f4f4', '#2e63c9'][k % 2]), -0.2 + k * 0.1, 0.18 + r * 0.35, 0.15, 10, g);
  const head = drawTex(256, 64, (c, w, h) => {
    c.fillStyle = '#20357a';
    c.fillRect(0, 0, w, h);
    c.fillStyle = '#ffffff';
    c.font = 'bold 34px sans-serif';
    c.textAlign = 'center';
    c.fillText('KAFEEN', w / 2, 44);
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
  const flower = (dz, purple) => (purple ? F.purpleKnight : F.periwinkle)(2.55, FT + 0.3, z + 0.42 + dz, 0.27);
  flower(-0.2, i % 2 === 0);
  flower(0.2, i % 2 === 1);
}
slab(2.32, 2.78, FT, FT + 1.1, -10.7, -3.6, mat('#000000'), 'COLLIDER_planter');
// by the KOUP pillar: two wooden reclining chairs (one pale, one teak) with a slatted folding table and its ashtray
F.slatTable(3.42, FT, -10.1, 0.15);
// two blue armchairs and their little round table
F.armchair(3.25, FT, -6.75, Wt, '#58708a', 0.8);
F.armchair(3.15, FT, -5.25, Wt, '#3b4d66', 0.8);
F.roundTable(3.0, FT, -6.0, 0.22, 0.5, mat('#3f6680'));
F.ribbedPlanter(2.55, FT, -3.25, 0.42, 0.7, 0.3);
F.periwinkle(2.55, FT + 0.3, -3.25, 0.3);
// the middle pairs of lounge chairs, facing each other
F.loungeChair(2.65, FT, -1.35, 0, C.olive);
F.loungeChair(3.35, FT, -1.35, 0, '#8a8f84');
F.loungeChair(2.65, FT, 0.45, N, C.navy);
F.loungeChair(3.35, FT, 0.45, N, C.navy);
F.frameTable(3.0, FT, -0.45, 0, 0.5, 0.45);
F.bigLeaf(2.55, FT, 2.65, 1.25, 'white', 0.22);
// south: chairs along the wall, planters, metal side tables at the edge
F.ribbedPlanter(2.55, FT, 5.9, 0.42, 0.7, 0.3);
F.purpleKnight(2.55, FT + 0.3, 5.9, 0.3);
F.loungeChair(2.6, FT, 6.65, E, C.black);
F.frameTable(2.6, FT, 7.35, 0, 0.42, 0.42);
F.loungeChair(2.6, FT, 8.15, E, C.navy);
F.loungeChair(2.6, FT, 9.15, E, '#b9a585');
F.frameTable(2.6, FT, 9.75, 0, 0.42, 0.42);
F.armchair(2.7, FT, 10.5, E, C.leatherBrown, 0.75);
F.frameTable(5.15, FT, 5.55, 0, 0.55, 0.6, M.wood);
F.frameTable(5.15, FT, 7.05, 0, 0.55, 0.6, M.wood);
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
  const gltf = await new GLTFLoader().loadAsync('models/wooden_reclining_chair.glb');
  const LENGTH = 1.45; // a Kentucky-style lounger: about 1.45 m long, 0.6 m wide
  const place = (x, z, wood) => {
    const model = gltf.scene.clone(true);
    // the model lies Z-up with its head at -y: stand it up (head to +z), then turn the head toward the planters (-x)
    model.rotation.x = -Math.PI / 2;
    const s = LENGTH / 2.11;
    model.scale.setScalar(s);
    const g = group(x, FT, z, -Math.PI / 2, 'reclining_chair');
    g.add(model);
    model.position.y = -0.0826 * s; // its feet on the floor
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.material = /cushion|linen/i.test(o.material.name) ? mat('#ece6da', { rough: 0.95 }) : /hook|metal|steel/i.test(o.material.name) ? mat('#9a9a96', { metal: 0.6, rough: 0.4 }) : wood;
    });
    contactShadow(0.62, LENGTH, x, FT, z, -Math.PI / 2);
  };
  place(3.62, -10.85, M.woodLight);
  place(3.62, -9.35, M.woodDark);
}
