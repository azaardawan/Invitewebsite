// The café's people (owner, 2026-11-24: "anatomically accurate faces, body proportions, hands, fingers and joint
// positions"; the character-anatomy-animation skill): one skinned body per person on a real skeleton, in the café's
// soft animation style. The tour page moves the bones by name (src/components/tour/character.ts).
//
// The skeleton (bind pose: standing, facing +Z, arms a little out; every bone's own axes are the body's, so a rotation
// about X bends forward/back, about Z sideways): <P>_hips → <P>_torso (the waist) → <P>_chest → <P>_neck → <P>_head;
// <P>_chest → <P>_armL|R (shoulder) → <P>_foreL|R (elbow) → <P>_wristL|R → fingers (<P>_f<n>aL|R, <P>_f<n>bL|R for
// n = 1 index … 4 little) and thumb (<P>_thumbaL|R, <P>_thumbbL|R); <P>_hips → <P>_legL|R (hip) → <P>_shinL|R (knee)
// → <P>_footL|R (ankle). Grip sockets: <P>_handL|R (in the palm, where a cup is held), <P>_pinchL|R (between thumb and
// fingertips, where a cookie is held). Face: <P>_eyeL|R (turns for the gaze), <P>_lidL|R (blinks), <P>_browL|R, <P>_mouth.
//
// Proportions (an adult man of about 1.80 m, ~7.6 heads): hip joints at 0.92 m, knees at 0.49, ankles at 0.07;
// shoulders at 1.41, elbows at 1.13, wrists at 0.885; the hand 0.19 long (a tenth of the height), the forearm 0.245,
// the upper arm 0.28, thigh 0.43, shin 0.42.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { mat, rbox, group, shadowTex } from './lib.js';

const FI = -1.24;
export const BODY = {
  hipY: 0.95,
  hipJoint: [0.095, -0.03],
  thigh: 0.43,
  shin: 0.42,
  waist: 0.0,
  chest: 0.28,
  neck: 0.53,
  head: 0.578,
  shoulder: [0.158, 0.462],
  upper: 0.28,
  fore: 0.245,
  armOut: 0.11,
  elbowRest: -0.14,
};

// The shirt: a soft T-shirt torso (a turned profile, flattened front to back), from the waist (y 0 = the waist bone).
export const TORSO = [
  [0.188, -0.08],
  [0.192, 0.0],
  [0.182, 0.14],
  [0.188, 0.28],
  [0.198, 0.38],
  [0.2, 0.44],
  [0.188, 0.49],
  [0.15, 0.525],
  [0.09, 0.552],
  [0.06, 0.562],
];
export const DEPTH = 0.6;
const radiusAt = (y) => {
  for (let i = 1; i < TORSO.length; i++) {
    const [r0, y0] = TORSO[i - 1],
      [r1, y1] = TORSO[i];
    if (y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
  }
  return TORSO[TORSO.length - 1][0];
};

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** A turned shape from its outline, top to bottom: `[radius, y]` pairs, closed at both ends. */
function lathe(profile, seg = 18, close = true) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(Math.max(0.0005, r), y)).reverse();
  if (close) {
    pts.unshift(new THREE.Vector2(0.0005, pts[0].y - 0.003));
    pts.push(new THREE.Vector2(0.0005, pts[pts.length - 1].y + 0.003));
  }
  return new THREE.LatheGeometry(pts, seg);
}

/** Skin weights for a geometry: `weigh(x, y, z)` gives [[bone, weight], …] (up to 4) in the geometry's own space. */
function skin(geo, weigh) {
  const p = geo.attributes.position;
  const idx = new Uint16Array(p.count * 4);
  const wts = new Float32Array(p.count * 4);
  for (let i = 0; i < p.count; i++) {
    const w = weigh(p.getX(i), p.getY(i), p.getZ(i)).filter(([, v]) => v > 0.001);
    const sum = w.reduce((s, [, v]) => s + v, 0) || 1;
    w.slice(0, 4).forEach(([b, v], k) => {
      idx[i * 4 + k] = b;
      wts[i * 4 + k] = v / sum;
    });
  }
  geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(idx, 4));
  geo.setAttribute('skinWeight', new THREE.Float32BufferAttribute(wts, 4));
  return geo;
}
/** Two bones blended across [a, b] of a coordinate (below a: `lo`, above b: `hi`). */
const blend = (lo, hi, a, b, v) => {
  const t = smooth(a, b, v);
  return [
    [lo, 1 - t],
    [hi, t],
  ];
};

/** A print laid on the shirt's curve (front: +z, back: −z), `w` × `h` m, its middle at height `y` above the waist. */
function printGeo(w, h, y, back) {
  const g = new THREE.PlaneGeometry(w, h, 16, 8);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i),
      yy = p.getY(i) + y;
    const a = radiusAt(yy);
    const z = DEPTH * a * Math.sqrt(Math.max(0, 1 - (x / a) ** 2)) + 0.003;
    p.setXYZ(i, back ? -x : x, yy, back ? -z : z);
  }
  g.computeVertexNormals();
  return g;
}

async function loadTex(url) {
  const t = await new THREE.TextureLoader().loadAsync(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.userData.mimeType = 'image/jpeg';
  return t;
}

function bone(name, parent, x, y, z) {
  const b = new THREE.Bone();
  b.name = name;
  b.position.set(x, y, z);
  if (parent) parent.add(b);
  return b;
}

// A finger: knuckle positions across the palm's end (along z, index at the front/thumb side), lengths, thickness.
const FINGERS = [
  { z: 0.024, len: [0.044, 0.044], r: 0.0088 }, // index
  { z: 0.008, len: [0.048, 0.048], r: 0.0092 }, // middle
  { z: -0.008, len: [0.045, 0.044], r: 0.0088 }, // ring
  { z: -0.023, len: [0.036, 0.034], r: 0.0075 }, // little
];
export const HAND = { palmLen: 0.095, palmW: 0.078, palmT: 0.028, FINGERS };

/**
 * A member of staff: legs in jeans, the KOUP T-shirt in `shirtColour` with its prints, neck, arms, hands with fingers
 * and thumbs, shoes; skinned on the skeleton described above. Returns the root, the head bone (each person has their
 * own face) and the skin material.
 */
export async function person(P, x, z, ry, shirtColour, prints, skinColour, jeansColour = '#3b3e45') {
  const skinM = mat(skinColour, { rough: 0.62 });
  const shirtM = mat(shirtColour, { rough: 0.92 });
  const jeansM = mat(jeansColour, { rough: 0.95 });
  const root = group(x, FI, z, ry, P);
  // his own soft shadow, moving with him
  const sh = new THREE.Mesh(new THREE.PlaneGeometry(0.62, 0.5), new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
  sh.rotation.x = -Math.PI / 2;
  sh.position.y = 0.006;
  sh.name = `${P}_shadow`;
  root.add(sh);

  // ---- the skeleton ----
  const bones = [];
  const B = (name, parent, x0, y0, z0) => {
    const b = bone(`${P}_${name}`, parent, x0, y0, z0);
    bones.push(b);
    return b;
  };
  const hips = B('hips', null, 0, BODY.hipY, 0);
  root.add(hips);
  const torso = B('torso', hips, 0, 0, 0);
  const chest = B('chest', torso, 0, BODY.chest, 0);
  const neck = B('neck', chest, 0, BODY.neck - BODY.chest, 0);
  const head = B('head', neck, 0, BODY.head - BODY.neck, 0.012);
  const side = {};
  for (const [s, sx] of [
    ['L', 1],
    ['R', -1],
  ]) {
    const arm = B(`arm${s}`, chest, sx * BODY.shoulder[0], BODY.shoulder[1] - BODY.chest, 0);
    arm.rotation.z = sx * BODY.armOut;
    const fore = B(`fore${s}`, arm, 0, -BODY.upper, 0);
    fore.rotation.x = BODY.elbowRest;
    const wrist = B(`wrist${s}`, fore, 0, -BODY.fore, 0);
    const fingers = FINGERS.map((f, n) => {
      const a = B(`f${n + 1}a${s}`, wrist, 0, -HAND.palmLen, f.z);
      const b = B(`f${n + 1}b${s}`, a, 0, -f.len[0], 0);
      return [a, b];
    });
    // the thumb: from the palm's root on its front (thumb) side, pointing down and forward
    const ta = B(`thumba${s}`, wrist, -sx * 0.012, -0.028, 0.03);
    ta.rotation.set(-0.5, 0, -sx * 0.25);
    const tb = B(`thumbb${s}`, ta, 0, -0.036, 0);
    const leg = B(`leg${s}`, hips, sx * BODY.hipJoint[0], BODY.hipJoint[1], 0);
    const shin = B(`shin${s}`, leg, 0, -BODY.thigh, 0);
    const foot = B(`foot${s}`, shin, 0, -BODY.shin, 0);
    side[s] = { sx, arm, fore, wrist, fingers, ta, tb, leg, shin, foot };
  }
  root.updateMatrixWorld(true);
  const index = (b) => bones.indexOf(b);
  // a part made in a bone's own space, brought into the body's (bind) space
  const place = (geo, b) => geo.applyMatrix4(new THREE.Matrix4().copy(root.matrixWorld).invert().multiply(b.matrixWorld));

  const parts = { skin: [], shirt: [], jeans: [] };
  const add = (kind, geo) => {
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) geo.deleteAttribute(k);
    parts[kind].push(geo);
  };

  // the torso (shirt), in the waist bone's space: hips below, the waist bending, the chest above
  const iH = index(hips),
    iT = index(torso),
    iC = index(chest),
    iN = index(neck),
    iHd = index(head);
  const torsoW = (y) => {
    if (y < 0.12) return blend(iH, iT, -0.02, 0.12, y);
    return blend(iT, iC, 0.2, 0.34, y);
  };
  const shirtGeo = new THREE.LatheGeometry(
    TORSO.map(([r, y]) => new THREE.Vector2(r, y)),
    32,
  );
  shirtGeo.scale(1, 1, DEPTH);
  skin(shirtGeo, (_x, y) => torsoW(y));
  add('shirt', place(shirtGeo, torso));
  // the collar
  const collar = new THREE.TorusGeometry(0.062, 0.011, 8, 28);
  collar.rotateX(Math.PI / 2);
  collar.scale(1, 0.85, 1);
  collar.translate(0, 0.566, 0);
  skin(collar, () => [[iC, 1]]);
  add('shirt', place(collar, torso));
  // the neck: from inside the collar up into the head
  const neckGeo = lathe([
    [0.05, 0.075],
    [0.052, 0.03],
    [0.058, -0.04],
  ]);
  skin(neckGeo, (_x, y) => (y < 0.0 ? blend(iC, iN, -0.035, 0.0, y) : blend(iN, iHd, 0.03, 0.07, y)));
  add('skin', place(neckGeo, neck));

  // hips (the jeans' seat), in the hips bone's space
  const seat = new THREE.SphereGeometry(0.16, 20, 12);
  seat.scale(1, 0.72, 0.7);
  seat.translate(0, -0.1, 0);
  skin(seat, () => [[iH, 1]]);
  add('jeans', place(seat, hips));

  for (const s of ['L', 'R']) {
    const { arm, fore, wrist, leg, shin, foot } = side[s];
    const iA = index(arm),
      iF = index(fore),
      iW = index(wrist),
      iL = index(leg),
      iS = index(shin),
      iFt = index(foot);
    // the arm: shoulder (in the shirt), biceps, elbow, forearm, wrist; the shoulder blends into the chest
    const armGeo = lathe(
      [
        [0.048, 0.02],
        [0.052, -0.06],
        [0.051, -0.12],
        [0.046, -0.2],
        [0.04, -0.27],
        [0.039, -0.3],
        [0.043, -0.34],
        [0.041, -0.4],
        [0.033, -0.47],
        [0.027, -0.52],
      ],
      18,
    );
    skin(armGeo, (_x, y) => {
      const d = -y;
      if (d < 0.04) return blend(iC, iA, -0.02, 0.04, d);
      if (d < 0.25) return [[iA, 1]];
      if (d < 0.31) return blend(iA, iF, 0.25, 0.31, d);
      if (d < 0.5) return [[iF, 1]];
      return blend(iF, iW, 0.5, 0.53, d);
    });
    add('skin', place(armGeo, arm));
    // the short sleeve over the shoulder and upper arm, its hem just above the elbow
    const sleeve = lathe(
      [
        [0.0, 0.05],
        [0.03, 0.045],
        [0.052, 0.022],
        [0.06, -0.02],
        [0.059, -0.1],
        [0.058, -0.15],
        [0.056, -0.162],
      ],
      20,
    );
    skin(sleeve, (_x, y) => blend(iC, iA, -0.03, 0.03, -y));
    add('shirt', place(sleeve, arm));
    // the leg (jeans): hip, thigh, knee, shin, to the ankle
    const legGeo = lathe(
      [
        [0.07, 0.06],
        [0.08, -0.04],
        [0.072, -0.2],
        [0.062, -0.36],
        [0.056, -0.43],
        [0.058, -0.5],
        [0.054, -0.62],
        [0.046, -0.82],
        [0.045, -0.86],
      ],
      18,
    );
    skin(legGeo, (_x, y) => {
      const d = -y;
      if (d < 0.05) return blend(iH, iL, -0.04, 0.05, d);
      if (d < 0.39) return [[iL, 1]];
      if (d < 0.47) return blend(iL, iS, 0.39, 0.47, d);
      if (d < 0.8) return [[iS, 1]];
      return blend(iS, iFt, 0.8, 0.86, d);
    });
    add('jeans', place(legGeo, leg));
    // the shoe: dark leather, a pale sole; heel under the ankle, toes forward (rigid, on the foot bone)
    const shoe = rbox(0.098, 0.07, 0.26, 0.034, mat('#2a2522', { rough: 0.6 }), 0, -0.07, 0.045, 0, foot);
    shoe.name = `${P}_shoe${s}`;
    rbox(0.102, 0.018, 0.265, 0.008, mat('#e9e4da'), 0, -0.07, 0.045, 0, foot);
  }

  // the hands: palm (with the ball of the thumb), four fingers of two parts, the thumb of two; rigid on their bones
  for (const s of ['L', 'R']) {
    const { sx, wrist, fingers, ta, tb } = side[s];
    // the palm: a little wider at the knuckles, flattened (its back faces out, its face toward the body)
    const palm = new THREE.SphereGeometry(0.5, 16, 12);
    palm.scale(HAND.palmT, HAND.palmLen + 0.012, HAND.palmW);
    palm.translate(0, -HAND.palmLen / 2 - 0.004, 0.002);
    const pm = new THREE.Mesh(palm, skinM);
    pm.name = `${P}_palm${s}`;
    wrist.add(pm);
    // the ball of the thumb (thenar), on the palm's face near the thumb
    const thenar = new THREE.Mesh(new THREE.SphereGeometry(0.018, 12, 8), skinM);
    thenar.scale.set(0.9, 1.4, 1);
    thenar.position.set(-sx * 0.006, -0.04, 0.022);
    wrist.add(thenar);
    FINGERS.forEach((f, n) => {
      const [a, b] = fingers[n];
      const seg = (len, r, tip) => {
        const g = new THREE.CapsuleGeometry(r, len - r * 1.2, 4, 10);
        g.translate(0, -len / 2, 0);
        if (tip) g.scale(1, 1, 0.95);
        return g;
      };
      const ma = new THREE.Mesh(seg(f.len[0], f.r, false), skinM);
      a.add(ma);
      const mb = new THREE.Mesh(seg(f.len[1], f.r * 0.92, true), skinM);
      b.add(mb);
    });
    const tma = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.024, 4, 10), skinM);
    tma.position.y = -0.018;
    ta.add(tma);
    const tmb = new THREE.Mesh(new THREE.CapsuleGeometry(0.0095, 0.02, 4, 10), skinM);
    tmb.position.y = -0.016;
    tb.add(tmb);
    // the grip socket: where a cup's middle sits when the hand holds it (in front of the palm's face, the thumb up)
    const grip = new THREE.Object3D();
    grip.name = `${P}_hand${s}`;
    grip.position.set(-sx * 0.058, -0.062, 0.0);
    wrist.add(grip);
    // the pinch socket: between the thumb tip and the fingertips (a cookie held by its edge)
    const pinch = new THREE.Object3D();
    pinch.name = `${P}_pinch${s}`;
    pinch.position.set(-sx * 0.022, -0.115, 0.03);
    wrist.add(pinch);
  }

  // one skinned mesh per material (skin, shirt, jeans), and the shirt's prints
  const skeleton = new THREE.Skeleton(bones);
  const [front, back] = await Promise.all([loadTex(prints[0]), loadTex(prints[1])]);
  const meshes = [];
  const make = (geos, material, name) => {
    // indexed parts kept indexed: their normals stay smooth (each part's own, made with it)
    const geo = mergeGeometries(geos, false);
    const m = new THREE.SkinnedMesh(geo, material);
    m.name = name;
    m.frustumCulled = false;
    root.add(m);
    // bound where the body stands (glTF's inverse bind matrices are then relative to the mesh, as the loader expects)
    m.updateMatrixWorld(true);
    m.bind(skeleton, m.matrixWorld);
    meshes.push(m);
    return m;
  };
  make(parts.skin, skinM, `${P}_body`);
  make(parts.shirt, shirtM, `${P}_shirt`);
  make(parts.jeans, jeansM, `${P}_jeans`);
  for (const [tex, w, h, y, isBack] of [
    [front, 0.12, 0.082, 0.42, false],
    [back, 0.32, 0.307, 0.27, true],
  ]) {
    const g = printGeo(w, h, y, isBack);
    skin(g, (_x, yy) => torsoW(yy));
    place(g, torso);
    const m = new THREE.SkinnedMesh(g, mat('#ffffff', { map: tex, rough: 0.9 }));
    m.name = `${P}_print`;
    m.frustumCulled = false;
    root.add(m);
    // bound where the body stands (glTF's inverse bind matrices are then relative to the mesh, as the loader expects)
    m.updateMatrixWorld(true);
    m.bind(skeleton, m.matrixWorld);
  }
  return { root, head, skin: skinM, bones: side };
}

/**
 * The eyes, lids and brows of a face (named for the tour page: the eyes turn to look, the lids blink, the brows lift).
 * `zAt(x, y)` is the face's surface; eyes at ±`ex`, height `ey`; `iris` its colour; `brow` [width, height, tilt, colour].
 */
export function eyes(head, P, zAt, { ex, ey, iris, lid, brow, browY }) {
  for (const [s, sx] of [
    ['L', 1],
    ['R', -1],
  ]) {
    const x = sx * ex;
    const z = zAt(x, ey) - 0.006;
    // the eye: a ball in its socket (white, the iris and pupil on its front, a shine); it turns about its middle
    const eye = new THREE.Group();
    eye.name = `${P}_eye${s}`;
    eye.position.set(x, ey, z);
    head.add(eye);
    const white = new THREE.Mesh(new THREE.SphereGeometry(0.0125, 16, 12), mat('#fbfaf7', { rough: 0.25 }));
    eye.add(white);
    const irisM = new THREE.Mesh(new THREE.CircleGeometry(0.0074, 20), mat(iris, { rough: 0.3 }));
    irisM.position.z = 0.0122;
    eye.add(irisM);
    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.0038, 16), mat('#121010', { rough: 0.2 }));
    pupil.position.z = 0.0124;
    eye.add(pupil);
    const shine = new THREE.Mesh(new THREE.CircleGeometry(0.0018, 10), mat('#ffffff', { basic: true }));
    shine.position.set(0.0028, 0.0028, 0.0126);
    eye.add(shine);
    // the upper lid: a shell of skin over the eye's top, turning down over it to blink (it never passes into the eye)
    const lidG = new THREE.Group();
    lidG.name = `${P}_lid${s}`;
    lidG.position.copy(eye.position);
    head.add(lidG);
    const shell = new THREE.Mesh(new THREE.SphereGeometry(0.0136, 18, 10, 0, Math.PI * 2, 0, Math.PI * 0.5), mat(lid, { rough: 0.6, side: THREE.DoubleSide }));
    // open: the shell's rim just above the iris, leaning back
    shell.rotation.x = -0.25;
    lidG.add(shell);
    lidG.rotation.x = -0.62;
    // the brow
    const [bw, bh, tilt, colour] = brow;
    const b = rbox(bw, bh, 0.009, 0.004, mat(colour), x, browY, zAt(x, browY) - 0.003, 0, head);
    b.rotation.z = sx * tilt;
    b.name = `${P}_brow${s}`;
  }
}
