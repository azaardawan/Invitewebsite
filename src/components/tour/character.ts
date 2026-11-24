/**
 * A tour's person, posed by layers each frame (owner, 2026-11-24, the character-anatomy-animation and
 * npc-interaction-animation skills): reusable for every member of staff of every café (the barista, the waiter…).
 *
 * The model's skeleton (tours/koupup/people.js): `<P>_hips`, `<P>_torso` (the waist), `<P>_chest`, `<P>_neck`,
 * `<P>_head`; `<P>_armL|R`, `<P>_foreL|R`, `<P>_wristL|R` with fingers `<P>_f<n>a|bL|R` and thumb `<P>_thumba|bL|R`;
 * `<P>_legL|R`, `<P>_shinL|R`, `<P>_footL|R`; sockets `<P>_handL|R` (a cup in the palm) and `<P>_pinchL|R` (a cookie
 * between thumb and fingers); the face's `<P>_eyeL|R`, `<P>_lidL|R`, `<P>_browL|R`, `<P>_mouth`.
 *
 * The order of the layers, so none overwrites another: the rest pose → the walk (driven by the distance walked: the
 * feet keep pace with the floor) → bending and crouching → looking (head, then the eyes) → reaching (each arm's
 * two-bone IK, its weight eased in and out) → the fingers' grip → blinking and the face. Then the matrices, and only
 * then whatever is held (it follows its socket).
 */
import * as THREE from 'three';
import { advanceGait, approach, elbowFor, gaitPose } from './ik';

export type Side = 'L' | 'R';
export type HandPose = 'relaxed' | 'grip' | 'pinch' | 'flat';
/** Finger bends (radians) per pose: [proximal, distal] for the index…little finger, and the thumb [base, tip]. */
const POSES: Record<HandPose, { f: [number, number][]; t: [number, number] }> = {
  relaxed: { f: [[0.28, 0.42], [0.32, 0.46], [0.36, 0.5], [0.42, 0.55]], t: [0.15, 0.2] },
  // round a cup: the fingers wrap its side, the thumb across the front
  grip: { f: [[1.0, 1.05], [1.02, 1.08], [1.05, 1.1], [1.1, 1.15]], t: [0.55, 0.45] },
  // a cookie's edge between the thumb and the first two fingers; the others tucked
  pinch: { f: [[0.75, 0.55], [0.7, 0.5], [1.35, 1.3], [1.45, 1.35]], t: [0.75, 0.35] },
  flat: { f: [[0.06, 0.06], [0.05, 0.05], [0.06, 0.06], [0.08, 0.06]], t: [0.05, 0.05] },
};
const SIDES: Side[] = ['L', 'R'];
const UP = new THREE.Vector3(0, 1, 0);
const DOWN = new THREE.Vector3(0, -1, 0);

type Arm = {
  sx: number;
  arm: THREE.Object3D;
  fore: THREE.Object3D;
  wrist: THREE.Object3D;
  fingers: [THREE.Object3D, THREE.Object3D][];
  thumb: [THREE.Object3D, THREE.Object3D];
  grip: THREE.Object3D;
  pinch: THREE.Object3D;
  upper: number;
  lower: number;
};
type Leg = { thigh: THREE.Object3D; shin: THREE.Object3D; foot: THREE.Object3D };
/** A reach: where the hand's socket must be (world), how the hand turns there (world, optional), how much (0…1). */
export type Reach = { at: THREE.Vector3; quat?: THREE.Quaternion; socket?: 'grip' | 'pinch'; weight: number };

export class Character {
  readonly root: THREE.Object3D;
  private P: string;
  private b = {} as Record<'hips' | 'torso' | 'chest' | 'neck' | 'head', THREE.Object3D>;
  private arms = {} as Record<Side, Arm>;
  private legs = {} as Record<Side, Leg>;
  private rest = new Map<THREE.Object3D, { q: THREE.Quaternion; p: THREE.Vector3; s: THREE.Vector3 }>();
  private face: { eyes: THREE.Object3D[]; lids: THREE.Object3D[]; brows: THREE.Object3D[]; mouth?: THREE.Object3D } = { eyes: [], lids: [], brows: [] };
  // the layers' state
  private phase = 0;
  private walkW = 0;
  private walkTarget = 0;
  private time = Math.random() * 10;
  private nextBlink = 1 + Math.random() * 3;
  private blinkT = -1;
  private lookAt: THREE.Vector3 | null = null;
  private lookW = 0;
  private headYaw = 0;
  private headPitch = 0;
  /** Bending forward at the waist (radians), and crouching (0…1: knees bent, hips lowered), eased. */
  lean = 0;
  crouch = 0;
  private leanNow = 0;
  private crouchNow = 0;
  /** Each hand's reach (null: the arm hangs or swings), and its fingers' pose. */
  reach: Record<Side, Reach | null> = { L: null, R: null };
  private reachW: Record<Side, number> = { L: 0, R: 0 };
  private lastReach: Record<Side, Reach | null> = { L: null, R: null };
  hand: Record<Side, HandPose> = { L: 'relaxed', R: 'relaxed' };
  private handNow: Record<Side, { f: [number, number][]; t: [number, number] }>;
  /** A smile (0…1) and the brows lifted (0…1), eased. */
  smile = 0.4;
  brows = 0;
  private smileNow = 0.4;
  private browsNow = 0;
  private v1 = new THREE.Vector3();
  private v2 = new THREE.Vector3();
  private q1 = new THREE.Quaternion();
  private q2 = new THREE.Quaternion();
  private e1 = new THREE.Euler();

  /** The person `P` of the model (null when the model hasn't the bones this needs). */
  static find(scene: THREE.Object3D, P: string): Character | null {
    const root = scene.getObjectByName(P);
    if (!root || !root.getObjectByName(`${P}_hips`) || !root.getObjectByName(`${P}_wristR`)) return null;
    return new Character(root, P);
  }

  private constructor(root: THREE.Object3D, P: string) {
    this.root = root;
    this.P = P;
    const need = (n: string) => {
      const o = root.getObjectByName(`${P}_${n}`);
      if (!o) throw new Error(`${P}_${n} missing`);
      return o;
    };
    for (const n of ['hips', 'torso', 'chest', 'neck', 'head'] as const) this.b[n] = need(n);
    for (const s of SIDES) {
      const arm = need(`arm${s}`),
        fore = need(`fore${s}`),
        wrist = need(`wrist${s}`);
      const fingers = [1, 2, 3, 4].map((n) => [need(`f${n}a${s}`), need(`f${n}b${s}`)] as [THREE.Object3D, THREE.Object3D]);
      this.arms[s] = {
        sx: s === 'L' ? 1 : -1,
        arm,
        fore,
        wrist,
        fingers,
        thumb: [need(`thumba${s}`), need(`thumbb${s}`)],
        grip: need(`hand${s}`),
        pinch: need(`pinch${s}`),
        upper: fore.position.length(),
        lower: wrist.position.length(),
      };
      this.legs[s] = { thigh: need(`leg${s}`), shin: need(`shin${s}`), foot: need(`foot${s}`) };
    }
    for (const s of SIDES) {
      const e = root.getObjectByName(`${P}_eye${s}`);
      if (e) this.face.eyes.push(e);
      const l = root.getObjectByName(`${P}_lid${s}`);
      if (l) this.face.lids.push(l);
      const br = root.getObjectByName(`${P}_brow${s}`);
      if (br) this.face.brows.push(br);
    }
    this.face.mouth = root.getObjectByName(`${P}_mouth`) ?? undefined;
    root.traverse((o) => {
      if (o === root) return;
      this.rest.set(o, { q: o.quaternion.clone(), p: o.position.clone(), s: o.scale.clone() });
    });
    this.handNow = { L: structuredClone(POSES.relaxed), R: structuredClone(POSES.relaxed) };
  }

  /** A joint by its name (without the person's prefix). */
  bone(name: string) {
    return this.root.getObjectByName(`${this.P}_${name}`)!;
  }
  /** A hand's socket (`grip`: a cup in the palm; `pinch`: between thumb and fingers). */
  socket(side: Side, which: 'grip' | 'pinch' = 'grip') {
    return which === 'grip' ? this.arms[side].grip : this.arms[side].pinch;
  }

  /** Walking at `speed` m/s for `dt` s (0 = standing): the legs keep pace with the ground (no sliding feet). */
  walk(speed: number, dt: number) {
    this.walkTarget = speed > 0.02 ? 1 : 0;
    this.phase = advanceGait(this.phase, speed * dt);
  }
  /** A few steps on the spot while turning (`radians` turned this frame). */
  turnSteps(radians: number) {
    if (Math.abs(radians) < 1e-4) return;
    this.walkTarget = Math.max(this.walkTarget, 0.55);
    this.phase = advanceGait(this.phase, Math.abs(radians) * 0.22);
  }
  look(target: THREE.Vector3 | null) {
    this.lookAt = target;
  }

  /** Poses the person for this moment (all layers, in order). */
  update(dt: number) {
    this.time += dt;
    for (const [o, r] of this.rest) {
      o.quaternion.copy(r.q);
      o.position.copy(r.p);
      o.scale.copy(r.s);
    }
    const b = this.b;
    // ---- the walk ----
    this.walkW = approach(this.walkW, this.walkTarget, dt, 0.12);
    if (this.walkTarget === 0 && this.walkW < 0.02) this.walkW = 0;
    this.walkTarget = 0;
    const g = gaitPose(this.phase, this.walkW);
    for (const s of SIDES) {
      const leg = this.legs[s];
      const p = s === 'L' ? g.L : g.R;
      this.turn(leg.thigh, p.thigh, 0, 0);
      this.turn(leg.shin, p.shin, 0, 0);
      this.turn(leg.foot, p.foot, 0, 0);
    }
    b.hips.position.y += g.bob;
    this.turn(b.chest, 0, g.twist, 0);
    // ---- breathing ----
    this.turn(b.chest, Math.sin(this.time * 1.7) * 0.012, 0, 0);
    // ---- bending at the waist, crouching (the hips lower, the knees bend, the feet stay put) ----
    this.leanNow = approach(this.leanNow, this.lean, dt, 0.18);
    this.crouchNow = approach(this.crouchNow, this.crouch, dt, 0.2);
    if (this.crouchNow > 0.001) {
      const k = this.crouchNow;
      const thighLen = this.legs.L.shin.position.length();
      const shinLen = this.legs.L.foot.position.length();
      // knee bend and hip flex that keep the ankle under the hip, the hips lowered by what the legs shortened
      const knee = 0.9 * k;
      const hipFlex = knee / 2;
      for (const s of SIDES) {
        this.turn(this.legs[s].thigh, -hipFlex, 0, 0);
        this.turn(this.legs[s].shin, knee, 0, 0);
        this.turn(this.legs[s].foot, -hipFlex, 0, 0);
      }
      b.hips.position.y -= thighLen + shinLen - (thighLen * Math.cos(hipFlex) + shinLen * Math.cos(knee - hipFlex));
    }
    this.turn(b.torso, this.leanNow * 0.7, 0, 0);
    this.turn(b.chest, this.leanNow * 0.3, 0, 0);
    // the arms swing with the walk (opposite leg), the elbows a little bent
    for (const s of SIDES) {
      const a = this.arms[s];
      this.turn(a.arm, -(s === 'L' ? g.armL : g.armR), 0, 0);
      this.turn(a.fore, -0.15 * this.walkW, 0, 0);
    }
    // ---- looking: the head turns (the neck a little, the head the rest), the eyes the last bit ----
    this.root.updateMatrixWorld(true);
    let yaw = 0,
      pitch = 0;
    if (this.lookAt) {
      b.head.getWorldPosition(this.v1);
      const to = this.v2.copy(this.lookAt).sub(this.v1);
      // in the chest's frame
      b.chest.getWorldQuaternion(this.q1).invert();
      to.applyQuaternion(this.q1);
      yaw = Math.atan2(to.x, to.z);
      pitch = Math.atan2(-to.y, Math.hypot(to.x, to.z));
      if (Math.abs(yaw) > 1.7) yaw = pitch = 0; // behind him: he doesn't turn his head round
    }
    this.lookW = approach(this.lookW, this.lookAt ? 1 : 0, dt, 0.15);
    this.headYaw = approach(this.headYaw, THREE.MathUtils.clamp(yaw, -1.0, 1.0), dt, 0.1);
    this.headPitch = approach(this.headPitch, THREE.MathUtils.clamp(pitch, -0.45, 0.5), dt, 0.1);
    this.turn(b.neck, this.headPitch * 0.4 * this.lookW, this.headYaw * 0.35 * this.lookW, 0);
    this.turn(b.head, this.headPitch * 0.6 * this.lookW, this.headYaw * 0.65 * this.lookW, 0);
    const eyeYaw = THREE.MathUtils.clamp(yaw - this.headYaw, -0.35, 0.35) * this.lookW;
    const eyePitch = THREE.MathUtils.clamp(pitch - this.headPitch, -0.25, 0.25) * this.lookW;
    for (const e of this.face.eyes) this.turn(e, eyePitch, eyeYaw, 0);
    // ---- reaching: each arm's IK, eased in and out ----
    this.root.updateMatrixWorld(true);
    for (const s of SIDES) {
      const r = this.reach[s];
      if (r) this.lastReach[s] = r;
      this.reachW[s] = approach(this.reachW[s], r ? r.weight : 0, dt, 0.09);
      const last = this.lastReach[s];
      if (last && this.reachW[s] > 0.002) this.solveArm(s, last, this.reachW[s]);
    }
    // ---- the fingers ----
    for (const s of SIDES) {
      const a = this.arms[s];
      const want = POSES[this.hand[s]];
      const now = this.handNow[s];
      now.f.forEach((f, i) => {
        f[0] = approach(f[0], want.f[i]![0], dt, 0.06);
        f[1] = approach(f[1], want.f[i]![1], dt, 0.06);
        // toward the palm (the palm faces the body: −x for the left hand, +x for the right)
        this.turn(a.fingers[i]![0], 0, 0, -a.sx * f[0]);
        this.turn(a.fingers[i]![1], 0, 0, -a.sx * f[1]);
      });
      now.t[0] = approach(now.t[0], want.t[0], dt, 0.06);
      now.t[1] = approach(now.t[1], want.t[1], dt, 0.06);
      this.turn(a.thumb[0], 0, 0, -a.sx * now.t[0]);
      this.turn(a.thumb[1], -now.t[1] * 0.4, 0, -a.sx * now.t[1]);
    }
    // ---- the face: blinking now and then (both eyes), the smile and the brows ----
    if (this.blinkT < 0 && this.time > this.nextBlink) this.blinkT = 0;
    let shut = 0;
    if (this.blinkT >= 0) {
      this.blinkT += dt;
      // closing fast, opening a little slower (about a sixth of a second)
      shut = this.blinkT < 0.06 ? this.blinkT / 0.06 : Math.max(0, 1 - (this.blinkT - 0.06) / 0.1);
      if (this.blinkT > 0.16) {
        this.blinkT = -1;
        this.nextBlink = this.time + 2.2 + Math.random() * 3.5;
      }
    }
    for (const l of this.face.lids) this.turn(l, shut * 0.95 + this.headPitch * 0.15, 0, 0);
    this.smileNow = approach(this.smileNow, this.smile, dt, 0.25);
    this.browsNow = approach(this.browsNow, this.brows, dt, 0.15);
    if (this.face.mouth) this.face.mouth.scale.multiply(this.v1.set(1 + 0.12 * this.smileNow, 1 + 0.35 * (this.smileNow - 0.4), 1));
    for (const br of this.face.brows) br.position.y += 0.004 * this.browsNow;
    this.root.updateMatrixWorld(true);
  }

  /** Turns a bone by (x, y, z) radians from where it is (in its own axes). */
  private turn(o: THREE.Object3D, x: number, y: number, z: number) {
    if (!x && !y && !z) return;
    o.quaternion.multiply(this.q2.setFromEuler(this.e1.set(x, y, z)));
  }

  /**
   * Places the hand's socket at the reach's point (two-bone IK: the elbow bending down and out, behind), the hand turned
   * as asked, blended with the arm's own pose by `w`.
   */
  private solveArm(s: Side, r: Reach, w: number) {
    const a = this.arms[s];
    const sock = r.socket === 'pinch' ? a.pinch : a.grip;
    // where the wrist must be for the socket to be at the point: the socket's offset, turned as the hand will be
    const handQ = r.quat ?? a.wrist.getWorldQuaternion(new THREE.Quaternion());
    const wristTarget = this.v2.copy(sock.position).applyQuaternion(handQ).negate().add(r.at);
    const S = a.arm.getWorldPosition(new THREE.Vector3());
    // the elbow points down, out and back (as people's do)
    const rootQ = this.root.getWorldQuaternion(this.q1);
    const pole = new THREE.Vector3(a.sx * 0.55, -1, -0.45).applyQuaternion(rootQ).normalize();
    const { elbow, wrist } = elbowFor(S, wristTarget, a.upper, a.lower, pole);
    // the upper arm: its bone's −Y toward the elbow
    const parentQ = a.arm.parent!.getWorldQuaternion(new THREE.Quaternion());
    const dirUp = elbow.clone().sub(S).normalize().applyQuaternion(parentQ.clone().invert());
    const qUp = new THREE.Quaternion().setFromUnitVectors(DOWN, dirUp);
    a.arm.quaternion.slerp(qUp, w);
    a.arm.updateMatrixWorld(true);
    // the forearm: toward the wrist, from where the elbow now is
    const E = a.fore.getWorldPosition(new THREE.Vector3());
    const armQ = a.arm.getWorldQuaternion(new THREE.Quaternion());
    const dirLo = wrist.clone().sub(E).normalize().applyQuaternion(armQ.clone().invert());
    const qLo = new THREE.Quaternion().setFromUnitVectors(DOWN, dirLo);
    a.fore.quaternion.slerp(qLo, w);
    a.fore.updateMatrixWorld(true);
    // the hand, turned as asked
    if (r.quat) {
      const foreQ = a.fore.getWorldQuaternion(new THREE.Quaternion());
      const qHand = foreQ.invert().multiply(r.quat);
      a.wrist.quaternion.slerp(qHand, w);
    }
    a.wrist.updateMatrixWorld(true);
  }

  /** How a hand is turned to hold something in front of him (see `holdingQuat`), for the way he faces (`yaw`). */
  handFacing(s: Side, kind: 'cup' | 'cookie', yaw = this.yaw()) {
    return new THREE.Quaternion().setFromAxisAngle(UP, yaw).multiply(holdingQuat(s === 'L' ? 1 : -1, kind));
  }

  /** The way he faces (radians round the vertical, +Z = 0). */
  yaw() {
    const f = new THREE.Vector3(0, 0, 1).transformDirection(this.root.matrixWorld);
    return Math.atan2(f.x, f.z);
  }

  /** A shoulder's joint (world): where a reach is measured from. */
  shoulder(side: Side) {
    return this.arms[side].arm.getWorldPosition(new THREE.Vector3());
  }

  /** For the debug view: each hand's socket and where it reaches (world). */
  debugPoints() {
    const out: { socket: THREE.Vector3; target: THREE.Vector3 | null }[] = [];
    for (const s of SIDES) {
      const r = this.reach[s];
      out.push({ socket: this.socket(s, r?.socket ?? 'grip').getWorldPosition(new THREE.Vector3()), target: r ? r.at.clone() : null });
    }
    return out;
  }

  /** Whether a hand's socket is at a point (within `tolerance` metres): the moment of contact. */
  touches(s: Side, at: THREE.Vector3, tolerance = 0.03, which: 'grip' | 'pinch' = 'grip') {
    return this.socket(s, which).getWorldPosition(this.v1).distanceTo(at) <= tolerance;
  }
}

/**
 * How a hand is turned to hold a cup (upright, as one holds a glass in front of the chest) or a cookie (by its edge),
 * in the body's own frame (+Z ahead, +Y up): the fingers across the front of the body, a little ahead, the thumb up,
 * the palm toward what it holds. `sx`: +1 the left hand, −1 the right. (The hand's axes: −Y the fingers, +Z the
 * thumb side, the palm's face toward −sx·X.)
 */
export function holdingQuat(sx: number, kind: 'cup' | 'cookie') {
  const fingers = new THREE.Vector3(-sx, kind === 'cookie' ? 0.25 : 0, 0.35).normalize();
  const yAxis = fingers.clone().negate();
  const zAxis = UP.clone().addScaledVector(yAxis, -UP.dot(yAxis)).normalize();
  const xAxis = new THREE.Vector3().crossVectors(yAxis, zAxis);
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis));
}

/** The fingers' bends (radians) of each hand pose, for the tours' people and the visitor's own hands alike. */
export const HAND_POSES = POSES;
