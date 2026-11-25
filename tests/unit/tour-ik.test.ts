import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import { STRIDE, GAIT, advanceGait, approach, elbowFor, gaitPose } from '@/components/tour/ik';
import { holdingQuat } from '@/components/tour/character';

/** The tours' people (owner, 2026-11-24): the arm's reach and the walk, checked by their arithmetic. */
describe('two-bone reach', () => {
  const a = 0.28,
    b = 0.245;
  const S = new THREE.Vector3(0.16, 1.41, 0);
  const pole = new THREE.Vector3(0.5, -1, -0.4).normalize();

  it('puts the wrist on a reachable target, with both bones at their lengths', () => {
    const T = new THREE.Vector3(0.1, 1.2, 0.35);
    const { elbow, wrist, reached } = elbowFor(S, T, a, b, pole);
    expect(reached).toBe(true);
    expect(wrist.distanceTo(T)).toBeLessThan(1e-6);
    expect(elbow.distanceTo(S)).toBeCloseTo(a, 6);
    expect(elbow.distanceTo(wrist)).toBeCloseTo(b, 6);
  });

  it('bends the elbow toward the pole (down and out, never up)', () => {
    const T = new THREE.Vector3(0.1, 1.3, 0.35);
    const { elbow } = elbowFor(S, T, a, b, pole);
    const mid = S.clone().lerp(T, 0.5);
    expect(elbow.clone().sub(mid).dot(pole)).toBeGreaterThan(0);
    expect(elbow.y).toBeLessThan(mid.y);
  });

  it('reaches as far as it can toward a target out of reach (never stretching the arm)', () => {
    const T = new THREE.Vector3(0.16, 1.41, 1.5);
    const { elbow, wrist, reached } = elbowFor(S, T, a, b, pole);
    expect(reached).toBe(false);
    expect(wrist.distanceTo(S)).toBeLessThanOrEqual(a + b);
    expect(elbow.distanceTo(S)).toBeCloseTo(a, 6);
    expect(elbow.distanceTo(wrist)).toBeCloseTo(b, 5);
  });
});

describe('the walk', () => {
  it('keeps pace with the ground: one whole cycle every stride walked', () => {
    let phase = 0;
    for (let i = 0; i < 100; i++) phase = advanceGait(phase, STRIDE / 100);
    expect(Math.abs(Math.sin(phase))).toBeLessThan(1e-6);
    expect(STRIDE).toBeCloseTo(4 * GAIT.leg * Math.sin(GAIT.hip), 9);
  });

  it('swings the legs in opposition, bends the swinging knee, keeps the stance knee nearly straight', () => {
    // the left leg mid-swing (moving forward) at phase 0
    const p = gaitPose(0, 1);
    expect(p.L.shin).toBeGreaterThan(0.8);
    expect(p.R.shin).toBeLessThan(0.25);
    // half a cycle on, the legs have changed places
    const q = gaitPose(Math.PI / 2, 1);
    expect(q.L.thigh).toBeCloseTo(-q.R.thigh, 6);
    // each arm swings with the other leg
    expect(Math.sign(q.armL)).toBe(Math.sign(q.R.fwd));
  });

  it('stands still at weight 0', () => {
    const p = gaitPose(1.3, 0);
    for (const v of [p.L.thigh, p.L.shin, p.L.foot, p.R.thigh, p.bob, p.armL]) expect(Math.abs(v)).toBe(0);
  });

  it('eases the same whatever the frame rate', () => {
    let fast = 0,
      slow = 0;
    for (let i = 0; i < 60; i++) fast = approach(fast, 1, 1 / 60);
    for (let i = 0; i < 20; i++) slow = approach(slow, 1, 1 / 20);
    expect(fast).toBeCloseTo(slow, 9);
  });
});

describe('holding', () => {
  it("turns a hand with its thumb up and its palm's face toward what it holds", () => {
    for (const sx of [1, -1]) {
      const q = holdingQuat(sx, 'cup');
      const thumb = new THREE.Vector3(0, 0, 1).applyQuaternion(q);
      const palm = new THREE.Vector3(-sx, 0, 0).applyQuaternion(q);
      expect(thumb.y).toBeGreaterThan(0.95);
      // the socket (in front of the palm) is where the cup is: the palm's face points at it
      const socket = new THREE.Vector3(-sx * 0.058, -0.062, 0).applyQuaternion(q);
      expect(socket.clone().normalize().dot(palm)).toBeGreaterThan(0.6);
    }
  });
});
