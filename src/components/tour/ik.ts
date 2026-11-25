/**
 * The arithmetic of the tours' people (owner, 2026-11-24, the character and NPC interaction skills), kept apart from
 * the scene so it can be tested: the arm's two-bone reach (shoulder → elbow → wrist, the elbow bending toward a pole)
 * and the walk (a gait driven by the distance walked, so the feet never slide).
 */
import * as THREE from 'three';

/**
 * Where the elbow goes for the wrist to reach `target` from the shoulder `s`, with an upper arm `a` and forearm `b`
 * long, the elbow bending toward `pole` (a direction). A target out of reach is brought within it (along the same
 * line), and one too close pushed out; `reached` says whether the target itself was reachable.
 */
export function elbowFor(s: THREE.Vector3, target: THREE.Vector3, a: number, b: number, pole: THREE.Vector3) {
  const toT = target.clone().sub(s);
  let d = toT.length();
  const max = a + b - 1e-4;
  const min = Math.abs(a - b) + 1e-4;
  const reached = d <= max && d >= min;
  d = THREE.MathUtils.clamp(d, min, max);
  const u = d > 1e-9 ? toT.normalize() : new THREE.Vector3(0, -1, 0);
  const wrist = s.clone().addScaledVector(u, d);
  // the elbow: along the shoulder–wrist line by x, then out toward the pole by h
  const x = (a * a - b * b + d * d) / (2 * d);
  const h = Math.sqrt(Math.max(0, a * a - x * x));
  const v = pole.clone().addScaledVector(u, -pole.dot(u));
  if (v.lengthSq() < 1e-9) v.set(0, 0, 1).addScaledVector(u, -u.z);
  v.normalize();
  const elbow = s.clone().addScaledVector(u, x).addScaledVector(v, h);
  return { elbow, wrist, reached };
}

/** The walk's shape: hip swing (radians, each way), knee lift in the swing, and the step it makes. */
export const GAIT = { hip: 0.36, knee: 0.95, leg: 0.85 };
/** Metres walked in one whole cycle (two steps): each step about 2·leg·sin(hip). */
export const STRIDE = 2 * 2 * GAIT.leg * Math.sin(GAIT.hip);
/** The cycle's length when the legs swing `amp` times as far (longer steps walking faster). */
export function strideFor(amp: number) {
  return 2 * 2 * GAIT.leg * Math.sin(GAIT.hip * amp);
}
/**
 * How far the legs swing at a walking speed (m/s), relative to `GAIT.hip`: people walk faster with longer steps and
 * quicker ones (about 76 steps a minute at 0.5 m/s, 100 at 1 m/s, 110 at 1.3 m/s).
 */
export function ampFor(speed: number) {
  return Math.min(1.25, Math.max(0.6, 0.3 + 0.7 * speed));
}

/** How far through the walk (radians) after walking `metres` more: the legs keep pace with the ground. */
export function advanceGait(phase: number, metres: number, amp = 1) {
  return (phase + (metres / strideFor(amp)) * Math.PI * 2) % (Math.PI * 2);
}

/**
 * The legs, arms and pelvis at a point of the walk, `w` (0…1) of the way from standing. Leg angles are the bones'
 * own turns about X (a bone hangs down its −Y; a negative turn swings it forward): `thigh` at the hip, `shin` at the
 * knee (positive = bent), `foot` at the ankle (kept about level; toes up as the heel strikes, pushing off behind). The
 * left leg is forward at phase π/2; the right is half a cycle behind; each arm swings with the opposite leg (`armL`,
 * `armR`: forward swing, radians). The pelvis bobs (`bob`, metres), lowest as the feet pass.
 */
export function gaitPose(phase: number, w: number, amp = 1) {
  const leg = (p: number) => {
    const fwd = GAIT.hip * amp * Math.sin(p); // the thigh's swing forward
    // the knee lifts the foot through the swing (the thigh moving forward), nearly straight in the stance
    const swing = Math.max(0, Math.cos(p));
    const knee = 0.08 + GAIT.knee * (0.75 + 0.25 * amp) * swing ** 1.6 + 0.12 * Math.max(0, Math.sin(p)) ** 2;
    const thigh = -fwd;
    const shin = knee;
    // level: the foot turns back what the thigh and shin turned; then the heel strike and the push-off
    const foot = -(thigh + shin) * 0.85 - 0.12 * Math.max(0, Math.sin(p)) ** 3 + 0.18 * Math.max(0, -Math.sin(p)) ** 3;
    return { thigh: thigh * w, shin: shin * w, foot: foot * w, fwd: fwd * w };
  };
  const L = leg(phase);
  const R = leg(phase + Math.PI);
  return {
    L,
    R,
    bob: -0.014 * w * (0.5 + 0.5 * Math.cos(2 * phase)),
    twist: 0.06 * w * Math.sin(phase),
    armL: 0.55 * R.fwd,
    armR: 0.55 * L.fwd,
  };
}

/** Eases a value toward a target, the same whatever the frame rate (half way in `half` seconds). */
export function approach(value: number, target: number, dt: number, half = 0.12) {
  return target + (value - target) * Math.pow(0.5, dt / half);
}
