import * as T from 'three';

export type Upgrade = { name: string; object: T.Group; offset: T.Vector3; step: number };
const V = (x: number, y: number, z: number) => new T.Vector3(x, y, z);

/** Hand-built visual approximation. Coordinates describe the study, not verified fitment. */
export function createPurosangue() {
  const car = new T.Group(); car.name = 'Purosangue visual prototype';
  const upgrades: Upgrade[] = [];
  const paint = new T.MeshPhysicalMaterial({ color: 0x9b080c, metalness: .52, roughness: .26, clearcoat: 1, clearcoatRoughness: .12 });
  const carbon = new T.MeshPhysicalMaterial({ color: 0x181c20, metalness: .58, roughness: .32, clearcoat: .65 });
  const black = new T.MeshStandardMaterial({ color: 0x080b0e, roughness: .48, metalness: .2 });
  const glass = new T.MeshPhysicalMaterial({ color: 0x0d1820, metalness: .35, roughness: .12, clearcoat: 1 });
  const silver = new T.MeshStandardMaterial({ color: 0x89939b, metalness: 1, roughness: .25 });
  const tyre = new T.MeshStandardMaterial({ color: 0x111214, roughness: .85 });
  const lamp = new T.MeshStandardMaterial({ color: 0xe7efff, emissive: 0xd1e1ff, emissiveIntensity: 2 });
  const redLamp = new T.MeshStandardMaterial({ color: 0x990300, emissive: 0xee170c, emissiveIntensity: 1.5 });
  const brake = new T.MeshStandardMaterial({ color: 0xeac131, metalness: .4, roughness: .4 });
  const mats = { paint, carbon, black, glass, silver, tyre, lamp, redLamp, brake };
  const mesh = (parent: T.Object3D, geometry: T.BufferGeometry, material: T.Material, name = '') => {
    const object = new T.Mesh(geometry, material); object.name = name; object.castShadow = true; object.receiveShadow = true; parent.add(object); return object;
  };
  const box = (parent: T.Object3D, size: number[], pos: number[], material: T.Material) => {
    const m = mesh(parent, new T.BoxGeometry(...size as [number, number, number]), material); m.position.set(...pos as [number, number, number]); return m;
  };
  const curve = (parent: T.Object3D, points: T.Vector3[], radius: number, material: T.Material, segments = 40) => mesh(parent, new T.TubeGeometry(new T.CatmullRomCurve3(points), segments, radius, 6, false), material);
  const patch = (parent: T.Object3D, rows: number, cols: number, point: (u: number, v: number) => T.Vector3, material: T.Material, name = '') => {
    const vertices: number[] = [], indices: number[] = [];
    for (let i = 0; i <= rows; i++) for (let j = 0; j <= cols; j++) vertices.push(...point(i / rows, j / cols).toArray());
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
      const a = i * (cols + 1) + j, b = a + cols + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(vertices, 3)); g.setIndex(indices); g.computeVertexNormals();
    return mesh(parent, g, material, name);
  };
  // Closed double-sided surfaces keep the visual prototype legible at any orbit angle.
  Object.values(mats).forEach(m => { m.side = T.DoubleSide; });
  const stations = [
    [-2.47, .79, .85], [-2.25, .97, .98], [-1.65, 1.10, 1.01], [-1.04, 1.12, .94],
    [-.3, 1.08, .93], [.5, 1.09, .96], [1.4, 1.14, 1.02], [1.98, 1.07, 1.00], [2.43, .97, .91],
  ];
  function interpolate(points: number[][], x: number, column: number) {
    let i = 0; while (i < points.length - 2 && x > points[i + 1][0]) i++;
    const a = points[i], b = points[i + 1], before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 2)];
    const span = b[0] - a[0], t = T.MathUtils.clamp((x - a[0]) / span, 0, 1);
    const m0 = (b[column] - before[column]) / (b[0] - before[0]) * span;
    const m1 = (after[column] - a[column]) / (after[0] - a[0]) * span;
    return (2*t*t*t-3*t*t+1)*a[column] + (t*t*t-2*t*t+t)*m0 + (-2*t*t*t+3*t*t)*b[column] + (t*t*t-t*t)*m1;
  }
  const profile = (x: number, column: number) => interpolate(stations, x, column);
  const wheelXs = [-1.47, 1.43];
  const bottom = (x: number) => Math.max(.32, ...wheelXs.map(c => Math.abs(x - c) < .475 ? .46 + Math.sqrt(.475 ** 2 - (x - c) ** 2) : .32));
  patch(car, 160, 36, (u, v) => {
    const x = -2.47 + u * 4.9, z = (v * 2 - 1) * profile(x, 2);
    return V(x, profile(x, 1) - .13 * Math.pow(Math.abs(v * 2 - 1), 3), z);
  }, paint, 'Bonnet and shoulder surface');
  for (const s of [-1, 1]) {
    patch(car, 220, 14, (u, v) => {
      const x = -2.47 + u * 4.9, top = profile(x, 1) - .13;
      const y = T.MathUtils.lerp(Math.min(bottom(x), top - .005), top, v);
      const z = s * (profile(x, 2) - .055 * Math.sin(Math.PI * v) - .08 * (1 - v));
      return V(x, y, z);
    }, paint, 'Body side with open wheel arches');
    // Factory arch edge, distinct from removable ESTESO flare.
    wheelXs.forEach(x => {
      const points = Array.from({ length: 35 }, (_, i) => { const a = i / 34 * Math.PI; return V(x + Math.cos(a) * .478, .46 + Math.sin(a) * .478, s * (profile(x, 2) + .005)); });
      curve(car, points, .015, black);
    });
    // Door shut lines and sill; rear door has a rear-hinged silhouette.
    [-.58, .47].forEach(x => curve(car, [V(x, 1.03, s * .947), V(x - .025, .81, s * .929), V(x + .02, .4, s * .91)], .005, black));
    curve(car, [V(-.83, .38, s * .91), V(0, .35, s * .905), V(.87, .39, s * .945)], .035, carbon);
    [-.70, .65].forEach(x => box(car, [.14, .018, .019], [x, .995, s * .956], carbon));
    // Small front-quarter vent and mirror.
    const vent = box(car, [.29, .08, .019], [-.89, 1.015, s * .95], black); vent.rotation.z = -.35;
    curve(car, [V(-.64, 1.22, s * .78), V(-.67, 1.21, s * 1.03)], .025, carbon);
    const mirror = mesh(car, new T.SphereGeometry(1, 20, 12), paint); mirror.position.set(-.68, 1.24, s * 1.10); mirror.scale.set(.145, .065, .10);
  }
  // Glasshouse loft. The shoulder stays low while the roof has Purosangue's fastback arc.
  const cabin = [
    [-1.00, 1.115, .74], [-.72, 1.33, .69], [-.38, 1.55, .635], [.1, 1.60, .645], [.75, 1.58, .65], [1.12, 1.46, .65], [1.55, 1.25, .72], [1.79, 1.12, .78],
  ];
  const cabinValue = (x: number, k: number) => interpolate(cabin, x, k);
  const cap = (x: number, t: number) => V(x, cabinValue(x, 1) + .025 * (1 - t * t), t * cabinValue(x, 2));
  patch(car, 24, 18, (u, v) => cap(-1 + u * .64, v * 2 - 1), glass, 'Windscreen');
  patch(car, 32, 18, (u, v) => cap(-.36 + u * 1.18, v * 2 - 1), paint, 'Roof');
  patch(car, 28, 18, (u, v) => cap(.82 + u * .97, v * 2 - 1), glass, 'Rear screen');
  for (const s of [-1, 1]) {
    patch(car, 70, 12, (u, v) => {
      const x = -1 + u * 2.79;
      return V(x, T.MathUtils.lerp(1.105, cabinValue(x, 1), v), s * T.MathUtils.lerp(.85, cabinValue(x, 2), v));
    }, glass, 'Side glazing');
    curve(car, cabin.map(([x, y, w]) => V(x, y, s * w)), .024, paint);
    curve(car, [V(-1, 1.11, s * .85), V(.35, 1.103, s * .85), V(1.79, 1.12, s * .85)], .025, paint);
    // A, B and C pillars sit over the glass surfaces.
    curve(car, [V(-1.0, 1.115, s * .85), V(-.72, 1.33, s * .69), V(-.38, 1.55, s * .635)], .037, paint);
    curve(car, [V(.37, 1.11, s * .85), V(.37, 1.59, s * .65)], .025, black);
    curve(car, [V(1.43, 1.115, s * .85), V(1.15, 1.44, s * .66), V(.89, 1.54, s * .65)], .052, paint);
  }
  // Front: low dark intake, divided light signature and sculpted bonnet creases.
  patch(car, 22, 36, (u, v) => {
    const z = (v * 2 - 1) * (.81 + .04 * u);
    return V(-2.46 - .045 * Math.sin(v * Math.PI) + .09 * (1 - u), .33 + u * .46, z);
  }, paint, 'Sculpted front bumper');
  patch(car, 16, 30, (u, v) => {
    const z = (v * 2 - 1) * (.47 + .13 * u);
    return V(-2.50 + .055 * (1 - u) + .035 * z * z, .37 + u * .28, z);
  }, black, 'Tapered central lower grille');
  for (let i = 0; i < 21; i++) {
    const z = -.48 + i * .048;
    curve(car, [V(-2.487, .41, z), V(-2.504, .61, z + .035)], .002, carbon, 2);
  }
  for (const y of [.42, .465, .51, .555, .60]) curve(car, [V(-2.50, y, -.48), V(-2.51, y, 0), V(-2.50, y, .48)], .002, carbon, 12);
  // Separate corner ducts and a narrow dark band underneath the running lights.
  for (const side of [-1, 1]) {
    patch(car, 12, 12, (u, v) => V(-2.463 + .05 * (1-u), .37 + u * .25, side * (.64 + v * (.15 - .035*u))), black);
    curve(car, [V(-2.50, .782, 0), V(-2.44, .815, side*.47), V(-2.32, .85, side*.78), V(-2.16, .89, side*.94)], .026, black);
  }
  for (const s of [-1, 1]) {
    curve(car, [V(-2.43, .82, s * .27), V(-2.35, .865, s * .65), V(-2.16, .90, s * .935)], .02, lamp);
    curve(car, [V(-2.33, .67, s * .70), V(-2.27, .685, s * .89)], .028, silver);
    curve(car, [V(-2.13, .96, s * .53), V(-1.64, 1.1, s * .61), V(-1.08, 1.12, s * .64)], .008, paint);
    const badge = box(car, [.045, .065, .01], [-1.04, 1.005, s * .965], brake); badge.rotation.z = -.1;
  }
  curve(car, [V(-2.46, .34, -.87), V(-2.51, .32, 0), V(-2.46, .34, .87)], .035, carbon);
  // Rear tailgate and four thin lamp elements, not circular generic tail lights.
  patch(car, 16, 28, (u, v) => V(2.40 + .025 * Math.sin(v * Math.PI), .35 + u * .60, (v * 2 - 1) * (.89 + .03 * u)), paint, 'Tailgate');
  box(car, [.02, .23, 1.69], [2.445, .40, 0], carbon);
  for (const s of [-1, 1]) {
    curve(car, [V(2.445, .90, s * .24), V(2.446, .91, s * .54), V(2.32, .90, s * .88)], .024, redLamp);
    curve(car, [V(2.44, .854, s * .31), V(2.44, .845, s * .58), V(2.36, .85, s * .79)], .009, redLamp);
  }
  for (let i = -2; i <= 2; i++) box(car, [.18, .12, .013], [2.45, .30, i * .21], carbon);
  box(car, [3.8, .08, 1.5], [0, .29, 0], black);

  function upgrade(name: string, offset: T.Vector3, step: number) {
    const object = new T.Group(); object.name = name; car.add(object); upgrades.push({ name, object, offset, step }); return object;
  }
  // Widebody arches are individually named, with an outward lip and visibly added width.
  for (const s of [-1, 1]) for (const x of wheelXs) {
    const group = upgrade(`ESTESO ${x < 0 ? 'front' : 'rear'} ${s > 0 ? 'left' : 'right'} arch`, V(x < 0 ? -.35 : .35, .24, s * .62), 0);
    patch(group, 64, 8, (u, v) => {
      const a = -.16 + u * (Math.PI + .32), r = .482 + v * .085;
      return V(x + Math.cos(a) * r, .46 + Math.sin(a) * r, s * (profile(x, 2) + .01 + .12 * Math.sin(v * Math.PI / 2)));
    }, paint);
    curve(group, Array.from({ length: 40 }, (_, i) => { const a = -.16 + i / 39 * (Math.PI + .32); return V(x + Math.cos(a) * .484, .46 + Math.sin(a) * .484, s * (profile(x, 2) + .025)); }), .014, carbon);
  }
  for (const s of [-1, 1]) {
    const group = upgrade(`Rear side-panel insert ${s > 0 ? 'left' : 'right'}`, V(0, .14, s * .9), 1);
    patch(group, 26, 6, (u, v) => V(.15 + u * .85, .34 + v * (.07 + .06 * u), s * (.945 + .075 * Math.sin(v * Math.PI / 2))), carbon);
  }
  const roofSpoiler = upgrade('ESTESO roof spoiler RACE', V(.15, .9, 0), 2);
  patch(roofSpoiler, 36, 10, (u, v) => {
    const z = (u * 2 - 1) * .77;
    return V(1.12 + v * .26 + .09 * Math.abs(z), 1.50 + .085 * v - .07 * (z / .77) ** 2, z);
  }, carbon);
  for (const s of [-1, 1]) curve(roofSpoiler, [V(1.15, 1.44, s * .77), V(1.38, 1.515, s * .77)], .02, carbon);
  const lip = upgrade('Three-piece rear spoiler lip', V(.7, .42, 0), 3);
  [-1, 0, 1].forEach(piece => {
    const a = piece === -1 ? -.93 : piece === 0 ? -.70 : .72;
    const b = piece === -1 ? -.72 : piece === 0 ? .70 : .93;
    patch(lip, 24, 6, (u, v) => { const z = T.MathUtils.lerp(a, b, u); return V(2.29 + .13 * v - .12 * z * z, 1.00 + .055 * v, z); }, carbon);
  });

  function wheel(parent: T.Group, x: number, s: number, detailed: boolean) {
    const group = new T.Group(); group.position.set(x, .445, s * 1.035); parent.add(group);
    // Local z points outwards for both sides.
    if (s < 0) group.rotation.y = Math.PI;
    const radial = new T.LatheGeometry([new T.Vector2(.325, -.14), new T.Vector2(.365, -.145), new T.Vector2(.405, -.11), new T.Vector2(.412, -.08), new T.Vector2(.412, .075), new T.Vector2(.405, .11), new T.Vector2(.365, .135), new T.Vector2(.325, .13)], 64);
    const rubber = mesh(group, radial, tyre); rubber.rotation.x = Math.PI / 2;
    const barrel = mesh(group, new T.CylinderGeometry(.325, .325, .235, 64, 1, true), silver); barrel.rotation.x = Math.PI / 2;
    for (const z of [-.105, .12]) { const rim = mesh(group, new T.TorusGeometry(.326, .012, 8, 64), silver); rim.position.z = z; }
    const hub = mesh(group, new T.CylinderGeometry(.061, .061, .055, 24), black); hub.rotation.x = Math.PI / 2; hub.position.z = .088;
    const cap = mesh(group, new T.CircleGeometry(.028, 24), detailed ? black : brake); cap.position.z = .118;
    const count = detailed ? 10 : 5;
    for (let i = 0; i < count; i++) {
      const angle = i / count * Math.PI * 2 + .15;
      const shape = new T.Shape(); shape.moveTo(-.025, .045); shape.lineTo(-.016, .105); shape.lineTo(-.01, .318); shape.lineTo(.009, .323); shape.lineTo(.012, .115); shape.lineTo(.035, .055); shape.closePath();
      const spoke = mesh(group, new T.ExtrudeGeometry(shape, { depth: .02, bevelEnabled: true, bevelSize: .004, bevelThickness: .004, bevelSegments: 2, steps: 1 }), detailed ? silver : carbon); spoke.rotation.z = angle; spoke.position.z = .082;
    }
    if (detailed) {
      const disc = mesh(group, new T.CylinderGeometry(.255, .255, .017, 48), silver); disc.rotation.x = Math.PI / 2; disc.position.z = -.04;
      box(group, [.08, .19, .07], [.215, .03, -.005], brake);
      for (const z of [-.055, .025, .08]) { const groove = mesh(group, new T.TorusGeometry(.412, .002, 4, 64), black); groove.position.z = z; }
    }
    return group;
  }
  const stockWheels = new T.Group(); stockWheels.name = 'Base wheel placeholders'; car.add(stockWheels);
  for (const s of [-1, 1]) for (const x of wheelXs) {
    wheel(stockWheels, x, s, false);
    const group = upgrade(`NF10 ${x < 0 ? 'front' : 'rear'} ${s > 0 ? 'left' : 'right'}`, V(0, .15, s * 1.25), 4);
    wheel(group, x, s, true);
  }
  for (const s of [-1, 1]) {
    const group = upgrade(`Twin tailpipe assembly ${s > 0 ? 'left' : 'right'}`, V(.95, .05, s * .15), 5);
    const surround = mesh(group, new T.SphereGeometry(1, 24, 16), carbon); surround.position.set(2.455, .43, s * .64); surround.scale.set(.035, .14, .25);
    for (const dz of [-.105, .105]) {
      const tube = mesh(group, new T.CylinderGeometry(.079, .079, .23, 40, 1, true), black); tube.rotation.z = Math.PI / 2; tube.position.set(2.49, .43, s * .64 + dz);
      const edge = mesh(group, new T.TorusGeometry(.079, .006, 8, 40), silver); edge.rotation.y = Math.PI / 2; edge.position.set(2.609, .43, s * .64 + dz);
      const inside = mesh(group, new T.CircleGeometry(.072, 32), black); inside.rotation.y = Math.PI / 2; inside.position.set(2.48, .43, s * .64 + dz);
    }
  }
  function assemble(progress: number) {
    upgrades.forEach(({ object, offset, step }) => {
      const t = T.MathUtils.smoothstep(progress, step / 6, (step + 1) / 6);
      object.position.copy(offset).multiplyScalar(1 - t);
    });
    stockWheels.visible = progress < .80;
  }
  assemble(1);
  return { car, upgrades, assemble, materials: mats };
}
