// The bar's tools and KOUP's menu (owner, 2026-11-24): a visitor orders anything on KOUP's own menu
// (`menu.json`, from https://koupofficial.com/azadi) and the barista makes it as the café does, at the espresso machine
// or with the syrup bottles by the window, in KOUP's own cups.
//
// What the tour page moves is kept as it is (not merged): the bottles and jars (`PROP_bottle_<key>`, their extras: the
// kind, where a hand holds them, their mouth), the milk pitcher, the blender's jug, the ice scoop and the till's
// drawer. His places are named points (`BARISTA_<place>`). Every table gets KOUP's paper menu (`MENU_<n>`: build.html
// puts them in their table's item), and the menu itself, with its photos, rides in the model (`MENU`'s extras).
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { root, mat, ball, rbox, group, drawTex, tables, seats } from './lib.js';

const FI = -1.24;
/** KOUP's cups (as the tour page draws the drinks in them): radius at the base and the rim, height. */
export const CUPS = {
  espresso: { r0: 0.022, r1: 0.03, h: 0.058, color: '#e9dcc8' },
  hot: { r0: 0.03, r1: 0.045, h: 0.11, color: '#2e2420' },
  iced: { r0: 0.032, r1: 0.047, h: 0.13, color: '#e8f0f2' },
};
const COUNTER = FI + 1.0; // the bar counter's top
const WINDOW = FI + 0.89; // the window counter's top (the cold drinks are made there)

const point = (name, x, y, z, ry = 0, extras) => {
  const o = new THREE.Object3D();
  o.name = name;
  o.position.set(x, y, z);
  o.rotation.y = ry;
  if (extras) o.userData = extras;
  root.add(o);
  return o;
};

/** A turned shape from its outline (`[radius, height]`, bottom to top), with its own UVs: round (0…1) and up (0…1). */
function lathe(profile, h, seg = 20) {
  const g = new THREE.LatheGeometry(
    profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)),
    seg,
  );
  const p = g.attributes.position;
  const uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) {
    let u = Math.atan2(p.getX(i), p.getZ(i)) / (Math.PI * 2);
    if (u < 0) u += 1;
    uv.setXY(i, u, p.getY(i) / h);
  }
  return g;
}

// ---------- the bottles' labels: one picture for all (a cell each) ----------
const CELL = 128;
const LABELS = 8; // cells per row
function labelSheet(bottles) {
  const keys = Object.keys(bottles);
  const rows = Math.ceil(keys.length / LABELS);
  const tex = drawTex(CELL * LABELS, CELL * 8, (g) => {
    keys.forEach((k, i) => {
      const b = bottles[k];
      const x = (i % LABELS) * CELL,
        y = (Math.floor(i / LABELS)) * CELL;
      // up the bottle (the cell's bottom is the base): what is in it, the label, the neck and the cap
      const lab = (v0, v1, f) => g.fillRect(x, y + CELL * (1 - v1), CELL, CELL * (v1 - v0), (g.fillStyle = f));
      if (b.shape === 'carton') {
        lab(0, 1, '#f7f6f1');
        g.fillStyle = '#2f6fb3';
        g.fillRect(x, y + CELL * 0.55, CELL, CELL * 0.12);
      } else if (b.shape === 'jar' || b.shape === 'shaker') {
        lab(0, 0.74, b.color);
        lab(0.74, 1, b.shape === 'shaker' ? '#c9c9c4' : '#2a2422');
        lab(0.2, 0.62, '#f6f1e6');
      } else {
        lab(0, 1, b.color);
        lab(0.22, 0.58, '#f6f1e6');
        lab(0.82, 1, '#1d1b1a');
      }
      if (b.shape !== 'carton') {
        // KOUP and the flavour, on the side facing him (round 0.55…0.95: −x)
        g.fillStyle = '#3a2a22';
        g.textAlign = 'center';
        const cx = x + CELL * 0.75;
        g.font = `600 ${b.shape === 'bottle' ? 16 : 13}px serif`;
        g.fillText('KOUP', cx, y + CELL * (b.shape === 'bottle' ? 0.52 : 0.5));
        g.font = `600 ${b.label.length > 12 ? 8 : 10}px sans-serif`;
        g.fillText(b.label.toUpperCase().slice(0, 18), cx, y + CELL * (b.shape === 'bottle' ? 0.66 : 0.68));
      } else {
        g.fillStyle = '#2f6fb3';
        g.font = '700 14px sans-serif';
        g.textAlign = 'center';
        g.fillText('MILK', x + CELL * 0.75, y + CELL * 0.4);
      }
    });
    if (rows > 8) throw new Error('too many bottles');
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  return { tex, cell: (k) => keys.indexOf(k) };
}

/** A bottle (or jar, shaker, milk carton) of the rack, as a thing the barista picks up. */
function bottle(key, b, sheet, x, y, z) {
  const shapes = {
    bottle: { h: 0.27, prof: [[0.0005, 0], [0.03, 0], [0.032, 0.006], [0.032, 0.17], [0.026, 0.2], [0.013, 0.22], [0.012, 0.25], [0.014, 0.252], [0.014, 0.27], [0.0005, 0.27]] },
    jar: { h: 0.13, prof: [[0.0005, 0], [0.042, 0], [0.045, 0.008], [0.045, 0.095], [0.04, 0.1], [0.042, 0.102], [0.042, 0.13], [0.0005, 0.13]] },
    shaker: { h: 0.11, prof: [[0.0005, 0], [0.024, 0], [0.025, 0.006], [0.025, 0.08], [0.022, 0.085], [0.022, 0.1], [0.015, 0.11], [0.0005, 0.11]] },
    carton: { h: 0.2, prof: null },
  };
  const s = shapes[b.shape] ?? shapes.bottle;
  let geo;
  if (s.prof) geo = lathe(s.prof, s.h);
  else {
    geo = new THREE.BoxGeometry(0.07, 0.17, 0.07);
    geo.translate(0, 0.085, 0);
    const roof = new THREE.ConeGeometry(0.05, 0.03, 4);
    roof.rotateY(Math.PI / 4);
    roof.translate(0, 0.185, 0);
    const p = geo.attributes.position,
      uv = geo.attributes.uv;
    for (let i = 0; i < p.count; i++) {
      let u = Math.atan2(p.getX(i), p.getZ(i)) / (Math.PI * 2);
      if (u < 0) u += 1;
      uv.setXY(i, u, p.getY(i) / s.h);
    }
    const ru = roof.attributes.uv;
    for (let i = 0; i < ru.count; i++) ru.setXY(i, 0.1, 0.95);
    geo = mergeGeometries([geo, roof]);
  }
  // into the label sheet's cell
  const c = sheet.cell(key);
  const cx = (c % LABELS) / LABELS,
    cy = Math.floor(c / LABELS) / 8;
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, cx + (uv.getX(i) * 0.98 + 0.01) / LABELS, 1 - cy - (1 - (uv.getY(i) * 0.98 + 0.01)) / 8);
  const m = new THREE.Mesh(geo, mat('#ffffff', { map: sheet.tex, rough: 0.35 }));
  const holder = new THREE.Group();
  holder.name = `PROP_bottle_${key}`;
  holder.position.set(x, y, z);
  holder.add(m);
  holder.userData = { kind: 'bottle', key, hold: [0, s.h * 0.5, 0], mouth: [0, s.h, 0], color: b.color, shape: b.shape };
  root.add(holder);
  return holder;
}

export async function bar() {
  const M = await (await fetch('menu.json')).json();
  const photos = await (await fetch('menu/photos.jpg')).blob();
  const photosURL = await new Promise((r) => {
    const f = new FileReader();
    f.onload = () => r(f.result);
    f.readAsDataURL(photos);
  });
  // the menu, for the tour page (its photos as one picture: cells of `cell` px, `cols` a row)
  point('MENU', 0, FI, 0, 0, { menu: M, photos: photosURL });

  // ---- the syrup rack along the window: two rows (the back one raised), the coffee syrups and jars nearest the machine
  const sheet = labelSheet(M.bottles);
  const front = ['caramel', 'vanilla', 'vanilla_diet', 'hazelnut', 'condensed', 'chocolate', 'strawberry', 'karak', 'kazan', 'salep', 'matcha', 'lotus', 'nutella', 'oreo', 'cinnamon'];
  const back = ['mango', 'cherry', 'peach', 'lemon', 'blue_curacao', 'blue_pina', 'pineapple', 'blueberry', 'grape', 'passion_fruit', 'mojito', 'secret_garden', 'sunset', 'koup_mix', 'tea'];
  const rack = group(1.9, WINDOW, 6.88, 0, 'syrup_rack');
  rbox(0.13, 0.07, 1.46, 0.01, mat('#d9c29b', { rough: 0.6 }), 0.02, 0, 0, 0, rack);
  const Z0 = 6.22,
    DZ = 0.094;
  front.forEach((k, i) => bottle(k, M.bottles[k], sheet, 1.78, WINDOW, Z0 + i * DZ));
  back.forEach((k, i) => bottle(k, M.bottles[k], sheet, 1.92, WINDOW + 0.07, Z0 + 0.047 + i * DZ));

  // ---- the cold station in front of the rack: clear cups, the garnish tray, milk, soda and water, ice, the blender
  const clear = mat('#e8f0f2', { opacity: 0.45, rough: 0.1 });
  for (let i = 0; i < 4; i++) {
    const c = new THREE.Mesh(lathe([[CUPS.iced.r0, 0], [CUPS.iced.r1, CUPS.iced.h]], CUPS.iced.h, 22), clear);
    c.position.set(1.56, WINDOW + i * 0.012, 6.3);
    c.name = 'NOCOLLIDE_cups';
    root.add(c);
  }
  point('BARISTA_cups_iced', 1.56, WINDOW + 4 * 0.012 + 0.0001, 6.3);
  point('BARISTA_cold', 1.56, WINDOW, 6.88);
  {
    const tray = group(1.6, WINDOW, 7.12, 0, 'garnish_tray');
    rbox(0.12, 0.02, 0.2, 0.008, mat('#f2efe8', { rough: 0.4 }), 0, 0, 0, 0, tray);
    const lime = mat('#7cb342', { rough: 0.5 }),
      lemon = mat('#f2d64b', { rough: 0.5 }),
      leaf = mat('#3d8b37', { rough: 0.6 });
    for (let i = 0; i < 4; i++) ball(0.018, lime, -0.02 + (i % 2) * 0.03, 0.03, -0.075 + Math.floor(i / 2) * 0.03, 1, 0.55, 0.6, tray);
    for (let i = 0; i < 4; i++) ball(0.018, lemon, -0.02 + (i % 2) * 0.03, 0.03, 0.005 + Math.floor(i / 2) * 0.03, 1, 0.55, 0.6, tray);
    for (let i = 0; i < 5; i++) ball(0.014, leaf, -0.025 + (i % 3) * 0.022, 0.026, 0.07 + Math.floor(i / 3) * 0.02, 1, 0.3, 1.5, tray);
    point('BARISTA_garnish_lime', 1.595, WINDOW + 0.03, 7.06);
    point('BARISTA_garnish_lemon', 1.595, WINDOW + 0.03, 7.14);
    point('BARISTA_garnish_mint', 1.6, WINDOW + 0.03, 7.2);
  }
  bottle('milk', M.bottles.milk, sheet, 1.52, WINDOW, 7.32);
  bottle('soda', M.bottles.soda, sheet, 1.62, WINDOW, 7.36);
  bottle('water', M.bottles.water, sheet, 1.52, WINDOW, 7.42);
  {
    // the ice bin, full of ice, and its scoop
    const bin = group(1.59, WINDOW, 7.6, 0, 'ice_bin');
    const steel = mat('#cfd2d4', { metal: 0.8, rough: 0.3 });
    rbox(0.2, 0.1, 0.17, 0.008, steel, 0, 0, 0, 0, bin);
    const ice = mat('#eef6f8', { rough: 0.15, opacity: 0.85 });
    for (let i = 0; i < 14; i++) rbox(0.03, 0.03, 0.03, 0.006, ice, -0.07 + (i % 5) * 0.035, 0.078 + (i % 2) * 0.008, -0.05 + Math.floor(i / 5) * 0.045, i * 0.7, bin);
    point('BARISTA_ice', 1.59, WINDOW + 0.1, 7.6);
    const scoop = new THREE.Group();
    scoop.name = 'PROP_scoop';
    scoop.position.set(1.62, WINDOW + 0.105, 7.6);
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.026, 0.07, 14, 1, true), mat('#d8dadc', { metal: 0.8, rough: 0.25, side: THREE.DoubleSide }));
    cup.rotation.z = Math.PI / 2;
    cup.position.set(0.04, 0, 0);
    scoop.add(cup);
    const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8), mat('#2a2a2a'));
    handle.rotation.z = Math.PI / 2;
    handle.position.set(-0.03, 0, 0);
    scoop.add(handle);
    // held by its handle; its mouth the scoop's open end
    scoop.userData = { kind: 'scoop', hold: [-0.03, 0, 0], mouth: [0.075, 0, 0] };
    root.add(scoop);
  }
  {
    // the blender, its jug on it
    const base = group(1.6, WINDOW, 7.76, 0, 'blender');
    rbox(0.13, 0.1, 0.13, 0.02, mat('#2b2b2b', { rough: 0.5 }), 0, 0, 0, 0, base);
    ball(0.01, mat('#d8dadc', { metal: 0.7 }), -0.066, 0.05, 0, 0.5, 1, 1, base);
    const jug = new THREE.Group();
    jug.name = 'PROP_jug';
    jug.position.set(1.6, WINDOW + 0.1, 7.76);
    jug.add(new THREE.Mesh(lathe([[0.0005, 0], [0.045, 0], [0.06, 0.2], [0.0005, 0.2]], 0.2, 18), mat('#e8f0f2', { opacity: 0.35, rough: 0.1 })));
    const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.062, 0.062, 0.015, 18), mat('#2b2b2b'));
    lid.position.y = 0.207;
    jug.add(lid);
    jug.userData = { kind: 'jug', hold: [0, 0.1, 0], mouth: [0, 0.2, 0] };
    root.add(jug);
    point('BARISTA_blender', 1.6, WINDOW + 0.1, 7.76);
  }
  point('BARISTA_coldwork', 1.27, FI, 6.88, Math.PI / 2); // where he stands at the window counter

  // ---- at the machine: the milk pitcher, the hot cups and the espresso cups, the places under the group head and the
  // hot water tap, the steam wand's tip (the machine itself is in rooms.js)
  {
    const pitcher = new THREE.Group();
    pitcher.name = 'PROP_pitcher';
    pitcher.position.set(0.97, COUNTER, 5.7);
    const steel = mat('#d8dadc', { metal: 0.85, rough: 0.2 });
    pitcher.add(new THREE.Mesh(lathe([[0.0005, 0], [0.038, 0], [0.04, 0.004], [0.04, 0.06], [0.034, 0.095], [0.037, 0.1], [0.0005, 0.1]], 0.1, 18), steel));
    const spout = new THREE.Mesh(new THREE.ConeGeometry(0.012, 0.025, 8), steel);
    spout.rotation.x = Math.PI / 2;
    spout.position.set(0, 0.095, 0.04);
    pitcher.add(spout);
    pitcher.userData = { kind: 'pitcher', hold: [0, 0.05, 0], mouth: [0, 0.1, 0.045] };
    root.add(pitcher);
  }
  const stack = (x, z, cup, n, name) => {
    const m = mat(cup.color, { rough: 0.5 });
    for (let i = 0; i < n; i++) {
      const c = new THREE.Mesh(lathe([[cup.r0, 0], [cup.r1, cup.h]], cup.h, 20), m);
      c.position.set(x, COUNTER + i * 0.012, z);
      c.name = 'NOCOLLIDE_cups';
      root.add(c);
    }
    point(name, x, COUNTER + n * 0.012 + 0.0001, z);
  };
  stack(1.98, 5.66, CUPS.hot, 4, 'BARISTA_cups');
  stack(2.0, 5.47, CUPS.espresso, 3, 'BARISTA_cups_espresso');
  point('BARISTA_fill', 1.45, COUNTER + 0.054, 5.7);
  point('BARISTA_shot', 1.45, COUNTER + 0.238, 5.69);
  point('BARISTA_water_cup', 1.8, COUNTER + 0.054, 5.7);
  point('BARISTA_water', 1.8, COUNTER + 0.21, 5.7);
  point('BARISTA_wand', 1.1, COUNTER + 0.12, 5.7);
  point('BARISTA_steam', 1.1, COUNTER + 0.16, 5.7);

  // ---- the till (the money goes in its drawer), behind the counter between the card machine and the free end
  {
    const t = group(0.82, COUNTER, 5.62, 0, 'till');
    rbox(0.24, 0.06, 0.2, 0.01, mat('#1f1f1f', { rough: 0.5 }), 0, 0, 0, 0, t);
    const screen = rbox(0.14, 0.09, 0.012, 0.005, mat('#2b2b2b'), 0, 0.06, -0.04, 0, t);
    screen.rotation.x = -0.35;
    rbox(0.12, 0.075, 0.006, 0.002, mat('#7fb7c9', { emissive: '#4a8aa0', ei: 0.4 }), 0, 0.068, -0.032, 0, t).rotation.x = -0.35;
    // its drawer (in the till's foot; it slides out toward him)
    const drawer = new THREE.Group();
    drawer.name = 'PROP_drawer';
    drawer.position.set(0.82, COUNTER + 0.006, 5.62);
    drawer.add(new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.045, 0.19).translate(0, 0.0225, 0), mat('#2a2a2a', { rough: 0.5 })));
    drawer.add(new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.004, 0.17).translate(0, 0.043, 0), mat('#5b5f63', { rough: 0.6 })));
    drawer.add(new THREE.Mesh(new THREE.BoxGeometry(0.224, 0.048, 0.004).translate(0, 0.024, 0.1015), mat('#333333', { rough: 0.45 })));
    drawer.userData = { kind: 'drawer', open: [0, 0, 0.14], money: [0, 0.046, 0.02] };
    root.add(drawer);
  }

  // ---- KOUP's paper menu on every table (as their printed one), turned to be read from the nearest seat
  const paperTex = drawTex(1240, 1754, (g, w, h) => paper(g, w, h, M));
  paperTex.colorSpace = THREE.SRGBColorSpace;
  const paperMat = mat('#ffffff', { map: paperTex, rough: 0.9 });
  const papers = [];
  const v = new THREE.Vector3();
  root.updateMatrixWorld(true);
  for (const t of tables) {
    const at = t.g.getWorldPosition(new THREE.Vector3());
    let near = null;
    for (const s of seats) {
      const p = s.g.localToWorld(v.set(s.dx, 0, s.dz * s.fwd));
      const d = Math.hypot(p.x - at.x, p.z - at.z);
      if (!near || d < near.d) near = { d, x: p.x, z: p.z };
    }
    // reading it from the seat: its top away from them
    const yaw = near ? Math.atan2(near.x - at.x, near.z - at.z) : 0;
    // A4, smaller on a small table
    const k = Math.min(1, (t.round ? t.hw * 1.3 : Math.min(t.hw, t.hd) * 1.6) / 0.297);
    const m = new THREE.Mesh(new THREE.BoxGeometry(0.21 * k, 0.001, 0.297 * k), paperMat);
    m.name = 'NOCOLLIDE_menu';
    t.g.updateMatrixWorld(true);
    const wq = t.g.getWorldQuaternion(new THREE.Quaternion());
    m.position.set(0, t.h + 0.0006, 0);
    // the paper's +z (its bottom edge) toward the seat, in the table's own space
    const want = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw + (Math.random() - 0.5) * 0.25);
    m.quaternion.copy(wq.clone().invert().multiply(want));
    t.g.add(m);
    papers.push({ g: t.g, at: new THREE.Vector3(0, t.h, 0) });
  }
  return papers;
}

/** KOUP's printed menu (owner's photo, 2026-11-24): the café's name, a band of diamonds, the menu in three columns. */
function paper(g, w, h, M) {
  g.fillStyle = '#fbfaf6';
  g.fillRect(0, 0, w, h);
  const BROWN = '#5b3a2e';
  g.strokeStyle = BROWN;
  g.lineWidth = 3;
  g.strokeRect(50, 50, w - 100, h - 100);
  g.fillStyle = '#3a2a22';
  g.font = '300 120px serif';
  g.textBaseline = 'alphabetic';
  g.textAlign = 'left';
  g.fillText('KOUP', 110, 250);
  g.font = '700 84px ar, sans-serif';
  g.textAlign = 'right';
  g.fillText('كوپ مينيو', w - 110, 245);
  // the band of diamonds
  g.fillStyle = BROWN;
  g.fillRect(90, 300, w - 180, 70);
  g.strokeStyle = '#f3ede4';
  g.lineWidth = 3;
  for (let x = 120; x < w - 110; x += 48) {
    g.beginPath();
    g.moveTo(x, 335 - 22);
    g.lineTo(x + 22, 335);
    g.lineTo(x, 335 + 22);
    g.lineTo(x - 22, 335);
    g.closePath();
    g.stroke();
    g.strokeRect(x - 6, 329, 12, 12);
  }
  g.fillStyle = '#3a2a22';
  g.font = '500 32px sans-serif';
  g.textAlign = 'left';
  g.fillText('MENU', 110, 425);
  g.textAlign = 'right';
  g.fillText('COFFEE · COLD DRINKS · MOJITOS', w - 110, 410);
  g.fillRect(100, 445, w - 200, 3);
  // three columns, the categories in order
  const cols = [
    ['hot-coffee', 'hot-drinks'],
    ['iced-coffee', 'iced-tea', 'smothie', 'milkshake'],
    ['mocktails', 'mojitos', 'matcha', 'sweets'],
  ];
  const colW = (w - 200) / 3;
  cols.forEach((ids, c) => {
    const x0 = 100 + c * colW + 18,
      x1 = 100 + (c + 1) * colW - 18;
    let y = 520;
    if (c > 0) g.fillRect(100 + c * colW, 490, 3, 1080);
    for (const id of ids) {
      const cat = M.categories.find((k) => k.id === id);
      const list = M.items.filter((i) => i.cat === id);
      if (!cat || !list.length) continue;
      g.fillStyle = '#3a2a22';
      g.textAlign = 'center';
      g.font = '500 34px sans-serif';
      g.fillText(cat.label.toUpperCase(), (x0 + x1) / 2, y);
      g.fillRect(x0, y + 14, x1 - x0, 3);
      y += 62;
      list.forEach((it, n) => {
        g.textAlign = 'left';
        g.font = '400 16px sans-serif';
        g.fillStyle = '#8a7a70';
        g.fillText(String(n + 1).padStart(2, '0'), x0, y);
        g.fillStyle = '#2a1f1a';
        let name = it.name;
        g.font = '600 25px sans-serif';
        while (g.measureText(name).width > x1 - x0 - 120 && name.length > 4) name = name.slice(0, -2) + '…';
        g.fillText(name, x0 + 30, y);
        g.textAlign = 'right';
        g.font = '600 23px sans-serif';
        g.fillText(it.price.toLocaleString('en-US'), x1, y);
        g.fillStyle = '#e4ddd2';
        g.fillRect(x0 + 30, y + 10, x1 - x0 - 30, 1.5);
        y += 41;
      });
      y += 34;
    }
  });
  g.fillStyle = '#3a2a22';
  g.textAlign = 'center';
  g.font = '600 40px sans-serif';
  g.fillText('@koup.kr', w / 2, h - 120);
  g.font = '400 20px sans-serif';
  g.fillStyle = '#8a7a70';
  g.fillText('Prices in Iraqi dinars (IQD)', w / 2, h - 80);
}
