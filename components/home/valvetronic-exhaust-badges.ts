import * as THREE from 'three';
import { createExhaustMetal, finishExhaustMetal, exhaustEdgeWeldGeometry } from './valvetronic-exhaust-surface';
import type { ExhaustBank } from './valvetronic-exhaust-routing';
import { VALVETRONIC_SHIELD_PATH, VALVETRONIC_SHIELD_VIEWBOX } from './valvetronic-shield-vector';
import { BADGE_ART } from './valvetronic-badge-art';
import { upperPlateFrame, EXHAUST_PLATE_ENGRAVING_COLOR, createExhaustPlateMetal, createExhaustPlateEngraving, finishExhaustPlateMetal } from './valvetronic-exhaust-plate';

export type ExhaustBadgeKind = 'special-ops' | 'authenticity';
export const EXHAUST_BADGE_COPY = {
  'special-ops': ['LAMBORGHINI HURACAN STO F1', 'VALVETRONIC DESIGNS', 'SPECIAL OPS', '“The Audible Experience Perfected”'],
  authenticity: ['The Audible Experience Perfected', 'Authenticity Tag', 'Serial No.', 'VD067-00259B'],
} as const;

/** The badges sit on 05, with their faces and reading direction matching the centre plate. */
export function exhaustBadgeFrame(bank: ExhaustBank) {
  const straight = bank.main.curve.curves[8];
  const station = (bank.main.curve.curves.slice(0, 8).reduce((sum, c) => sum + c.getLength(), 0) + straight.getLength() / 2) / bank.main.length;
  const { normal, quaternion } = upperPlateFrame(bank);
  const width = Math.min(.52, straight.getLength() - .12), height = width * .46;
  const across = new THREE.Vector3(1, 0, 0).applyQuaternion(quaternion);
  const alongRoute = across.dot(straight.getTangentAt(.5));
  const bracketX = width / 2 - .008;
  const bracketRadii = [-1, 1].map(side => bank.radiusAt(station + side * alongRoute * bracketX / bank.main.length));
  return {
    position: straight.getPointAt(.5).addScaledVector(normal, bank.radiusAt(station) + .016),
    quaternion,
    normal, width, height, radius: bank.radiusAt(station), bracketRadii,
  };
}

/** Folded top/bottom lips follow the tube across the full width of each badge. */
export function exhaustBadgeBracketGeometry(width: number, edgeY: number, tubeRadii: number[], axisOffset: number) {
  const shape = new THREE.Shape(), halfWidth = width / 2;
  shape.moveTo(-halfWidth, -.005); shape.lineTo(halfWidth, -.005);
  for (let i = 0; i <= 24; i++) {
    const u = 1 - i / 24, x = -halfWidth + width * u;
    const radius = THREE.MathUtils.lerp(tubeRadii[0], tubeRadii[1], u);
    const z = Math.sqrt(radius * radius - edgeY * edgeY) - axisOffset - .0015;
    shape.lineTo(x, z);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: .012, bevelEnabled: false, steps: 1 });
  // Shape X/Y become badge X/Z; the sheet thickness runs across badge Y.
  geometry.applyMatrix4(new THREE.Matrix4().makeBasis(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, -1, 0)));
  geometry.translate(0, .006, 0);
  return geometry;
}

export function exhaustBadgeMountingTabs(frame: ReturnType<typeof exhaustBadgeFrame>) {
  const spans = [[-frame.width / 2 + .012, -frame.width / 2 + .09], [frame.width / 2 - .09, frame.width / 2 - .012]];
  return [-1, 1].flatMap(side => spans.map(([start, end]) => ({
    start, end, edgeY: side * (frame.height / 2 - .008),
    radii: [start, end].map(x => THREE.MathUtils.lerp(frame.bracketRadii[0], frame.bracketRadii[1], (x + frame.width / 2) / frame.width)),
  })));
}

type VectorArt = { path: string; width: number; height: number };
function badgeTexture(kind: ExhaustBadgeKind) {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 1024;
  const ctx = canvas.getContext('2d')!; ctx.scale(2048 / 1200, 1024 / 600);
  ctx.fillStyle = ctx.strokeStyle = EXHAUST_PLATE_ENGRAVING_COLOR;
  ctx.lineWidth = 2.5; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  function line(x1: number, y1: number, x2: number, y2: number) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function text(value: string, x: number, y: number, size: number, maxWidth: number, italic = false) {
    ctx.save(); ctx.font = `${italic ? 'italic ' : ''}500 ${size}px Arial, Helvetica, sans-serif`;
    ctx.translate(x, y); ctx.scale(Math.min(1, maxWidth / ctx.measureText(value).width), 1); ctx.fillText(value, 0, 0); ctx.restore();
  }
  function vector(art: VectorArt, x: number, y: number, width: number, maxHeight: number) {
    const scale = Math.min(width / art.width, maxHeight / art.height);
    ctx.save(); ctx.translate(x - art.width * scale / 2, y - art.height * scale / 2); ctx.scale(scale, scale);
    ctx.fill(new Path2D(art.path)); ctx.restore();
  }
  function shield(x: number, y: number, height: number) {
    const scale = height / VALVETRONIC_SHIELD_VIEWBOX[1];
    ctx.save(); ctx.translate(x - VALVETRONIC_SHIELD_VIEWBOX[0] * scale / 2, y - height / 2); ctx.scale(scale, scale);
    ctx.fill(new Path2D(VALVETRONIC_SHIELD_PATH), 'evenodd'); ctx.restore();
  }
  function laurels(x: number, y: number, width: number, height: number) {
    for (const sign of [-1, 1]) {
      ctx.save(); ctx.translate(x, y); ctx.scale(sign, 1);
      ctx.beginPath(); ctx.moveTo(width * .38, height * .52);
      ctx.bezierCurveTo(width * .64, height * .2, width * .65, -height * .24, width * .43, -height * .52); ctx.stroke();
      for (let i = 0; i < 17; i++) {
        const t = i / 16, px = width * (.40 + Math.sin(t * Math.PI) * .18 + .03 * t), py = height * (.46 - .92 * t);
        ctx.save(); ctx.translate(px, py); ctx.rotate(-.45 + t * .9);
        ctx.beginPath(); ctx.ellipse(6, -4, 10, 3, -.7, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.ellipse(-5, -6, 9, 3, .7, 0, Math.PI * 2); ctx.fill(); ctx.restore();
      }
      ctx.restore();
    }
  }
  // The references have generous metal margins and an inset, double-line frame.
  ctx.strokeRect(90, 58, 1020, 488); ctx.strokeRect(98, 66, 1004, 472);
  line(98, 169, 1102, 169); line(98, 441, 1102, 441);
  line(206, 66, 206, 169); line(994, 66, 994, 169);
  shield(152, 117, 76); shield(1048, 117, 76);
  if (kind === 'special-ops') {
    text(EXHAUST_BADGE_COPY[kind][0], 600, 119, 37, 750);
    ctx.save();
    ctx.fillRect(160, 171, 880, 268);
    // Knock the lettering out of the engraved field so the real metal shows through.
    ctx.globalCompositeOperation = 'destination-out';
    laurels(600, 306, 550, 180);
    text(EXHAUST_BADGE_COPY[kind][1], 600, 268, 47, 555, true);
    line(323, 299, 877, 299);
    text(EXHAUST_BADGE_COPY[kind][2], 600, 351, 66, 510, true);
    ctx.restore();
    vector(BADGE_ART.quotedMotto, 600, 490, 906, 69);
  } else {
    vector(BADGE_ART.motto, 600, 118, 745, 72);
    // The QR artwork comes from the supplied authenticity-tag photograph.
    const qrSize = BADGE_ART.qrSize;
    ctx.save(); ctx.translate(144, 215); ctx.scale(202 / qrSize, 202 / qrSize);
    ctx.fill(new Path2D(BADGE_ART.qrPath), 'evenodd'); ctx.restore();
    shield(680, 269, 145); laurels(680, 268, 260, 166);
    vector(BADGE_ART.authenticity, 716, 391, 650, 91);
    ctx.save(); ctx.clearRect(477, 423, 246, 38); ctx.strokeRect(477, 423, 246, 38);
    text(EXHAUST_BADGE_COPY[kind][2], 600, 443, 28, 218); ctx.restore();
    vector(BADGE_ART.serial, 600, 501, 735, 65);
  }
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8; return texture;
}

export function createExhaustBadge(bank: ExhaustBank, kind: ExhaustBadgeKind, grain: THREE.Texture) {
  const frame = exhaustBadgeFrame(bank), group = new THREE.Group();
  group.name = kind === 'special-ops' ? 'Left — Lamborghini Huracan STO F1 / Special Ops badge' : 'Right — Authenticity tag VD067-00259B';
  group.position.copy(frame.position); group.quaternion.copy(frame.quaternion);
  const bodyGeometry = new THREE.BoxGeometry(frame.width, frame.height, .014);
  const faceGeometry = new THREE.PlaneGeometry(frame.width, frame.height);
  const bodyMaterial = createExhaustPlateMetal(grain);
  const texture = badgeTexture(kind);
  const faceMaterial = createExhaustPlateEngraving(texture);
  const face = new THREE.Mesh(faceGeometry, faceMaterial); face.position.z = .0076;
  group.add(new THREE.Mesh(bodyGeometry, bodyMaterial), face);
  const tabs = exhaustBadgeMountingTabs(frame);
  const bracketGeometries = tabs.map(({ start, end, edgeY, radii }) => {
    const geometry = exhaustBadgeBracketGeometry(end - start, edgeY, radii, frame.radius + .016);
    const bracket = new THREE.Mesh(geometry, bodyMaterial);
    bracket.position.set((start + end) / 2, edgeY, 0);
    group.add(bracket); return geometry;
  });
  const weldMaterial = createExhaustMetal(grain, 'weld');
  const weldGeometries = [-1, 1].map(side => {
    const geometry = exhaustEdgeWeldGeometry(Array.from({length: 20}, (_, i) => new THREE.Vector3(side * frame.width / 2, frame.height * (i / 19 - .5), .0075)), .005, side);
    group.add(new THREE.Mesh(geometry, weldMaterial)); return geometry;
  });
  for (const tab of tabs) {
    const points = Array.from({length: 12}, (_, i) => {
      const x = THREE.MathUtils.lerp(tab.start, tab.end, i / 11);
      const radius = THREE.MathUtils.lerp(tab.radii[0], tab.radii[1], i / 11);
      return new THREE.Vector3(x, tab.edgeY, Math.sqrt(radius * radius - tab.edgeY * tab.edgeY) - frame.radius - .016);
    });
    const geometry = exhaustEdgeWeldGeometry(points, .004, tab.start * 13);
    group.add(new THREE.Mesh(geometry, weldMaterial)); weldGeometries.push(geometry);
  }
  return {
    group, geometries: [bodyGeometry, faceGeometry, ...bracketGeometries, ...weldGeometries], materials: [bodyMaterial, faceMaterial, weldMaterial], textures: [texture],
    finish(titanium: boolean) {
      finishExhaustPlateMetal(bodyMaterial, titanium);
      finishExhaustMetal(weldMaterial, titanium);
    },
  };
}
