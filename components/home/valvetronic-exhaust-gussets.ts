import * as THREE from 'three';
import { createExhaustMetal, finishExhaustMetal, exhaustEdgeWeldGeometry } from './valvetronic-exhaust-surface';
import type { ExhaustBank } from './valvetronic-exhaust-routing';
import { EXHAUST_BANK_OFFSET } from './valvetronic-exhaust-presets';
import { VALVETRONIC_SHIELD_PATH } from './valvetronic-shield-vector';
import { upperPlateFrame, createExhaustPlateMetal, finishExhaustPlateMetal } from './valvetronic-exhaust-plate';

function stencilHoles(height: number, centerY: number) {
  const scale = height / 281;
  const point = (x: number, y: number) => new THREE.Vector2((x - 127) * scale, centerY + (140.5 - y) * scale);
  function svgPath(data: string) {
    const tokens = data.match(/[MLQZ]|-?\d*\.?\d+/g)!;
    const path = new THREE.Path(); let i = 0;
    while (i < tokens.length) {
      const command = tokens[i++];
      if (command === 'Z') { path.closePath(); continue; }
      const a = point(Number(tokens[i++]), Number(tokens[i++]));
      if (command === 'M') path.moveTo(a.x, a.y);
      else if (command === 'L') path.lineTo(a.x, a.y);
      else if (command === 'Q') {
        const b = point(Number(tokens[i++]), Number(tokens[i++]));
        path.quadraticCurveTo(a.x, a.y, b.x, b.y);
      }
    }
    return path;
  }
  // The V uses the original traced artwork. The D has a stencil bridge so
  // its counter remains attached to the sheet rather than floating in the cut.
  const holes = [svgPath(VALVETRONIC_SHIELD_PATH.match(/M[^M]+/g)![1]), svgPath(
    'M102,64 L102,49 L100,46 L119,46 Q136,46 142,49 L148,52 L151,58 Q154,64 154,71 Q154,78 151,84 L148,90 L141.5,93 Q135,96 117.5,96 L100,96 L102,93 L102,79 L113,79 L113,87 L127,87 Q137,87 141,83 Q143,78 143,71 Q143,60 139,57 Q135,55 124,55 L113,55 L113,64 Z',
  )];
  function slot(curve: THREE.Curve<THREE.Vector2>, start = 0, end = 1) {
    const a: THREE.Vector2[] = [], b: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = THREE.MathUtils.lerp(start, end, i / 24), p = curve.getPoint(t), tangent = curve.getTangent(t).normalize();
      const n = new THREE.Vector2(-tangent.y, tangent.x).multiplyScalar(2.6);
      a.push(point(p.x + n.x, p.y + n.y)); b.push(point(p.x - n.x, p.y - n.y));
    }
    const path = new THREE.Path(); path.setFromPoints([...a, ...b.reverse()]); path.closePath(); holes.push(path);
  }
  for (const sign of [-1, 1]) {
    const p = (x: number, y: number) => new THREE.Vector2(sign < 0 ? x : 254 - x, y);
    slot(new THREE.CubicBezierCurve(p(115, 7), p(76, 24), p(42, 32), p(4, 38)));
    const side = new THREE.CubicBezierCurve(p(4, 38), p(2, 161), p(52, 238), p(122, 275));
    slot(side, 0, .57); slot(side, .65, .96);
  }
  return holes;
}

export type ExhaustBridge = {
  joint: number; side: number; position: THREE.Vector3; quaternion: THREE.Quaternion;
  halfWidth: number; height: number; depth: number; contourRadius: number; seating: number;
};

/** Two junctions, each with one bridge above and one mirrored underneath. */
export function exhaustBridgeSpecs(bank: ExhaustBank): ExhaustBridge[] {
  const frame = upperPlateFrame(bank);
  const up = new THREE.Vector3(0, 1, 0).applyQuaternion(frame.quaternion);
  const turns = bank.main.curve.curves;
  const radius = turns[6].getPointAt(0).distanceTo(turns[7].getPointAt(1)) / 2;
  // Share one profile across all four bridges. The wider lower tube must not
  // produce a smaller brace. The circular sides follow the meeting inner turns.
  const contourRadius = radius + EXHAUST_BANK_OFFSET;
  const height = radius * .98, depth = bank.radiusAt(bank.merges[0].t) * 1.32;
  const halfWidth = bridgeWidth(height, contourRadius);
  const specs: ExhaustBridge[] = [];
  for (let joint = 0; joint < 2; joint++) for (const side of [1, -1]) {
    // Seat the upper pair a little deeper to match the lower pair's fit against
    // its thicker tubing, keeping the shared bridge dimensions and profile.
    const seating = joint === 0 ? bank.radiusAt(bank.merges[1].t) - bank.radiusAt(bank.merges[0].t) : 0;
    specs.push({
    joint, side, halfWidth, height, depth, contourRadius, seating,
    position: bank.merges[joint].position.clone().addScaledVector(up, side * (height - seating)),
    quaternion: frame.quaternion.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), side < 0 ? Math.PI : 0)),
  });
  }
  return specs;
}

function bridgeWidth(up: number, radius: number) {
  return radius - Math.sqrt(Math.max(0, radius * radius - up * up));
}

export function exhaustBridgeGeometry(spec: ExhaustBridge) {
  const w = spec.halfWidth, d = spec.depth / 2, h = spec.height, gauge = .012;
  const shape = new THREE.Shape(); shape.moveTo(-w, -d); shape.lineTo(w, -d); shape.lineTo(w, d); shape.lineTo(-w, d); shape.closePath();
  shape.holes.push(...stencilHoles(spec.depth * .82, 0));
  const cap = new THREE.ExtrudeGeometry(shape, { depth: gauge, bevelEnabled: false, curveSegments: 12, steps: 1 });
  cap.translate(0, 0, -gauge); cap.rotateX(-Math.PI / 2);

  // Both end walls have the same curved V profile. Their sides follow the
  // circular tube contours, with no straight diagonals or fore/aft taper.
  const outline: THREE.Vector2[] = [];
  for (let i = 0; i <= 40; i++) {
    const up = (h - gauge) * i / 40;
    outline.push(new THREE.Vector2(bridgeWidth(up, spec.contourRadius), up - h));
  }
  for (let i = 40; i > 0; i--) {
    const up = (h - gauge) * i / 40;
    outline.push(new THREE.Vector2(-bridgeWidth(up, spec.contourRadius), up - h));
  }
  const profile = new THREE.Shape(outline), wall = new THREE.ShapeGeometry(profile, 12);
  const positions: number[] = [], uv: number[] = [];
  type Point = [number, number, number];
  function triangle(a: Point, b: Point, c: Point, expected: THREE.Vector3) {
    const normal = new THREE.Vector3(...b).sub(new THREE.Vector3(...a)).cross(new THREE.Vector3(...c).sub(new THREE.Vector3(...a)));
    for (const p of normal.dot(expected) > 0 ? [a, b, c] : [a, c, b]) { positions.push(...p); uv.push((p[0] + w) / (2 * w), (p[1] + h) / h); }
  }
  const vertices = wall.getAttribute('position'), indices = wall.getIndex()!;
  for (const sign of [-1, 1]) for (let i = 0; i < indices.count; i += 3) {
    const points = [0, 1, 2].map(k => { const n = indices.getX(i + k); return [vertices.getX(n), vertices.getY(n), sign * d] as Point; });
    triangle(points[0], points[1], points[2], new THREE.Vector3(0, 0, sign));
  }
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    if (Math.abs(a.y + gauge) < 1e-8 && Math.abs(b.y + gauge) < 1e-8) continue;
    const normal = new THREE.Vector3((a.x + b.x) >= 0 ? 1 : -1, -1, 0);
    triangle([a.x,a.y,-d], [a.x,a.y,d], [b.x,b.y,d], normal);
    triangle([a.x,a.y,-d], [b.x,b.y,d], [b.x,b.y,-d], normal);
  }
  wall.dispose();
  const body = new THREE.BufferGeometry(); body.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  body.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); body.computeVertexNormals(); body.computeBoundingSphere();
  return { cap, body, cutoutCount: shape.holes.length };
}

export function createExhaustGussets(bank: ExhaustBank, grain: THREE.Texture) {
  const group = new THREE.Group(); group.name = 'Two upper and two underside curved triangular bridges';
  const metal = createExhaustPlateMetal(grain), inside = new THREE.MeshStandardMaterial({ color: '#272320', metalness: .8, roughness: .65, side: THREE.BackSide });
  const weldMaterial = createExhaustMetal(grain, 'weld');
  const geometries: THREE.BufferGeometry[] = [], sides: THREE.Group[] = [];
  for (const spec of exhaustBridgeSpecs(bank)) {
    const geometry = exhaustBridgeGeometry(spec); geometries.push(geometry.cap, geometry.body);
    const bridge = new THREE.Group(); bridge.name = `${spec.joint ? 'Lower' : 'Upper'} inner turn · ${spec.side > 0 ? 'top' : 'underside'} curved bridge`;
    bridge.position.copy(spec.position); bridge.quaternion.copy(spec.quaternion);
    bridge.add(new THREE.Mesh(geometry.cap, metal), new THREE.Mesh(geometry.body, metal), new THREE.Mesh(geometry.body, inside));
    for (const edge of [-1, 1]) for (const face of [-1, 1]) {
      const points = Array.from({ length: 36 }, (_, i) => {
        const up = (spec.height - .012) * i / 35;
        return new THREE.Vector3(edge * bridgeWidth(up, spec.contourRadius), up - spec.height, face * spec.depth / 2);
      });
      const seam = exhaustEdgeWeldGeometry(points, .0045, spec.joint + edge + face * 2);
      geometries.push(seam); bridge.add(new THREE.Mesh(seam, weldMaterial));
    }
    group.add(bridge); sides.push(bridge);
  }
  return { group, sides, geometries, materials: [metal, inside, weldMaterial], finish(titanium: boolean) {
    finishExhaustPlateMetal(metal, titanium); finishExhaustMetal(weldMaterial, titanium);
    inside.color.set(titanium ? '#30271f' : '#25292d');
  } };
}
