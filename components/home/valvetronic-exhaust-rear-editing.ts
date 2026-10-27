import * as THREE from 'three';
import type { ExhaustBank, ExhaustRoute } from './valvetronic-exhaust-routing';
import { BentCurve, DistancePath, PlacedCurve, ReverseCurve } from './valvetronic-exhaust-editing';
import { EXHAUST_ROUTE_COLORS } from './valvetronic-exhaust-palette';

export const REAR_TUBE_IDS = ['09-10', '11', '12', '13', '14', '15A', '15B', '16'] as const;
export type RearTubeId = typeof REAR_TUBE_IDS[number];
export type RearTubeValues = { length: number; bend: number; rotation: number };
export type RearTubeEdits = Partial<Record<RearTubeId, RearTubeValues>>;
export type RearTubeSection = { id: RearTubeId; number: string; label: string; color: string; baseLength: number; baseBend: number; minLength: number; minRadius: number };
const steps = 64, clamp = THREE.MathUtils.clamp;
type Curve = THREE.Curve<THREE.Vector3>;
type Part = { source: Curve; start: THREE.Vector3; tangent: THREE.Vector3; endTangent: THREE.Vector3; axis: THREE.Vector3; angle: number; section: RearTubeSection };
const cache = new WeakMap<ExhaustBank, { main: Part[]; returning: Part[]; reverse: Part[] }>();
function joined(curves: Curve[]) { const path = new DistancePath(); curves.forEach(c => path.add(c)); return path; }
function template(source: Curve, section: RearTubeSection): Part {
  const tangent = source.getTangentAt(0), endTangent = source.getTangentAt(1);
  let axis = tangent.clone().cross(endTangent);
  if (axis.lengthSq() < 1e-8) axis = tangent.clone().cross(Math.abs(tangent.y) < .95 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1));
  return { source, start: source.getPointAt(0), tangent, endTangent, axis: axis.normalize(), angle: tangent.angleTo(endTangent), section };
}
function parts(bank: ExhaustBank) {
  const existing = cache.get(bank); if (existing) return existing;
  const main = bank.main.curve.curves;
  const sources = [joined(main.slice(15, 17)), main[17], joined(main.slice(18, 20)), main[20], ...bank.returning.curve.curves];
  const definitions = sources.map((source, i) => {
    const palette = EXHAUST_ROUTE_COLORS[13 + i], length = source.getLength();
    let previous = source.getTangentAt(0), curvature = 0;
    for (let n = 1; n <= steps; n++) { const current = source.getTangentAt(n / steps); curvature = Math.max(curvature, previous.angleTo(current) / (length / steps)); previous = current; }
    return { id: REAR_TUBE_IDS[i], number: palette.number, label: palette.label, color: palette.color, baseLength: length,
      baseBend: Math.round(THREE.MathUtils.radToDeg(source.getTangentAt(0).angleTo(source.getTangentAt(1))) * 10) / 10,
      minLength: Math.min(100, Math.max(50, Math.ceil(100 * .25 * curvature))), minRadius: .25 };
  });
  const all = sources.map((source, i) => template(source, definitions[i]));
  const value = { main: all.slice(0, 4), returning: all.slice(4), reverse: all.slice(4).reverse().map(p => template(new ReverseCurve(p.source), p.section)) };
  cache.set(bank, value); return value;
}
export function rearTubeSections(bank: ExhaustBank) { const p = parts(bank); return [...p.main, ...p.returning].map(item => item.section); }
export function normalizeRearEdits(bank: ExhaustBank, input: RearTubeEdits): RearTubeEdits {
  const result: RearTubeEdits = {};
  for (const section of rearTubeSections(bank)) {
    const raw = input[section.id]; if (!raw || typeof raw !== 'object') continue;
    const keepBend = !Number.isFinite(raw.bend) || Math.abs(raw.bend - section.baseBend) < .05;
    const length = clamp(Number.isFinite(raw.length) ? raw.length : 100, keepBend ? section.minLength : 50, 200);
    const maxBend = Math.min(180, Math.floor(THREE.MathUtils.radToDeg(section.baseLength * length / 100 / section.minRadius)));
    const bend = clamp(Number.isFinite(raw.bend) ? raw.bend : section.baseBend, 0, maxBend);
    const rotation = clamp(Number.isFinite(raw.rotation) ? raw.rotation : 0, -180, 180);
    if (Math.abs(length - 100) > 1e-8 || Math.abs(bend - section.baseBend) > .05 || Math.abs(rotation) > 1e-8) result[section.id] = { length, bend, rotation };
  }
  return result;
}
function chain(templates: Part[], settings: RearTubeEdits, position: THREE.Vector3, initialPose: THREE.Quaternion, hand: number) {
  let anchor = position.clone(), pose = initialPose.clone();
  const curves: Curve[] = [], poses: THREE.Quaternion[] = [];
  for (const part of templates) {
    const edit = settings[part.section.id], scale = (edit?.length ?? 100) / 100, length = part.source.getLength() * scale;
    const angle = edit && Math.abs(edit.bend - part.section.baseBend) > .05 ? THREE.MathUtils.degToRad(edit.bend) : part.angle;
    const placement = pose.clone().multiply(new THREE.Quaternion().setFromAxisAngle(part.tangent, THREE.MathUtils.degToRad((edit?.rotation ?? 0) * hand)));
    const changed = Math.abs(angle - part.angle) > 1e-8;
    const directionAt = (u: number) => {
      if (part.angle < 1e-6) return part.tangent.clone().applyAxisAngle(part.axis, angle * u);
      const original = part.source.getTangentAt(u), axis = part.tangent.clone().cross(original), a = part.tangent.angleTo(original);
      return axis.lengthSq() < 1e-12 ? original : part.tangent.clone().applyAxisAngle(axis.normalize(), a * angle / part.angle);
    };
    let curve: Curve;
    if (!changed) curve = new PlacedCurve(part.source, part.start, anchor.clone(), placement.clone(), scale);
    else {
      const points = [anchor.clone()], tangents: THREE.Vector3[] = [];
      for (let j = 0; j <= steps; j++) {
        tangents.push(directionAt(j / steps).applyQuaternion(placement));
        if (j) points.push(points[j - 1].clone().addScaledVector(directionAt((j - .5) / steps).applyQuaternion(placement), length / steps));
      }
      curve = new BentCurve(points, tangents, length);
    }
    curves.push(curve); anchor = curve.getPointAt(1);
    pose = placement.multiply(changed ? new THREE.Quaternion().setFromUnitVectors(part.endTangent, directionAt(1)) : new THREE.Quaternion());
    poses.push(pose.clone());
  }
  return { curves, poses };
}
/** A joining bend adapts to the opposite port without moving either join. */
class JoiningCurve extends THREE.Curve<THREE.Vector3> {
  readonly delta: THREE.Vector3;
  readonly derivative: THREE.Vector3;
  constructor(readonly source: Curve, end: THREE.Vector3, tangent: THREE.Vector3) {
    super(); this.arcLengthDivisions = 400;
    this.delta = end.clone().sub(source.getPointAt(1));
    this.derivative = tangent.clone().sub(source.getTangentAt(1)).multiplyScalar(source.getLength());
  }
  getPoint(t: number, target = new THREE.Vector3()) {
    const u = clamp(t, 0, 1), u2 = u * u, u3 = u2 * u;
    return this.source.getPointAt(u, target).addScaledVector(this.delta, u3 * (10 + u * (-15 + 6 * u))).addScaledVector(this.derivative, u3 * (u - 1));
  }
  getTangent(t: number, target = new THREE.Vector3()) {
    const u = clamp(t, 0, 1);
    this.source.getTangentAt(u, target).multiplyScalar(this.source.getLength()).addScaledVector(this.delta, 30 * u * u * (1 - u) * (1 - u)).addScaledVector(this.derivative, u * u * (4 * u - 3));
    if (target.lengthSq() < 1e-12) this.source.getTangentAt(u, target);
    return target.normalize();
  }
}
function close(curve: Curve, end: THREE.Vector3, tangent: THREE.Vector3) {
  return curve.getPointAt(1).distanceTo(end) < 1e-7 && curve.getTangentAt(1).angleTo(tangent) < 1e-6 ? curve : new JoiningCurve(curve, end, tangent);
}
class CurveSlice extends THREE.Curve<THREE.Vector3> {
  constructor(readonly source: Curve, readonly from: number, readonly to: number) { super(); this.arcLengthDivisions = 200; }
  getPoint(t: number, target = new THREE.Vector3()) { return this.source.getPoint(THREE.MathUtils.lerp(this.from, this.to, t), target); }
  getTangent(t: number, target = new THREE.Vector3()) { return this.source.getTangent(THREE.MathUtils.lerp(this.from, this.to, t), target); }
}
function closeParts(curves: Curve[], end: THREE.Vector3, tangent: THREE.Vector3): Curve[] {
  const path = joined(curves), closed = close(path, end, tangent);
  if (closed === path) return curves;
  const length = path.getLength(); let offset = 0;
  return curves.map(c => { const from = offset / length; offset += c.getLength(); return new CurveSlice(closed, from, offset / length); });
}
export function editRearBank(base: ExhaustBank, input: RearTubeEdits, hand: number, driver: RearTubeId = '09-10'): ExhaustBank {
  const settings = normalizeRearEdits(base, input); if (!Object.keys(settings).length) return base;
  const p = parts(base), prefix = base.main.curve.curves.slice(0, 15), prefixLength = prefix.reduce((sum, c) => sum + c.getLength(), 0);
  const mainResult = chain(p.main, settings, p.main[0].start, new THREE.Quaternion(), hand);
  const path = joined([...prefix, ...mainResult.curves]), length = path.getLength(), distances = path.getCurveLengths();
  const front = p.main[0].start.clone(), rear = mainResult.curves[2].getPointAt(1);
  const frontPose = new THREE.Quaternion(), rearPose = mainResult.poses[2];
  let returning: Curve[];
  if (driver === '16' || driver === '15B') {
    // The front half is controlled from 08; the rear half shares closure.
    const result = chain(p.reverse, settings, front, frontPose, hand).curves;
    const fixed = driver === '16' ? 1 : 2;
    const following = closeParts(result.slice(fixed), rear, p.reverse[p.reverse.length - 1].endTangent.clone().applyQuaternion(rearPose));
    returning = [...result.slice(0, fixed), ...following].reverse().map(c => new ReverseCurve(c));
  } else {
    // Keep the selected bend's geometry; neighbouring bends share closure.
    const result = chain(p.returning, settings, rear, rearPose, hand).curves;
    const fixed = driver === '14' ? 1 : driver === '15A' ? 2 : 0;
    returning = [...result.slice(0, fixed), ...closeParts(result.slice(fixed), front, p.returning[p.returning.length - 1].endTangent.clone().applyQuaternion(frontPose))];
  }
  const returnPath = joined(returning), returnLength = returnPath.getLength();
  const welds = base.main.welds.map(t => t * base.main.length).filter(d => d < prefixLength - .00001);
  let offset = prefixLength;
  mainResult.curves.forEach((c, i) => {
    if ((settings[p.main[i].section.id]?.bend ?? p.main[i].section.baseBend) > .05) {
      const count = Math.max(2, Math.ceil(c.getLength() / .15));
      for (let j = 0; j <= count; j++) welds.push(offset + c.getLength() * j / count);
    }
    offset += c.getLength();
  });
  const main: ExhaustRoute = { curve: path, length, welds: welds.filter((d, i, all) => !i || d - all[i - 1] > .04).map(d => d / length) };
  const returnCount = Math.ceil(returnLength / .15);
  return { ...base, main, returning: { curve: returnPath, length: returnLength, welds: Array.from({ length: returnCount + 1 }, (_, i) => i / returnCount) },
    colorStops: [...base.colorStops.slice(0, 13).map(t => t * base.main.length / length), ...distances.slice(15).map(d => d / length)],
    returnColorStops: returnPath.getCurveLengths().map(d => d / returnLength),
    merges: base.merges.map(s => ({ ...s, t: s.t * base.main.length / length })),
    branchJoins: [
      { main: { t: distances[17] / length, position: rear }, returning: { t: 0, position: rear.clone() } },
      { main: { t: prefixLength / length, position: front }, returning: { t: 1, position: front.clone() } },
    ],
    radiusAt(t) { return t * length <= prefixLength ? base.radiusAt(t * length / base.main.length) : .228; },
  };
}
