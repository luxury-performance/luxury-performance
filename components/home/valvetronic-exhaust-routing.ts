import * as THREE from 'three';
import { MarchingCubes } from 'three/addons/objects/MarchingCubes.js';

export type RoutePoint = [number, number, number];
export type ExhaustRoute = { curve: THREE.CurvePath<THREE.Vector3>; length: number; welds: number[] };
type Station = { t: number; position: THREE.Vector3 };
export type ExhaustBank = {
  main: ExhaustRoute;
  returning: ExhaustRoute;
  merges: Station[];
  colorStops: number[];
  returnColorStops: number[];
  branchJoins: Array<{ main: Station; returning: Station }>;
  radiusAt(t: number): number;
};
export type JunctionBranch = { route: ExhaustRoute; t: number; radiusAt(t: number): number; offset?: THREE.Vector3 };

// Reduce the roll of the alternating folds by ten degrees. Each step is
// rotated rigidly, preserving elbow radii and the spacing across each turn.
export const HURACAN_ROUTE_LAYOUT = (() => {
  const axis = new THREE.Vector3(1, 0, 0), reduction = THREE.MathUtils.degToRad(10);
  const innerStep = new THREE.Vector3(0, -.43, -1.15).applyAxisAngle(axis, reduction);
  const nearStep = new THREE.Vector3(0, -.52, 1.15).applyAxisAngle(axis, -reduction);
  const top = new THREE.Vector3(0, 1.08, .50);
  const firstBack = top.clone().add(innerStep);
  const middle = firstBack.clone().add(nearStep);
  const shortBack = middle.clone().add(innerStep);
  const tailOffset = shortBack.clone().sub(new THREE.Vector3(0, -.30, -.65));
  return { top, firstBack, middle, shortBack, tailOffset };
})();

/** Owner's front-view frame: +Y roof, -Y floor, +Z toward viewer, -Z away. */
export function huracanBank(sign: number, outerRollDegrees = 40): ExhaustBank {
  const mirror = (p: RoutePoint) => new THREE.Vector3(p[0] * sign, p[1], p[2]);
  const curve = new THREE.CurvePath<THREE.Vector3>();
  const seamDistances: number[] = [];
  const { top, firstBack, middle, shortBack, tailOffset } = HURACAN_ROUTE_LAYOUT;
  const innerElbowRadius = top.distanceTo(firstBack) / 2;
  const tail = (x: number, y: number, z = -.65): RoutePoint => [x, y + tailOffset.y, z + tailOffset.z];
  // The gold elbow is defined entirely by 03's fixed X/Y frame.
  const topElbowRadius = .43, topEndX = -1.8713488;
  const topJoin = new THREE.Vector3(topEndX - topElbowRadius, top.y - topElbowRadius, top.z);
  const outerRadius = .584166072277396;
  // Roll only the downstream U assembly around the gold elbow's port axis.
  const outerRoll = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(outerRollDegrees));
  const outerAcross = new THREE.Vector3(0, 0, 1).applyQuaternion(outerRoll);
  const outerDown = new THREE.Vector3(0, -1, 0);
  const outerBack = topJoin.clone().addScaledVector(outerAcross, -2 * outerRadius);
  const outerMiddle = topJoin.clone().add(outerBack).multiplyScalar(.5).addScaledVector(outerDown, outerRadius);
  // The reverse elbow and entry follow the U's own frame, with no world anchor.
  const entryJoint = outerBack.clone().addScaledVector(outerAcross, -.10).addScaledVector(outerDown, -.30);
  const entryPitch = THREE.MathUtils.degToRad(20);
  const entryTip = entryJoint.clone().addScaledVector(outerDown, -1.05 * Math.cos(entryPitch)).addScaledVector(outerAcross, -1.05 * Math.sin(entryPitch));
  let point = mirror(entryTip.toArray() as RoutePoint);
  let length = 0;
  function add(segment: THREE.Curve<THREE.Vector3>, welded: boolean) {
    segment.arcLengthDivisions = 100;
    const distance = segment.getLength();
    if (welded) {
      const steps = Math.max(2, Math.ceil(distance / .15));
      for (let i = 0; i <= steps; i++) seamDistances.push(length + distance * i / steps);
    }
    curve.add(segment); length += distance; point = segment.getPoint(1);
  }
  function line(end: RoutePoint) { add(new THREE.LineCurve3(point.clone(), mirror(end)), false); }
  function bend(c1: RoutePoint, c2: RoutePoint, end: RoutePoint) {
    add(new THREE.CubicBezierCurve3(point.clone(), mirror(c1), mirror(c2), mirror(end)), true);
  }
  function station() { return { distance: length, position: point.clone() }; }
  // Two circular 90-degree elbows meet directly at the centre. The radius
  // comes from half the run separation, avoiding a stretched elliptical turn.
  function innerTurn(front: THREE.Vector3, back: THREE.Vector3) {
    const midY = (front.y + back.y) / 2, midZ = (front.z + back.z) / 2;
    const halfY = (front.y - back.y) / 2, halfZ = (front.z - back.z) / 2;
    const kappa = (4 / 3) * Math.tan(Math.PI / 8), halfWidth = innerElbowRadius;
    bend(
      [-halfWidth + halfWidth * kappa, front.y, front.z],
      [0, midY + halfY * kappa, midZ + halfZ * kappa],
      [0, midY, midZ],
    );
    const middle = station();
    bend(
      [0, midY - halfY * kappa, midZ - halfZ * kappa],
      [-halfWidth + halfWidth * kappa, back.y, back.z],
      [-halfWidth, back.y, back.z],
    );
    return middle;
  }

  // Follow the outer bend from the entry back to the top straight: A, B, C, D.
  line(entryJoint.toArray() as RoutePoint);
  const outerHandle = outerRadius * (4 / 3) * Math.tan(Math.PI / 8);
  // 02A reverses into the entry, carrying both its position and orientation.
  const entryDirection = entryJoint.clone().sub(entryTip).normalize();
  bend(
    entryJoint.clone().addScaledVector(entryDirection, .11).toArray() as RoutePoint,
    outerBack.clone().addScaledVector(outerDown, -.10).toArray() as RoutePoint,
    outerBack.toArray() as RoutePoint,
  );
  // 02B and 02C: two matching 90-degree elbows, rolled together as one U-turn.
  bend(
    outerBack.clone().addScaledVector(outerDown, outerHandle).toArray() as RoutePoint,
    outerMiddle.clone().addScaledVector(outerAcross, -outerHandle).toArray() as RoutePoint,
    outerMiddle.toArray() as RoutePoint,
  );
  bend(
    outerMiddle.clone().addScaledVector(outerAcross, outerHandle).toArray() as RoutePoint,
    topJoin.clone().addScaledVector(outerDown, outerHandle).toArray() as RoutePoint,
    topJoin.toArray() as RoutePoint,
  );
  // 02D is a fixed circular elbow in 03's plane; U roll cannot alter its angle.
  const topHandle = topElbowRadius * (4 / 3) * Math.tan(Math.PI / 8);
  bend(
    [topJoin.x, topJoin.y + topHandle, topJoin.z],
    [topEndX - topHandle, top.y, top.z],
    [topEndX, top.y, top.z],
  );
  line([-innerElbowRadius, 1.08, .50]);
  const upperMerge = innerTurn(top, firstBack);
  const nearX = -1.35;
  line([nearX, firstBack.y, firstBack.z]);
  // Two tangent quarter-circle elbows and an actual straight centre piece.
  const nearStart = new THREE.Vector3(nearX, firstBack.y, firstBack.z);
  const nearEnd = new THREE.Vector3(nearX, middle.y, middle.z);
  const across = nearEnd.clone().sub(nearStart).normalize();
  const elbowRadius = .36, handle = elbowRadius * (4 / 3) * Math.tan(Math.PI / 8);
  const firstElbowEnd = nearStart.clone().add(new THREE.Vector3(-elbowRadius, 0, 0)).addScaledVector(across, elbowRadius);
  const secondElbowStart = nearEnd.clone().add(new THREE.Vector3(-elbowRadius, 0, 0)).addScaledVector(across, -elbowRadius);
  bend(
    nearStart.clone().add(new THREE.Vector3(-handle, 0, 0)).toArray() as RoutePoint,
    firstElbowEnd.clone().addScaledVector(across, -handle).toArray() as RoutePoint,
    firstElbowEnd.toArray() as RoutePoint,
  );
  line(secondElbowStart.toArray() as RoutePoint);
  bend(
    secondElbowStart.clone().addScaledVector(across, handle).toArray() as RoutePoint,
    nearEnd.clone().add(new THREE.Vector3(-handle, 0, 0)).toArray() as RoutePoint,
    nearEnd.toArray() as RoutePoint,
  );
  line([-innerElbowRadius, middle.y, middle.z]);
  const lowerMerge = innerTurn(middle, shortBack);
  const innerJoin = station();
  // 09–10 is a short 40-degree transition, immediately after the inner
  // turn. The photograph shows almost no horizontal run before this elbow.
  const diagonalAngle = THREE.MathUtils.degToRad(40), tailRadius = .34;
  const entryStart = new THREE.Vector3(-innerElbowRadius - .035, shortBack.y, shortBack.z);
  const diagonalDirection = new THREE.Vector3(-Math.cos(diagonalAngle), -Math.sin(diagonalAngle), 0);
  const diagonalEntry = entryStart.clone().add(new THREE.Vector3(-tailRadius * Math.sin(diagonalAngle), -tailRadius * (1 - Math.cos(diagonalAngle)), 0));
  const entryHandle = tailRadius * (4 / 3) * Math.tan(diagonalAngle / 4);
  line(entryStart.toArray() as RoutePoint);
  bend(
    entryStart.clone().add(new THREE.Vector3(-entryHandle, 0, 0)).toArray() as RoutePoint,
    diagonalEntry.clone().addScaledVector(diagonalDirection, -entryHandle).toArray() as RoutePoint,
    diagonalEntry.toArray() as RoutePoint,
  );

  // 11 stays straight and at one Z depth. Preserve the outlet position;
  // the compact bends naturally give this diagonal more of the pipe length.
  const outletX = -2.35;
  const rearStartX = outletX + tailRadius * (1 - Math.sin(diagonalAngle));
  const diagonalLength = (diagonalEntry.x - rearStartX) / Math.cos(diagonalAngle);
  const rearStart = diagonalEntry.clone().addScaledVector(diagonalDirection, diagonalLength);
  line(rearStart.toArray() as RoutePoint);

  // 12 is a circular 50-degree elbow into the vertical outlet, rather than
  // an elongated knee. 14 joins the same throat just below this turn.
  const rearEnd = rearStart.clone().add(new THREE.Vector3(-tailRadius * (1 - Math.sin(diagonalAngle)), -tailRadius * Math.cos(diagonalAngle), 0));
  const rearHandle = tailRadius * (4 / 3) * Math.tan((Math.PI / 2 - diagonalAngle) / 4);
  bend(
    rearStart.clone().addScaledVector(diagonalDirection, rearHandle).toArray() as RoutePoint,
    rearEnd.clone().add(new THREE.Vector3(0, rearHandle, 0)).toArray() as RoutePoint,
    rearEnd.toArray() as RoutePoint,
  );
  line(rearEnd.clone().add(new THREE.Vector3(0, -.025, 0)).toArray() as RoutePoint);
  const rearJoin = station();
  line(tail(outletX, -2.40));
  curve.arcLengthDivisions = 2600;
  const main: ExhaustRoute = { curve, length, welds: seamDistances.filter((d, i, a) => !i || d - a[i - 1] > .045).map(d => d / length) };
  const stationAt = (s: ReturnType<typeof station>): Station => ({ t: s.distance / length, position: s.position });
  const merges = [stationAt(upperMerge), stationAt(lowerMerge)];

  // C-return: 14 leaves the rear throat; two quarter-circle elbows
  // (15A/15B) turn away and back; 16 connects directly to the end of 08.
  const returningCurve = new THREE.CurvePath<THREE.Vector3>();
  const linkRadius = .32, linkHandle = linkRadius * (4 / 3) * Math.tan(Math.PI / 8);
  const away = new THREE.Vector3(0, 0, -1), up = new THREE.Vector3(0, 1, 0);
  const returnRearEnd = rearJoin.position.clone().addScaledVector(up, linkRadius).addScaledVector(away, linkRadius);
  const frontEnd = innerJoin.position.clone();
  // From 08, both 09–10 and 16 leave outward; 16 then turns away.
  const frontStart = frontEnd.clone().add(new THREE.Vector3(-sign * linkRadius, 0, -linkRadius));
  const lead = new THREE.CubicBezierCurve3(
    rearJoin.position.clone(), rearJoin.position.clone().addScaledVector(up, linkHandle),
    returnRearEnd.clone().addScaledVector(away, -linkHandle), returnRearEnd,
  );
  const returnAcross = frontStart.clone().sub(returnRearEnd), radius = returnAcross.length() / 2;
  returnAcross.normalize();
  const returnMiddle = returnRearEnd.clone().add(frontStart).multiplyScalar(.5).addScaledVector(away, radius);
  const returnHandle = radius * (4 / 3) * Math.tan(Math.PI / 8);
  const first = new THREE.CubicBezierCurve3(
    returnRearEnd.clone(), returnRearEnd.clone().addScaledVector(away, returnHandle),
    returnMiddle.clone().addScaledVector(returnAcross, -returnHandle), returnMiddle,
  );
  const second = new THREE.CubicBezierCurve3(
    returnMiddle.clone(), returnMiddle.clone().addScaledVector(returnAcross, returnHandle),
    frontStart.clone().addScaledVector(away, returnHandle), frontStart,
  );
  const back = new THREE.CubicBezierCurve3(
    frontStart.clone(), frontStart.clone().add(new THREE.Vector3(0, 0, linkHandle)),
    frontEnd.clone().add(new THREE.Vector3(-sign * linkHandle, 0, 0)), frontEnd,
  );
  for (const part of [lead, first, second, back]) { part.arcLengthDivisions = 120; returningCurve.add(part); }
  returningCurve.arcLengthDivisions = 1200;
  const returnLength = returningCurve.getLength();
  const returning: ExhaustRoute = { curve: returningCurve, length: returnLength, welds: Array.from({ length: Math.ceil(returnLength / .15) + 1 }, (_, i) => i / Math.ceil(returnLength / .15)) };
  return {
    main, returning, merges,
    colorStops: [0, 1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 16, 17, 19, 20].map(index => curve.curves.slice(0, index + 1).reduce((sum, segment) => sum + segment.getLength(), 0) / length),
    returnColorStops: returningCurve.getCurveLengths().map(distance => distance / returnLength),
    branchJoins: [
      { main: stationAt(rearJoin), returning: { t: 0, position: rearJoin.position.clone() } },
      { main: stationAt(innerJoin), returning: { t: 1, position: innerJoin.position.clone() } },
    ],
    radiusAt(t) { return THREE.MathUtils.lerp(.19, .228, THREE.MathUtils.smoothstep(t, merges[0].t + .025, merges[1].t - .025)); },
  };
}

/** Straight hanger sections with tangent arc fillets. */
export function roundedExhaustRoute(points: RoutePoint[], bendRadius: number, withWelds = true): ExhaustRoute {
  const vertices = points.map(p => new THREE.Vector3(...p));
  const curve = new THREE.CurvePath<THREE.Vector3>();
  const seamDistances: number[] = [];
  let distance = 0, previous = vertices[0];
  function line(to: THREE.Vector3) {
    if (previous.distanceTo(to) > .00001) {
      const segment = new THREE.LineCurve3(previous.clone(), to.clone());
      curve.add(segment); distance += segment.getLength();
    }
    previous = to;
  }
  for (let i = 1; i < vertices.length - 1; i++) {
    const corner = vertices[i], incoming = vertices[i - 1].clone().sub(corner), outgoing = vertices[i + 1].clone().sub(corner);
    const before = incoming.length(), after = outgoing.length(); incoming.normalize(); outgoing.normalize();
    const angle = Math.acos(THREE.MathUtils.clamp(incoming.dot(outgoing), -1, 1));
    if (angle > Math.PI - .001 || angle < .001) { line(corner); continue; }
    const trim = Math.min(bendRadius / Math.tan(angle / 2), before * .43, after * .43);
    const entry = corner.clone().addScaledVector(incoming, trim), exit = corner.clone().addScaledVector(outgoing, trim);
    line(entry);
    const radius = trim * Math.tan(angle / 2), handle = 4 / 3 * radius * Math.tan((Math.PI - angle) / 4);
    const arc = new THREE.CubicBezierCurve3(entry, entry.clone().addScaledVector(incoming, -handle), exit.clone().addScaledVector(outgoing, -handle), exit);
    const arcLength = arc.getLength();
    if (withWelds) for (let j = 0; j <= 6; j++) seamDistances.push(distance + arcLength * j / 6);
    curve.add(arc); distance += arcLength; previous = exit;
  }
  line(vertices[vertices.length - 1]); curve.arcLengthDivisions = 1200;
  return { curve, length: distance, welds: seamDistances.map(d => d / distance) };
}

/** One blended external surface at a shared X or C-return junction. */
export function mergedExhaustJunction(branches: JunctionBranch[], center: THREE.Vector3): THREE.BufferGeometry {
  const resolution = 34, half = new THREE.Vector3(.52, .48, .52);
  const segments = branches.map(({ route, t, radiusAt, offset }) => {
    const points = Array.from({ length: 35 }, (_, i) => {
      const at = THREE.MathUtils.clamp(t + (i / 34 * 2 - 1) * .95 / route.length, 0, 1);
      const p = route.curve.getPointAt(at);
      if (offset) p.add(offset);
      return { p, radius: radiusAt(at) + .003 };
    });
    return points.slice(1).map((end, i) => ({ start: points[i].p, direction: end.p.clone().sub(points[i].p), radius: points[i].radius, endRadius: end.radius })).filter(s => s.direction.lengthSq() > 1e-12);
  });
  const material = new THREE.MeshBasicMaterial(), surface = new MarchingCubes(resolution, material, false, false, 18000);
  surface.isolation = 0;
  const point = new THREE.Vector3();
  function distanceToBranch(branch: typeof segments[number]) {
    let distance = Infinity;
    for (const segment of branch) {
      const x = point.x - segment.start.x, y = point.y - segment.start.y, z = point.z - segment.start.z;
      const p = THREE.MathUtils.clamp((x * segment.direction.x + y * segment.direction.y + z * segment.direction.z) / segment.direction.lengthSq(), 0, 1);
      const dx = x - p * segment.direction.x, dy = y - p * segment.direction.y, dz = z - p * segment.direction.z;
      distance = Math.min(distance, Math.sqrt(dx * dx + dy * dy + dz * dz) - THREE.MathUtils.lerp(segment.radius, segment.endRadius, p));
    }
    return distance;
  }
  for (let z = 0; z < resolution; z++) for (let y = 0; y < resolution; y++) for (let x = 0; x < resolution; x++) {
    point.set((x / resolution * 2 - 1) * half.x + center.x, (y / resolution * 2 - 1) * half.y + center.y, (z / resolution * 2 - 1) * half.z + center.z);
    const a = distanceToBranch(segments[0]), b = distanceToBranch(segments[1]);
    const blend = THREE.MathUtils.clamp(.5 + .5 * (b - a) / .06, 0, 1);
    surface.field[x + y * resolution + z * resolution * resolution] = -(THREE.MathUtils.lerp(b, a, blend) - .06 * blend * (1 - blend));
  }
  surface.update();
  const geometry = new THREE.BufferGeometry(), count = surface.geometry.drawRange.count;
  for (const name of ['position', 'normal']) {
    const attribute = surface.geometry.getAttribute(name);
    geometry.setAttribute(name, new THREE.BufferAttribute(new Float32Array(attribute.array.slice(0, count * 3)), 3));
  }
  geometry.scale(half.x, half.y, half.z); geometry.translate(center.x, center.y, center.z);
  surface.geometry.dispose(); material.dispose(); return geometry;
}
