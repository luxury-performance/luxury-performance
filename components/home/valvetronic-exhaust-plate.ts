import * as THREE from 'three';
import { createExhaustMetal, finishExhaustMetal, exhaustEdgeWeldGeometry } from './valvetronic-exhaust-surface';
import type { ExhaustBank } from './valvetronic-exhaust-routing';
import { VALVETRONIC_SHIELD_PATH, VALVETRONIC_SHIELD_VIEWBOX } from './valvetronic-shield-vector';
import { EXHAUST_BANK_OFFSET } from './valvetronic-exhaust-presets';

export const EXHAUST_PLATE_ENGRAVING_COLOR = '#4d5559';

export function createExhaustPlateMetal(grain: THREE.Texture, vertexColors = false) {
  return createExhaustMetal(grain, 'sheet', vertexColors);
}

export function finishExhaustPlateMetal(material: THREE.MeshPhysicalMaterial, titanium: boolean) {
  finishExhaustMetal(material, titanium);
}

export function createExhaustPlateEngraving(texture: THREE.Texture) {
  return new THREE.MeshStandardMaterial({
    map: texture, transparent: true, depthWrite: false, metalness: .15, roughness: .85,
    polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
  });
}

// Transcribed from the owner's close-up; keep the line breaks and punctuation.
export const UPPER_PLATE_INSCRIPTION = [
  'VALVETRONIC DESIGNS',
  'SPECIAL OPS',
  'AN UNFORGETTABLE, TRUE F1 EXPERIENCE',
  'DESIGNED AND ENGINEERED IN',
  'BOYERTOWN, PA, USA',
] as const;

/** The plate bridges 04 on both banks, on the roof-facing side of the turn. */
export function upperPlateFrame(bank: ExhaustBank) {
  const near = bank.main.curve.curves[6].getPoint(0);
  const far = bank.main.curve.curves[7].getPoint(1);
  // The shield faces the top straight (03), as in the front reference photo.
  const along = near.clone().sub(far).normalize();
  const across = new THREE.Vector3(-1, 0, 0);
  const normal = across.clone().cross(along).normalize();
  const span = near.distanceTo(far);
  const radius = span / 2, halfHeight = span * .30;
  return {
    position: bank.merges[0].position.clone(),
    quaternion: new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(across, along, normal)),
    halfWidth: plateWidthAt(halfHeight, radius),
    halfHeight,
    radius,
    normal,
  };
}

// The side cut follows the same circular centreline as the two 04 elbows.
export function plateWidthAt(y: number, radius: number) {
  return EXHAUST_BANK_OFFSET + .05 + radius - Math.sqrt(Math.max(0, radius * radius - y * y));
}

/** A flat cut sheet: only its outline curves; both faces remain planar. */
export function upperPlateGeometry(halfWidth: number, halfHeight: number, radius: number, frontOnly = false) {
  const columns = 40, rows = 48, stride = columns + 1;
  const positions: number[] = [], uvs: number[] = [], colors: number[] = [], indices: number[] = [];
  function add(u: number, v: number, back = false) {
    const y = halfHeight * v * (.84 + .16 * u * u);
    const x = plateWidthAt(y, radius) * u;
    positions.push(x, y, .205 + (back ? 0 : .018) + (frontOnly ? .0015 : 0));
    uvs.push(x / (2 * halfWidth) + .5, y / (2 * halfHeight) + .5);
    // A restrained heat tint at the welded corners, leaving the lettering clear.
    const edge = Math.pow(Math.abs(u * v), 5);
    colors.push(1 - edge * .25, 1 - edge * .32, 1 - edge * .09);
  }
  for (let face = 0; face < (frontOnly ? 1 : 2); face++) {
    const offset = positions.length / 3;
    for (let j = 0; j <= rows; j++) for (let i = 0; i <= columns; i++) add(i / columns * 2 - 1, j / rows * 2 - 1, face === 1);
    for (let j = 0; j < rows; j++) for (let i = 0; i < columns; i++) {
      const a = offset + j * stride + i, b = a + 1, c = a + stride, d = c + 1;
      if (face) indices.push(a, c, b, b, c, d);
      else indices.push(a, b, c, b, d, c);
    }
  }
  if (!frontOnly) {
    const faceSize = stride * (rows + 1), edge: number[] = [];
    for (let i = 0; i <= columns; i++) edge.push(i);
    for (let j = 1; j <= rows; j++) edge.push(j * stride + columns);
    for (let i = columns - 1; i >= 0; i--) edge.push(rows * stride + i);
    for (let j = rows - 1; j > 0; j--) edge.push(j * stride);
    for (let i = 0; i < edge.length; i++) {
      const a = edge[i], b = edge[(i + 1) % edge.length];
      indices.push(a, a + faceSize, b, b, a + faceSize, b + faceSize);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

/** Canvas typography stays crisp when zoomed; the plate is actual mesh geometry. */
function inscriptionTexture(textureSize = 2048) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = textureSize;
  const ctx = canvas.getContext('2d')!;
  ctx.scale(textureSize / 1024, textureSize / 1024); ctx.fillStyle = ctx.strokeStyle = EXHAUST_PLATE_ENGRAVING_COLOR;
  // Inset all artwork together so the small copy clears the plate's narrow waist.
  ctx.translate(512, 448); ctx.scale(.8, .8); ctx.translate(-512, -448);
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  function text(value: string, y: number, size: number, width: number, weight = 500) {
    ctx.save(); ctx.font = `italic ${weight} ${size}px Arial, Helvetica, sans-serif`;
    const measured = ctx.measureText(value).width;
    ctx.translate(512, y); ctx.scale(Math.min(1, width / measured), 1);
    ctx.fillText(value, 0, 0); ctx.restore();
  }
  // The actual logo outline and V/D are vector-traced, preserving the D's counter.
  const shieldWidth = 62, shieldHeight = shieldWidth * VALVETRONIC_SHIELD_VIEWBOX[1] / VALVETRONIC_SHIELD_VIEWBOX[0];
  ctx.save(); ctx.translate(512 - shieldWidth / 2, 294 - shieldHeight / 2);
  ctx.scale(shieldWidth / VALVETRONIC_SHIELD_VIEWBOX[0], shieldHeight / VALVETRONIC_SHIELD_VIEWBOX[1]);
  ctx.fill(new Path2D(VALVETRONIC_SHIELD_PATH), 'evenodd'); ctx.restore();
  // Two botanical laurel branches, rather than a generic ring around the text.
  for (const sign of [-1, 1]) {
    ctx.save(); ctx.translate(512, 0); ctx.scale(sign, 1); ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(234, 511); ctx.bezierCurveTo(288, 462, 294, 375, 258, 326); ctx.stroke();
    for (let i = 0; i < 17; i++) {
      const t = i / 16, y = 501 - t * 165, x = 242 + Math.sin(t * Math.PI) * 41 + t * 14;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-.45 + t * .9);
      ctx.beginPath(); ctx.ellipse(8, -4, 12, 3.7, -.65, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(-6, -7, 10, 3.5, .7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }
  text(UPPER_PLATE_INSCRIPTION[0], 391, 37, 492, 600);
  ctx.fillRect(266, 416, 492, 2.5);
  text(UPPER_PLATE_INSCRIPTION[1], 451, 52, 408, 600);
  text(UPPER_PLATE_INSCRIPTION[2], 557, 23.5, 575);
  text(UPPER_PLATE_INSCRIPTION[3], 585, 23.5, 460);
  text(UPPER_PLATE_INSCRIPTION[4], 613, 23.5, 370);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  return texture;
}

export function createUpperPlate(bank: ExhaustBank, grain: THREE.Texture, textureSize = 2048) {
  const frame = upperPlateFrame(bank), group = new THREE.Group();
  group.name = 'Upper inner turn — Special Ops plate';
  group.position.copy(frame.position); group.quaternion.copy(frame.quaternion);
  const bodyGeometry = upperPlateGeometry(frame.halfWidth, frame.halfHeight, frame.radius);
  const letteringGeometry = upperPlateGeometry(frame.halfWidth, frame.halfHeight, frame.radius, true);
  const material = createExhaustPlateMetal(grain, true);
  const texture = inscriptionTexture(textureSize);
  const letteringMaterial = createExhaustPlateEngraving(texture);
  group.add(new THREE.Mesh(bodyGeometry, material), new THREE.Mesh(letteringGeometry, letteringMaterial));
  const weldMaterial = createExhaustMetal(grain, 'weld');
  const welds = [-1, 1].flatMap(side => [-1, 1].map(end => {
    const points = Array.from({ length: 18 }, (_, i) => {
      const y = end * frame.halfHeight * (.55 + .45 * i / 17);
      return new THREE.Vector3(side * plateWidthAt(y, frame.radius), y, .223);
    });
    const geometry = exhaustEdgeWeldGeometry(points, .005, side * 2 + end);
    group.add(new THREE.Mesh(geometry, weldMaterial)); return geometry;
  }));
  return {
    group, geometries: [bodyGeometry, letteringGeometry, ...welds],
    materials: [material, letteringMaterial, weldMaterial], textures: [texture],
    finish(titanium: boolean) {
      finishExhaustPlateMetal(material, titanium);
      finishExhaustMetal(weldMaterial, titanium);
    },
  };
}
