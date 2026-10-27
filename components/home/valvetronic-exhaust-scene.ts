import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { huracanBank, mergedExhaustJunction, roundedExhaustRoute, type ExhaustRoute }  from './valvetronic-exhaust-routing';
import { editOuterBank } from './valvetronic-exhaust-editing';
import { FINISHED_FRONT_EDITS, FINISHED_REAR_EDITS, FINISHED_REAR_DRIVER, EXHAUST_BANK_OFFSET } from './valvetronic-exhaust-presets';
import { editRearBank } from './valvetronic-exhaust-rear-editing';
import { EXHAUST_ROUTE_COLORS, EXHAUST_MAIN_PART_COUNT, EXHAUST_RETURN_PART_COUNT } from './valvetronic-exhaust-palette';
import { createUpperPlate, upperPlateFrame } from './valvetronic-exhaust-plate';
import { createExhaustClamp } from './valvetronic-exhaust-clamps';
import { exhaustRevealProgress } from './valvetronic-exhaust-motion';
import { createExhaustBadge } from './valvetronic-exhaust-badges';
import { createExhaustGussets } from './valvetronic-exhaust-gussets';
import { mapExhaustJoinSurface } from './valvetronic-exhaust-join-surface';
import { createExhaustMetal, finishExhaustMetal, createExhaustPipeSurface, exhaustTubeWeldGeometry } from './valvetronic-exhaust-surface';

export type ExhaustFinish = 'titanium' | 'stainless';
export type ExhaustView = 'overview' | 'welds' | 'reverse' | 'front' | 'entry';
export type ExhaustScene = {
  reveal(): void;
  view(value: ExhaustView): void;
  finish(value: ExhaustFinish): void;
  routeColors(value: boolean): void;
  isolate(value: boolean): void;
  rotate(value: boolean): void;
  zoom(direction: number): void;
  dispose(): void;
};
type Options = { cinematic?: boolean; initialMotion?: boolean; onReveal?(): void; initialIsolated?: boolean; initialRouteColors?: boolean; reducedMotion: boolean; onInteract(): void; onError(): void };

/** Photo-based display reconstruction; not engineering or fitment geometry. */
export function createExhaustScene(host: HTMLDivElement, options: Options): ExhaustScene {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, matchMedia('(max-width: 700px)').matches ? 2 : 2.5));
  renderer.setClearColor(0x101112, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .9;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-label', 'Interactive exhaust model. Drag in any direction to rotate freely. Pinch to zoom; twist with two fingers to roll. Arrow keys rotate; Home restores the photo angle.');
  canvas.setAttribute('role', 'img');
  canvas.tabIndex = 0;
  canvas.style.touchAction = 'none';
  host.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(33, 1, .1, 60);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .018);
  scene.environment = environment.texture;
  scene.environmentIntensity = .9;
  room.dispose();
  pmrem.dispose();
  const key = new THREE.DirectionalLight(0xffffff, 1.7);
  key.position.set(-3, 7, 4);
  const rim = new THREE.DirectionalLight(0xdce7ff, 1);
  rim.position.set(4, 3, -4);
  scene.add(key, rim, new THREE.HemisphereLight(0xf9fafb, 0x272426, .5));

  const model = new THREE.Group();
  scene.add(model);
  const leftBank = new THREE.Group(), rightBank = new THREE.Group(), centre = new THREE.Group();
  model.add(leftBank, rightBank, centre);
  leftBank.position.x = -EXHAUST_BANK_OFFSET;
  rightBank.position.x = EXHAUST_BANK_OFFSET;
  let drawTarget: THREE.Group = model;
  const geometries = new Set<THREE.BufferGeometry>();
  const materials = new Set<THREE.Material>();
  const textures = new Set<THREE.Texture>();
  const ownGeometry = <T extends THREE.BufferGeometry>(value: T): T => { geometries.add(value); return value; };
  const ownMaterial = <T extends THREE.Material>(value: T): T => { materials.add(value); return value; };
  const silver = ownMaterial(new THREE.MeshPhysicalMaterial({ color: 0xc5c6c7, metalness: 1, roughness: .19, clearcoat: .3, clearcoatRoughness: .2 }));
  const inside = ownMaterial(new THREE.MeshStandardMaterial({ color: 0x252729, metalness: .8, roughness: .4, side: THREE.BackSide }));
  // Fine longitudinal tool marks break up the otherwise perfectly smooth reflections.
  const grainWidth = 1024, grainHeight = 256;
  const grainBytes = new Uint8Array(grainWidth * grainHeight * 4);
  const hash = (n: number) => { const v=Math.sin(n*127.1)*43758.5453; return v-Math.floor(v); };
  for (let y = 0; y < grainHeight; y++) for (let x = 0; x < grainWidth; x++) {
    const index = (y * grainWidth + x) * 4, cell = Math.floor(x/128), phase = (x%128)/128;
    const blend = phase*phase*(3-2*phase);
    const streak = THREE.MathUtils.lerp(hash(y*991+cell),hash(y*991+cell+1),blend)-.5;
    const fine = hash(x+y*grainWidth)-.5;
    grainBytes[index] = Math.round(128+streak*60+fine*12);
    grainBytes[index+1] = Math.round(180+streak*36+fine*14);
    grainBytes[index+2] = grainBytes[index+1]; grainBytes[index+3] = 255;
  }
  const grain = new THREE.DataTexture(grainBytes, grainWidth, grainHeight);
  grain.wrapS = grain.wrapT = THREE.RepeatWrapping; grain.repeat.set(4,6);
  grain.generateMipmaps = true; grain.minFilter = THREE.LinearMipmapLinearFilter; grain.magFilter = THREE.LinearFilter;
  grain.anisotropy = Math.min(8,renderer.capabilities.getMaxAnisotropy()); grain.needsUpdate = true; textures.add(grain);
  silver.roughnessMap = grain; silver.bumpMap = grain; silver.bumpScale = .0007;
  const seamMaterial = ownMaterial(createExhaustMetal(grain, 'weld'));
  const frontBanks = [1, -1].map(sign => editOuterBank(huracanBank(sign), FINISHED_FRONT_EDITS, sign).bank);
  const banks = frontBanks.map((bank, index) => editRearBank(bank, FINISHED_REAR_EDITS, index ? -1 : 1, FINISHED_REAR_DRIVER));
  type TubeRecord = { burns: Array<{ s: number; width: number; strength: number }>; route: ExhaustRoute; material: THREE.MeshPhysicalMaterial; geometry: THREE.TubeGeometry; curve: THREE.CurvePath<THREE.Vector3>; group: THREE.Group; radiusAt(t: number): number; length: number; seams: number[]; routeColorAt(t: number): string };
  const coloredTubes: TubeRecord[] = [];
  const badges: ReturnType<typeof createExhaustBadge>[] = [];
  const clampParts: Array<{ group: THREE.Group; rest: THREE.Vector3; direction: THREE.Vector3 }> = [];
  const coloredJunctions: Array<{ mesh: THREE.Mesh; routeMaterial: THREE.Material; surfaceMaterials: THREE.Material[]; branch?: boolean }> = [];
  const routeJunctionMaterials = EXHAUST_ROUTE_COLORS.map(item => ownMaterial(new THREE.MeshStandardMaterial({ color: item.color, roughness: .8 })));
  const up = new THREE.Vector3(0, 1, 0);
  const forward = new THREE.Vector3(0, 0, 1);
  type Point = [number, number, number];

  function geometryFor(route: ExhaustRoute, radius: number, radiusAt: (t: number) => number, wall: number) {
    const curve = route.curve, segments = Math.max(80, Math.ceil(route.length * 34));
    const geometry = ownGeometry(new THREE.TubeGeometry(curve, segments, radius, 32, false));
    const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
    const radial = new THREE.Vector3(), point = new THREE.Vector3();
    for (let i = 0; i <= segments; i++) {
      const t = i / segments, center = curve.getPointAt(t), tangent = curve.getTangentAt(t);
      const delta = .0005, before = Math.max(0, t - delta), after = Math.min(1, t + delta);
      const slope = (radiusAt(after) - radiusAt(before)) / ((after - before) * route.length);
      for (let j = 0; j <= 32; j++) {
        const index = i * 33 + j;
        radial.fromBufferAttribute(normal, index);
        point.copy(center).addScaledVector(radial, radiusAt(t) - wall);
        position.setXYZ(index, point.x, point.y, point.z);
        radial.addScaledVector(tangent, -slope).normalize(); normal.setXYZ(index, radial.x, radial.y, radial.z);
      }
    }
    geometry.computeBoundingSphere(); return geometry;
  }
  function tube(source: Point[] | ExhaustRoute, radius = .19, radiusAt: (t: number) => number = () => radius, routeColorAt: (t: number) => string = () => EXHAUST_ROUTE_COLORS[0].color) {
    const route = Array.isArray(source) ? roundedExhaustRoute(source, radius > .1 ? .34 : .075, radius > .1) : source;
    const geometry = geometryFor(route, radius, radiusAt, 0);
    const surface = radius > .1 ? createExhaustPipeSurface(route, geometry, grain, coloredTubes.length * 1.71) : null;
    const outerMesh = new THREE.Mesh(geometry, surface ? ownMaterial(surface.material) : silver);
    if (surface) { textures.add(surface.texture); textures.add(surface.heatTexture); }
    drawTarget.add(outerMesh);
    if (surface) {
      const wallGeometry = geometryFor(route, radius, radiusAt, .014), innerMesh = new THREE.Mesh(wallGeometry, inside);
      drawTarget.add(innerMesh);
      coloredTubes.push({ burns: surface.burns, route, material: surface.material, geometry, curve: route.curve, group: drawTarget, radiusAt, length: route.length, seams: surface.seams, routeColorAt });
    }
    return route.curve;
  }

  function ring(center: THREE.Vector3, axis: THREE.Vector3, radius: number, thickness: number, material = silver) {
    const mesh = new THREE.Mesh(ownGeometry(new THREE.TorusGeometry(radius, thickness, 8, 40)), material);
    mesh.position.copy(center);
    mesh.quaternion.setFromUnitVectors(forward, axis.clone().normalize());
    drawTarget.add(mesh);
    return mesh;
  }
  const jointCenters: THREE.Vector3[] = [];
  for (let index = 0; index < banks.length; index++) {
    const bank = banks[index];
    drawTarget = index === 0 ? leftBank : rightBank;
    const path = tube(bank.main, .19, bank.radiusAt, t => {
      const index = bank.colorStops.findIndex(stop => t <= stop);
      return EXHAUST_ROUTE_COLORS[index < 0 ? EXHAUST_MAIN_PART_COUNT - 1 : index].color;
    });
    tube(bank.returning, .228, () => .228, t => {
      const index = bank.returnColorStops.findIndex(stop => t <= stop);
      return EXHAUST_ROUTE_COLORS[EXHAUST_MAIN_PART_COUNT + (index < 0 ? EXHAUST_RETURN_PART_COUNT - 1 : index)].color;
    });
    // Both C-return ends share the exact same stations as the main route.
    for (const join of bank.branchJoins) {
      const records = coloredTubes.filter(record => record.group === drawTarget);
      const surfaceMaterials = records.map(record => record.material);
      const geometry = ownGeometry(mapExhaustJoinSurface(mergedExhaustJunction([
        { route: bank.main, t: join.main.t, radiusAt: bank.radiusAt },
        { route: bank.returning, t: join.returning.t, radiusAt: () => .228 },
      ], join.main.position), records.map((record, i) => ({
        route: record.route, geometry: record.geometry, radiusAt: record.radiusAt,
        station: i ? join.returning.t : join.main.t,
      }))));
      const junction = new THREE.Mesh(geometry, surfaceMaterials);
      drawTarget.add(junction);
      coloredJunctions.push({ mesh: junction, surfaceMaterials, routeMaterial: routeJunctionMaterials[EXHAUST_MAIN_PART_COUNT + (join.returning.t === 0 ? 0 : EXHAUST_RETURN_PART_COUNT - 1)], branch: true });
      const center = join.main.position.clone();
      jointCenters.push(center);
    }
    const outlet = path.getPointAt(0), inlet = path.getPointAt(1), inletAxis = path.getTangentAt(1).negate();
    ring(outlet, path.getTangentAt(0), .189, .009);
    for (const [offset, radius, thickness] of [[0, .258, .022], [.06, .248, .014], [.10, .234, .012], [.17, .234, .012], [.24, .234, .012]]) {
      ring(inlet.clone().addScaledVector(inletAxis, offset), inletAxis, radius, thickness);
    }

    const topStraight = bank.main.curve.curves[5];
    const bankGroup = drawTarget;
    // Both clamps sit further inboard, at 30% and 75% of each straight.
    for (const u of [.30, .75]) {
      const clamp = createExhaustClamp(silver);
      clamp.group.position.copy(topStraight.getPointAt(u));
      clamp.group.quaternion.copy(upperPlateFrame(bank).quaternion);
      bankGroup.add(clamp.group);
      clampParts.push({group:clamp.group,rest:clamp.group.position.clone(),direction:upperPlateFrame(bank).normal});
      clamp.geometries.forEach(geometry => ownGeometry(geometry));
    }
    drawTarget = bankGroup;
    // Owner's image order: Special Ops on the left, authenticity on the right.
    // The centre plate's readable face has -X to its right, +X to its left.
    const badge = createExhaustBadge(bank, index === 0 ? 'authenticity' : 'special-ops', grain);
    bankGroup.add(badge.group); badges.push(badge);
    badge.geometries.forEach(geometry => ownGeometry(geometry));
    badge.materials.forEach(material => ownMaterial(material));
    badge.textures.forEach(texture => textures.add(texture));
  }

  for (let i = 0; i < 2; i++) {
    const position = banks[0].merges[i].position;
    const records = banks.map(bank => coloredTubes.find(record => record.route === bank.main)!);
    const surfaceMaterials = records.map(record => record.material);
    const geometry = ownGeometry(mapExhaustJoinSurface(mergedExhaustJunction(banks.map((bank, index) => ({
      route: bank.main, t: bank.merges[i].t, radiusAt: bank.radiusAt,
      offset: new THREE.Vector3(index ? EXHAUST_BANK_OFFSET : -EXHAUST_BANK_OFFSET, 0, 0),
    })), position), records.map((record, index) => ({
      route: record.route, geometry: record.geometry, radiusAt: record.radiusAt,
      station: banks[index].merges[i].t, offset: new THREE.Vector3(index ? EXHAUST_BANK_OFFSET : -EXHAUST_BANK_OFFSET, 0, 0),
    }))));
    const junction = new THREE.Mesh(geometry, surfaceMaterials);
    centre.add(junction);
    coloredJunctions.push({ mesh: junction, surfaceMaterials, routeMaterial: routeJunctionMaterials[banks[0].colorStops.findIndex(stop => banks[0].merges[i].t <= stop)] });
    jointCenters.push(position);
  }
  const upperPlate = createUpperPlate(banks[0], grain);
  centre.add(upperPlate.group);
  upperPlate.geometries.forEach(geometry => ownGeometry(geometry));
  upperPlate.materials.forEach(material => ownMaterial(material));
  upperPlate.textures.forEach(texture => textures.add(texture));
  const gussets = createExhaustGussets(banks[0], grain);
  centre.add(gussets.group);
  gussets.geometries.forEach(geometry => ownGeometry(geometry));
  gussets.materials.forEach(material => ownMaterial(material));

  // Fabrication connections on both finishes; titanium additionally has the
  // same rippled bead along the silver bands on its pie-cut bends.
  const weldMeshes: THREE.Mesh[] = [], titaniumWeldMeshes: THREE.Mesh[] = [];
  for (const record of coloredTubes) {
    const clearOfJoin = (t: number) => !jointCenters.some(joint => record.curve.getPointAt(t).distanceTo(joint) < .40);
    const connections = record.seams.filter(clearOfJoin);
    const burns = record.burns.map(burn => burn.s / record.length).filter(t => clearOfJoin(t) && !record.seams.some(seam => Math.abs(t-seam)*record.length < .045));
    for (const [kind, stations] of [connections, burns].entries()) {
      const parts = stations.map((t, index) => exhaustTubeWeldGeometry(record.route,t,record.radiusAt,index*1.37+(record.group===rightBank?2.4:0),kind?128:256));
      if (!parts.length) continue;
      const geometry = ownGeometry(mergeGeometries(parts,false)!);
      parts.forEach(part => part.dispose());
      const mesh = new THREE.Mesh(geometry,seamMaterial); record.group.add(mesh);
      (kind ? titaniumWeldMeshes : weldMeshes).push(mesh);
    }
  }

  // A broad, soft contact shadow anchors the product without an expensive live shadow pass.
  const shadowCanvas = document.createElement('canvas'); shadowCanvas.width = shadowCanvas.height = 128;
  const shadowContext = shadowCanvas.getContext('2d')!;
  const gradient = shadowContext.createRadialGradient(64, 64, 6, 64, 64, 62);
  gradient.addColorStop(0, '#0000009c'); gradient.addColorStop(.5, '#0000004c'); gradient.addColorStop(1, '#00000000');
  shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 128, 128);
  const shadowTexture = new THREE.CanvasTexture(shadowCanvas); textures.add(shadowTexture);
  const shadow = new THREE.Mesh(ownGeometry(new THREE.PlaneGeometry(9, 5)), ownMaterial(new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false })));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -2.75; scene.add(shadow);

  let routeColorsEnabled = options.initialRouteColors ?? false;
  let selectedFinish: ExhaustFinish = 'titanium';
  function applyAppearance() {
    const titanium = selectedFinish === 'titanium';
    coloredTubes.forEach(({ geometry, material, routeColorAt }) => {
      const segments = geometry.parameters.tubularSegments, rings = geometry.parameters.radialSegments + 1;
      const colors = new Float32Array(geometry.attributes.position.count * 3), color = new THREE.Color();
      for (let i = 0; i <= segments; i++) {
        color.set(routeColorAt(i / segments));
        for (let j = 0; j < rings; j++) color.toArray(colors, (i * rings + j) * 3);
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
      finishExhaustMetal(material, titanium, routeColorsEnabled);
    });
    finishExhaustMetal(seamMaterial, titanium);
    weldMeshes.forEach(mesh => { mesh.visible = !routeColorsEnabled; });
    titaniumWeldMeshes.forEach(mesh => { mesh.visible = titanium && !routeColorsEnabled; });
    coloredJunctions.forEach(({ mesh, routeMaterial, surfaceMaterials, branch }) => {
      // A single-colour union patch obscures the individual C-return parts.
      // Their own tube surfaces provide the connected colour-study view.
      mesh.visible = !routeColorsEnabled || !branch;
      mesh.material = routeColorsEnabled ? routeMaterial : surfaceMaterials;
    });
    silver.color.set(titanium ? '#c0c4c7' : '#c4c8ce');
    upperPlate.finish(titanium);
    badges.forEach(badge => badge.finish(titanium));
    gussets.finish(titanium);
    invalidate();
  }
  function finish(value: ExhaustFinish) { selectedFinish = value; applyAppearance(); if(options.cinematic && !options.reducedMotion) { lightSweepStart=performance.now(); invalidate(); } }

  let frame = 0, disposed = false, visible = !options.cinematic, autoRotate = false, interacting = false;
  let introRequested=Boolean(options.cinematic), introStart: number|null=null, idleElapsed=0, lightSweepStart: number|null=null;
  let idleMotion=Boolean(options.cinematic && options.initialMotion!==false && !options.reducedMotion);
  const plateParts=[upperPlate,...badges].map(part=>({group:part.group,rest:part.group.position.clone(),direction:upperPlateFrame(banks[0]).normal}));
  let isolated = options.initialIsolated ?? false, fit = 1, lastRenderTime = 0;
  rightBank.visible = !isolated; centre.visible = !isolated;
  const referenceOrbit: [number, number, number] = options.cinematic ? [Math.PI+.20,1.47,8.8] : [.65,1.00,11.2];
  const referenceRoll = options.cinematic ? .12 : 1.97;
  const referenceTarget = options.cinematic ? new THREE.Vector3(0,-.20,-.24) : new THREE.Vector3(0,-.35,-.45);
  const target = referenceTarget.clone();
  if (isolated) target.x = -1.35;
  function orbitOrientation(theta: number, phi: number, roll = 0) {
    return new THREE.Quaternion().setFromEuler(new THREE.Euler(-phi, theta, 0, 'YXZ'))
      .multiply(new THREE.Quaternion().setFromAxisAngle(forward, roll));
  }
  function placeCamera(orientation: THREE.Quaternion, radius: number) {
    camera.position.set(0, 0, radius * fit).applyQuaternion(orientation).add(target);
    camera.up.copy(up).applyQuaternion(orientation); camera.lookAt(target);
  }
  placeCamera(orbitOrientation(referenceOrbit[0], referenceOrbit[1], referenceRoll), referenceOrbit[2]);
  const controls = new TrackballControls(camera, canvas);
  controls.target.copy(target);
  controls.rotateSpeed = 1.4; controls.zoomSpeed = .8;
  controls.noPan = true; controls.multiTouchRoll = true;
  controls.staticMoving = true;
  controls.keys = ['', '', ''];
  controls.minDistance = 2.8; controls.maxDistance = 18;
  controls.update();
  type Transition = { start: number; fromOrientation: THREE.Quaternion; toOrientation: THREE.Quaternion; fromRadius: number; toRadius: number; fromTarget: THREE.Vector3; toTarget: THREE.Vector3 };
  let transition: Transition | null = null;
  function invalidate() { if (!frame && !disposed && visible && !document.hidden) frame = requestAnimationFrame(render); }
  function restoreAssembly() {
    leftBank.position.x=-EXHAUST_BANK_OFFSET; rightBank.position.x=EXHAUST_BANK_OFFSET;
    centre.visible=!isolated;
    for(const part of [...clampParts,...plateParts]) part.group.position.copy(part.rest);
    model.rotation.set(0,0,0); model.position.y=0;
  }
  function finishReveal() { introRequested=false; introStart=null; restoreAssembly(); }
  function reveal() {
    autoRotate=false; transition=null; idleElapsed=0;
    isolated=false; rightBank.visible=true; restoreAssembly();
    target.copy(referenceTarget); controls.target.copy(target);
    introRequested=true; introStart=null;
    idleMotion=Boolean(options.cinematic && !options.reducedMotion);
    invalidate();
  }
  function render(now: number) {
    frame = 0;
    if (disposed || !visible || document.hidden) return;
    // The quiet idle is capped at 30 fps; dragging and the entrance stay fluid.
    if(idleMotion && !interacting && !transition && !introRequested && introStart===null && lightSweepStart===null && now-lastRenderTime<32) { invalidate(); return; }
    if(introRequested) {
      introRequested=false; options.onReveal?.();
      if(options.reducedMotion) { restoreAssembly(); placeCamera(orbitOrientation(referenceOrbit[0],referenceOrbit[1],referenceRoll),referenceOrbit[2]); idleMotion=false; }
      else introStart=now;
    }
    if(introStart!==null) {
      const pose=exhaustRevealProgress(now-introStart);
      leftBank.position.x=-EXHAUST_BANK_OFFSET-(1-pose.banks)*.72;
      rightBank.position.x=EXHAUST_BANK_OFFSET+(1-pose.banks)*.72;
      centre.visible=pose.banks>.96 && !isolated;
      for(const part of clampParts) part.group.position.copy(part.rest).addScaledVector(part.direction,(1-pose.clamps)*.28);
      for(const part of plateParts) part.group.position.copy(part.rest).addScaledVector(part.direction,(1-pose.plates)*.20);
      model.rotation.z=(1-pose.camera)*-.16;
      placeCamera(orbitOrientation(referenceOrbit[0]+(1-pose.camera)*.20,referenceOrbit[1]-(1-pose.camera)*.10,referenceRoll+(1-pose.camera)*.06),referenceOrbit[2]*(1+(1-pose.camera)*.12));
      if(pose.complete) { introStart=null; restoreAssembly(); idleElapsed=0; }
    }
    if (transition) {
      const p = options.reducedMotion ? 1 : Math.min((now - transition.start) / 720, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      target.lerpVectors(transition.fromTarget, transition.toTarget, ease);
      controls.target.copy(target);
      placeCamera(transition.fromOrientation.clone().slerp(transition.toOrientation, ease), THREE.MathUtils.lerp(transition.fromRadius, transition.toRadius, ease));
      if (p === 1) transition = null;
    }
    const delta = Math.min((now - lastRenderTime) / 1000, .05); lastRenderTime = now;
    if(idleMotion && introStart===null && !transition && !interacting) {
      idleElapsed+=delta*1000;
      model.rotation.z=Math.sin(idleElapsed*.00026)*.045;
      model.rotation.x=Math.sin(idleElapsed*.00019)*.012;
      model.position.y=Math.sin(idleElapsed*.00030)*.014;
    }
    if(lightSweepStart!==null) {
      const progress=Math.min((now-lightSweepStart)/900,1), sweep=Math.sin(progress*Math.PI);
      key.position.x=-3+sweep*1.2; key.intensity=1.7+sweep*.22;
      if(progress===1) lightSweepStart=null;
    }
    if (autoRotate && !transition) {
      const rotation = new THREE.Quaternion().setFromAxisAngle(up, .13 * delta);
      camera.position.sub(controls.target).applyQuaternion(rotation).add(controls.target);
      camera.up.applyQuaternion(rotation);
    }
    controls.update(); target.copy(controls.target);
    renderer.render(scene, camera);
    if (transition || autoRotate || interacting || introRequested || introStart!==null || idleMotion || lightSweepStart!==null) invalidate();
  }
  function view(value: ExhaustView) {
    if(options.cinematic) { finishReveal(); idleMotion=false; }
    autoRotate = false;
    controls.update();
    const views: Record<ExhaustView, { orbit: [number, number, number]; roll?: number; target: THREE.Vector3 }> = {
      overview: { orbit: referenceOrbit, roll: referenceRoll, target: referenceTarget.clone() },
      welds: { orbit: [-2.20, .16, 4.4], target: new THREE.Vector3(-1.85, -1.15, -1.05) },
      reverse: { orbit: options.cinematic ? [.18,1.20,8.5] : [Math.PI + .15,.28,8.1], roll:options.cinematic?-.10:0, target: new THREE.Vector3(0,-.35,-.45) },
      front: { orbit: [0, .25, 10.2], target: new THREE.Vector3(0, -.35, -.45) },
      entry: { orbit: [-2.154, .9273, 4.4], roll: -.8816, target: new THREE.Vector3(2.45, .70, -.10) },
    };
    const destination = views[value];
    if (isolated && value !== 'welds' && value !== 'entry') destination.target.x = -1.35;
    transition = {
      start: performance.now(), fromOrientation: camera.quaternion.clone(),
      toOrientation: orbitOrientation(destination.orbit[0], destination.orbit[1], destination.roll),
      fromRadius: camera.position.distanceTo(controls.target) / fit, toRadius: destination.orbit[2],
      fromTarget: controls.target.clone(), toTarget: destination.target,
    };
    invalidate();
  }
  function beginInteraction() { if(options.cinematic) { finishReveal(); idleMotion=false; } interacting = true; autoRotate = false; transition = null; options.onInteract(); controls.handleResize(); invalidate(); }
  function endInteraction() { interacting = false; invalidate(); }
  controls.addEventListener('start', beginInteraction);
  controls.addEventListener('end', endInteraction);
  controls.addEventListener('change', invalidate);
  const resize = new ResizeObserver(() => {
    const width = host.clientWidth, height = host.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
    const nextFit = Math.max(1, 1.25 / camera.aspect);
    camera.position.sub(controls.target).multiplyScalar(nextFit / fit).add(controls.target);
    fit = nextFit; controls.minDistance = 2.8 * fit; controls.maxDistance = 18 * fit;
    controls.handleResize(); invalidate();
  });
  resize.observe(host);
  const intersection = new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if(!visible) lastRenderTime=0;
    if (!visible && frame) { cancelAnimationFrame(frame); frame = 0; } else invalidate();
  }, {threshold:options.cinematic ? .16 : 0});
  intersection.observe(host);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else invalidate(); };
  document.addEventListener('visibilitychange', visibility);
  function keyboard(event: KeyboardEvent) {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home'].includes(event.key)) return;
    event.preventDefault(); if(options.cinematic) { finishReveal(); idleMotion=false; } options.onInteract(); autoRotate = false; transition = null;
    if (event.key === 'Home') { view('overview'); return; }
    const horizontal = event.key === 'ArrowLeft' || event.key === 'ArrowRight';
    const axis = (horizontal ? up.clone() : new THREE.Vector3(1, 0, 0)).applyQuaternion(camera.quaternion);
    const angle = event.key === 'ArrowLeft' || event.key === 'ArrowUp' ? -.14 : .14;
    const rotation = new THREE.Quaternion().setFromAxisAngle(axis, angle);
    camera.position.sub(controls.target).applyQuaternion(rotation).add(controls.target);
    camera.up.applyQuaternion(rotation); invalidate();
  }
  const contextLost = (event: Event) => { event.preventDefault(); autoRotate = false; cancelAnimationFrame(frame); frame = 0; options.onError(); };
  canvas.addEventListener('keydown', keyboard); canvas.addEventListener('webglcontextlost', contextLost);
  finish('titanium');
  lightSweepStart=null;

  return {
    view, finish, reveal,
    routeColors(value) { routeColorsEnabled = value; applyAppearance(); },
    isolate(value) { isolated = value; rightBank.visible = !value; centre.visible = !value; invalidate(); },
    rotate(value) {
      if(options.cinematic) { finishReveal(); idleMotion=value&&!options.reducedMotion; autoRotate=false; }
      else autoRotate=value;
      transition = null; invalidate();
    },
    zoom(direction) {
      if(options.cinematic) { finishReveal(); idleMotion=false; options.onInteract(); }
      transition = null;
      const eye = camera.position.clone().sub(controls.target);
      camera.position.copy(controls.target).add(eye.setLength(THREE.MathUtils.clamp(eye.length() * (direction > 0 ? 1.15 : 1 / 1.15), controls.minDistance, controls.maxDistance)));
      invalidate();
    },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); intersection.disconnect();
      document.removeEventListener('visibilitychange', visibility);
      controls.removeEventListener('start', beginInteraction); controls.removeEventListener('end', endInteraction); controls.removeEventListener('change', invalidate); controls.dispose();
      canvas.removeEventListener('keydown', keyboard); canvas.removeEventListener('webglcontextlost', contextLost);
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); textures.forEach(t => t.dispose());
      environment.dispose(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    },
  };
}
