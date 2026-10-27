import * as THREE from 'three';
import type { ExhaustBank, ExhaustRoute } from './valvetronic-exhaust-routing';
import { EXHAUST_ROUTE_COLORS } from './valvetronic-exhaust-palette';

export type OuterTubeId = '01' | '02A' | '02B' | '02C' | '02D' | '03';
export type OuterTubeValues = { length: number; bend: number; rotation: number };
export type OuterTubeEdits = Partial<Record<OuterTubeId, OuterTubeValues>>;
export type OuterTubeSection = { id: OuterTubeId; label: string; color: string; baseLength: number; baseBend: number; minLength: number };
export type OuterMount = { position: THREE.Vector3; rotation: THREE.Quaternion };
const samples = 64;
const clamp = THREE.MathUtils.clamp;

export class ReverseCurve extends THREE.Curve<THREE.Vector3> {
  constructor(readonly source: THREE.Curve<THREE.Vector3>) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) { return this.source.getPointAt(1 - t, target); }
  getPointAt(t: number, target = new THREE.Vector3()) { return this.getPoint(t, target); }
  getTangent(t: number, target = new THREE.Vector3()) { return this.source.getTangentAt(1 - t, target).negate(); }
  getTangentAt(t: number, target = new THREE.Vector3()) { return this.getTangent(t, target); }
  getLength() { return this.source.getLength(); }
}
export class PlacedCurve extends THREE.Curve<THREE.Vector3> {
  constructor(readonly source: THREE.Curve<THREE.Vector3>, readonly origin: THREE.Vector3, readonly position: THREE.Vector3, readonly rotation: THREE.Quaternion, readonly scale: number) { super(); }
  getPoint(t: number, target = new THREE.Vector3()) { return this.source.getPointAt(t, target).sub(this.origin).multiplyScalar(this.scale).applyQuaternion(this.rotation).add(this.position); }
  getPointAt(t: number, target = new THREE.Vector3()) { return this.getPoint(t, target); }
  getTangent(t: number, target = new THREE.Vector3()) { return this.source.getTangentAt(t, target).applyQuaternion(this.rotation).normalize(); }
  getTangentAt(t: number, target = new THREE.Vector3()) { return this.getTangent(t, target); }
  getLength() { return this.source.getLength() * this.scale; }
}
/** Arclength-sampled Hermite spans preserve exact endpoint tangents. */
export class BentCurve extends THREE.Curve<THREE.Vector3> {
  constructor(readonly points: THREE.Vector3[], readonly tangents: THREE.Vector3[], readonly length: number) { super(); }
  private span(t: number) { const x = clamp(t, 0, 1) * samples, i = Math.min(samples - 1, Math.floor(x)); return { i, u: x - i }; }
  getPoint(t: number, target = new THREE.Vector3()) {
    const { i, u } = this.span(t), u2 = u * u, u3 = u2 * u, ds = this.length / samples;
    return target.copy(this.points[i]).multiplyScalar(2 * u3 - 3 * u2 + 1)
      .addScaledVector(this.tangents[i], (u3 - 2 * u2 + u) * ds)
      .addScaledVector(this.points[i + 1], -2 * u3 + 3 * u2)
      .addScaledVector(this.tangents[i + 1], (u3 - u2) * ds);
  }
  getPointAt(t: number, target = new THREE.Vector3()) { return this.getPoint(t, target); }
  getTangent(t: number, target = new THREE.Vector3()) {
    const { i, u } = this.span(t), ds = this.length / samples;
    return target.copy(this.points[i]).multiplyScalar(6 * u * u - 6 * u)
      .addScaledVector(this.tangents[i], (3 * u * u - 4 * u + 1) * ds)
      .addScaledVector(this.points[i + 1], -6 * u * u + 6 * u)
      .addScaledVector(this.tangents[i + 1], (3 * u * u - 2 * u) * ds).normalize();
  }
  getTangentAt(t: number, target = new THREE.Vector3()) { return this.getTangent(t, target); }
  getLength() { return this.length; }
}
export class DistancePath extends THREE.CurvePath<THREE.Vector3> {
  getPointAt(t: number, target = new THREE.Vector3()) { return target.copy(this.getPoint(clamp(t, 0, 1))); }
  getTangentAt(t: number, target = new THREE.Vector3()) {
    const distance = clamp(t, 0, 1) * this.getLength(), lengths = this.getCurveLengths();
    let i = lengths.findIndex(value => value >= distance); if (i < 0) i = lengths.length - 1;
    const start = i ? lengths[i - 1] : 0, length = this.curves[i].getLength();
    return this.curves[i].getTangentAt(length ? clamp((distance - start) / length, 0, 1) : 0, target);
  }
}
type Template = { source: THREE.Curve<THREE.Vector3>; start: THREE.Vector3; tangent: THREE.Vector3; axis: THREE.Vector3; angles: number[]; angle: number; section: OuterTubeSection };
const templates = new WeakMap<ExhaustBank, Template[]>();
function getTemplates(bank: ExhaustBank) {
  const cached = templates.get(bank); if (cached) return cached;
  const result = bank.main.curve.curves.slice(0, 6).map((original, i): Template => {
    const source = new ReverseCurve(original), tangent = source.getTangentAt(0), last = source.getTangentAt(1);
    let axis = tangent.clone().cross(last);
    if (axis.lengthSq() < 1e-8) {
      for (let j = 1; j <= samples && axis.lengthSq() < 1e-8; j++) axis = tangent.clone().cross(source.getTangentAt(j / samples));
    }
    if (axis.lengthSq() < 1e-8) {
      const guide = Math.abs(tangent.y) < .95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1);
      axis = tangent.clone().cross(guide);
    }
    axis.normalize();
    const angles: number[] = []; let previous = 0;
    for (let j = 0; j <= samples; j++) {
      const current = source.getTangentAt(j / samples);
      let angle = Math.atan2(axis.dot(tangent.clone().cross(current)), clamp(tangent.dot(current), -1, 1));
      while (angle - previous > Math.PI) angle -= Math.PI * 2;
      while (angle - previous < -Math.PI) angle += Math.PI * 2;
      angles.push(angle); previous = angle;
    }
    if (angles[samples] < 0) { axis.negate(); angles.forEach((v, j) => { angles[j] = -v; }); }
    const angle = Math.abs(angles[samples]), item = EXHAUST_ROUTE_COLORS[i];
    const maximumCurvature = Math.max(...angles.slice(1).map((v, j) => Math.abs(v - angles[j]) / (source.getLength() / samples)));
    const minLength = Math.min(100, Math.max(50, Math.ceil(100 * .20 * maximumCurvature)));
    return { source, start: source.getPointAt(0), tangent, axis, angles, angle, section: { id: item.number as OuterTubeId, label: item.label, color: item.color, baseLength: source.getLength(), minLength, baseBend: Math.round(THREE.MathUtils.radToDeg(angle) * 10) / 10 } };
  });
  templates.set(bank, result); return result;
}
export function outerTubeSections(bank: ExhaustBank) { return getTemplates(bank).map(item => item.section); }
export function maximumTubeBend(section: OuterTubeSection, lengthPercent: number) { return Math.min(180, Math.floor(THREE.MathUtils.radToDeg(section.baseLength * lengthPercent / 100 / .20))); }
export function normalizeOuterEdits(bank: ExhaustBank, input: OuterTubeEdits): OuterTubeEdits {
  const result: OuterTubeEdits = {};
  for (const { section } of getTemplates(bank)) {
    const raw = input[section.id]; if (!raw) continue;
    const keepOriginalBend = !Number.isFinite(raw.bend) || Math.abs(raw.bend - section.baseBend) < .05;
    const length = clamp(Number.isFinite(raw.length) ? raw.length : 100, keepOriginalBend ? section.minLength : 50, 200);
    const bend = clamp(Number.isFinite(raw.bend) ? raw.bend : section.baseBend, 0, maximumTubeBend(section, length));
    const rotation = clamp(Number.isFinite(raw.rotation) ? raw.rotation : 0, -180, 180);
    if (Math.abs(length - 100) > 1e-8 || Math.abs(bend - section.baseBend) > .05 || Math.abs(rotation) > 1e-8) result[section.id] = { length, bend, rotation };
  }
  return result;
}
export function editOuterBank(base: ExhaustBank, input: OuterTubeEdits, handedness: number): { bank: ExhaustBank; mountAt(u: number): OuterMount } {
  const parts = getTemplates(base), settings = normalizeOuterEdits(base, input);
  if (!Object.keys(settings).length) return { bank: base, mountAt: u => ({ position: base.main.curve.curves[5].getPointAt(u), rotation: new THREE.Quaternion() }) };
  const curves: THREE.Curve<THREE.Vector3>[] = [];
  let anchor = parts[5].start.clone(), pose = new THREE.Quaternion();
  let mountAt: (u: number) => OuterMount = u => ({ position: base.main.curve.curves[5].getPointAt(u), rotation: new THREE.Quaternion() });
  for (let i = 5; i >= 0; i--) {
    const part = parts[i], edit = settings[part.section.id];
    const scale = (edit?.length ?? 100) / 100;
    const targetAngle = edit && Math.abs(edit.bend - part.section.baseBend) > .05 ? THREE.MathUtils.degToRad(edit.bend) : part.angle;
    const roll = new THREE.Quaternion().setFromAxisAngle(part.tangent, THREE.MathUtils.degToRad((edit?.rotation ?? 0) * handedness));
    const placement = pose.clone().multiply(roll), start = anchor.clone(), length = part.source.getLength() * scale;
    const angleChanged = Math.abs(targetAngle - part.angle) > 1e-8;
    const angleAt = (u: number) => {
      if (angleChanged) return targetAngle * u;
      const x = clamp(u, 0, 1) * samples, n = Math.min(samples - 1, Math.floor(x));
      return THREE.MathUtils.lerp(part.angles[n], part.angles[n + 1], x - n);
    };
    let output: THREE.Curve<THREE.Vector3>;
    if (Math.abs(targetAngle - part.angle) < 1e-8) output = new PlacedCurve(part.source, part.start, start, placement, scale);
    else {
      const points = [start.clone()], tangents: THREE.Vector3[] = [];
      for (let j = 0; j <= samples; j++) {
        tangents.push(part.tangent.clone().applyAxisAngle(part.axis, angleAt(j / samples)).applyQuaternion(placement));
        if (j) {
          const midAngle = angleAt((j - .5) / samples);
          const direction = part.tangent.clone().applyAxisAngle(part.axis, midAngle).applyQuaternion(placement);
          points.push(points[j - 1].clone().addScaledVector(direction, length / samples));
        }
      }
      output = new BentCurve(points, tangents, length);
    }
    curves[i] = new ReverseCurve(output);
    if (i === 5) {
      const placed = placement.clone();
      mountAt = u => {
        const t = 1 - clamp(u, 0, 1), x = t * samples, n = Math.min(samples - 1, Math.floor(x));
        const oldAngle = THREE.MathUtils.lerp(part.angles[n], part.angles[n + 1], x - n);
        return { position: output.getPointAt(t), rotation: placed.clone().multiply(new THREE.Quaternion().setFromAxisAngle(part.axis, angleAt(t) - oldAngle)) };
      };
    }
    anchor = output.getPointAt(1);
    pose = placement.multiply(new THREE.Quaternion().setFromAxisAngle(part.axis, targetAngle - part.angle));
  }
  const path = new DistancePath(); [...curves, ...base.main.curve.curves.slice(6)].forEach(curve => path.add(curve));
  const oldOuterLength = base.main.curve.curves.slice(0, 6).reduce((sum, curve) => sum + curve.getLength(), 0);
  const newOuterLength = curves.reduce((sum, curve) => sum + curve.getLength(), 0), delta = newOuterLength - oldOuterLength, length = path.getLength();
  const lengths = path.getCurveLengths(), weldDistances: number[] = [];
  for (let i = 0; i < 6; i++) {
    const bend = settings[parts[i].section.id]?.bend ?? parts[i].section.baseBend;
    if (bend < .05) continue;
    const start = i ? lengths[i - 1] : 0, count = Math.max(2, Math.ceil(curves[i].getLength() / .15));
    for (let j = 0; j <= count; j++) weldDistances.push(start + curves[i].getLength() * j / count);
  }
  base.main.welds.forEach(t => { const d = t * base.main.length; if (d > oldOuterLength + .00001) weldDistances.push(d + delta); });
  weldDistances.sort((a, b) => a - b);
  const main: ExhaustRoute = { curve: path, length, welds: weldDistances.filter((d, i, all) => !i || d - all[i - 1] > .04).map(d => d / length) };
  const shiftStation = <T extends { t: number }>(station: T): T => ({ ...station, t: (station.t * base.main.length + delta) / length });
  return { bank: { ...base, main,
    colorStops: base.colorStops.map((t, i) => i < 6 ? lengths[i] / length : (t * base.main.length + delta) / length),
    merges: base.merges.map(shiftStation),
    branchJoins: base.branchJoins.map(join => ({ ...join, main: shiftStation(join.main) })),
    radiusAt(t) { return base.radiusAt(clamp((t * length - delta) / base.main.length, 0, 1)); },
  }, mountAt };
}
