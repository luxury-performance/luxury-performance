import * as THREE from 'three';
import type { ExhaustRoute } from './valvetronic-exhaust-routing';

/** Fabrication seams are curve connections, never regularly spaced bend slices. */
export function exhaustSectionSeams(route: ExhaustRoute) {
  return route.curve.getCurveLengths().slice(0, -1).map(distance => distance / route.length)
    .filter((t, i, all) => t * route.length > .025 && (1 - t) * route.length > .025 && (!i || (t - all[i - 1]) * route.length > .04));
}

const metalNoise = /* glsl */`
float exHash(vec2 p) { return fract(sin(dot(p, vec2(127.1,311.7))) * 43758.5453); }
float exNoise(vec2 p) {
  vec2 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(exHash(i),exHash(i+vec2(1,0)),f.x),mix(exHash(i+vec2(0,1)),exHash(i+vec2(1,1)),f.x),f.y);
}
uniform float exTitanium;
uniform float exRouteColors;
uniform float exSeed;
uniform vec3 exSteel;
uniform vec3 exBronze;
uniform vec3 exPurple;
uniform vec3 exSilver;
varying vec2 exUv;
varying vec3 exPosition;
`;

type MetalKind = 'sheet' | 'pipe' | 'weld';

export function createExhaustMetal(grain: THREE.Texture, kind: MetalKind = 'sheet', vertexColors = false, seed = 0, field?: THREE.Texture, length = 1, heatField?: THREE.Texture) {
  const material = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 1, roughness: .26, clearcoat: .06, clearcoatRoughness: .35,
    roughnessMap: grain, bumpMap: grain, bumpScale: .0008, vertexColors,
    iridescence: .3, iridescenceIOR: 1.7, iridescenceThicknessRange: [85, 190],
  });
  const uniforms = {
    exTitanium: { value: 1 }, exRouteColors: { value: 0 }, exSeed: { value: seed },
    exSteel: { value: new THREE.Color('#b4bbc0') },
    exBronze: { value: new THREE.Color('#a78e50') },
    exPurple: { value: new THREE.Color('#655087') },
    exSilver: { value: new THREE.Color('#bdc2c8') },
    exWeldField: { value: field }, exLength: { value: length }, exHeatField: { value: heatField },
  };
  material.userData.exhaustFinish = uniforms;
  material.customProgramCacheKey = () => `exhaust-buffed-metal-v11-${kind}`;
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader.replace('#include <common>', `#include <common>
      varying vec2 exUv; varying vec3 exPosition;
      ${kind === 'pipe' ? 'attribute float exhaustBend; varying float exBend;' : ''}`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
      exUv=uv; exPosition=position; ${kind === 'pipe' ? 'exBend=exhaustBend;' : ''}`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <common>', `#include <common>\n${metalNoise}
      ${kind === 'pipe' ? 'uniform sampler2D exWeldField; uniform sampler2D exHeatField; uniform float exLength; varying float exBend;' : ''}`);
    const pipeColor = /* glsl */`
      float exS=exUv.x*exLength, exTheta=exUv.y*6.28318530718;
      float exVariation=exNoise(vec2(exS*.8+exSeed,cos(exTheta)*1.6));
      // A subdued metal base; oxide colours mostly live in the reflections.
      vec3 exBase=mix(exBronze,exPurple,.12+.28*exVariation+.13*(.5+.5*sin(exTheta+exS*.6)));
      float exVein=1.0-smoothstep(.065,.14,abs(sin(exTheta*1.5+exS*.13+exVariation*.35)));
      exBase=mix(exBase,exPurple,exVein*.42);
      vec4 exHeatData=texture2D(exHeatField,vec2(clamp(exUv.x,.000122,.999878),.5));
      float exDistanceFromBurn=exHeatData.g*.16;
      float exWidth=exHeatData.b*.1*(.64+.70*exNoise(vec2(exS*11.0,cos(exTheta)*3.0+exSeed)));
      float exStrength=exHeatData.a*(.38+.62*exNoise(vec2(exS*23.0,sin(exTheta)*4.0+exSeed)));
      float exSilverHeat=exp(-pow(exDistanceFromBurn/max(.004,exWidth*1.35),2.0));
      float exPurpleHeat=exp(-pow((exDistanceFromBurn-exWidth*1.40)/max(.004,exWidth*.72),2.0));
      vec3 exHeat=vec3(exSilverHeat*exStrength,0.0,exPurpleHeat*exStrength);
      // Translucent-looking oxide tint over reflective metal: feathered,
      // locally eroded heat fronts, without opaque stripes or chevrons.
      vec3 exTitaniumColor=mix(exBase,exPurple,exHeat.b*.55);
      exTitaniumColor=mix(exTitaniumColor,exSilver,exHeat.r*.67);
      vec2 exPacked=texture2D(exWeldField,vec2(clamp(exUv.x,.000122,.999878),.5)).rg;
      float exDistance=dot(exPacked,vec2(65280.0,255.0))/65535.0*.16;
      float exHalo=exp(-pow(exDistance/.029,2.0));
      vec3 exStainlessColor=mix(exSteel,exBronze,exHalo*.13);
      exTitaniumColor=mix(exTitaniumColor,exSilver,exHalo*.13);
      vec3 exMetal=mix(exStainlessColor,exTitaniumColor,exTitanium);
      exMetal*=.97+.045*exVariation;
      if(exRouteColors<.5) diffuseColor.rgb=exMetal;
    `;
    const sheetColor = /* glsl */`
      float exVariation=exNoise(exPosition.xy*3.3+exSeed);
      float exHue=.16+.30*(.5+.5*sin(exPosition.x*2.7+exPosition.y*3.0+exVariation));
      vec3 exSheetBase=mix(exBronze,exPurple,.14+exHue*.4);
      vec3 exMetal=mix(exSteel,exSheetBase,exTitanium);
      diffuseColor.rgb*=exMetal*(.97+.045*exVariation);
    `;
    const weldColor = /* glsl */`
      float exVariation=exNoise(exPosition.xy*38.0+exPosition.z*7.0);
      vec3 exMetal=mix(mix(exSteel,exBronze,.09),mix(exSilver,exBronze,.34+exVariation*.22),exTitanium);
      diffuseColor.rgb*=exMetal;
    `;
    shader.fragmentShader = shader.fragmentShader.replace('#include <color_fragment>', `#include <color_fragment>\n${kind === 'pipe' ? pipeColor : kind === 'sheet' ? sheetColor : weldColor}`)
      .replace('#include <roughnessmap_fragment>', `#include <roughnessmap_fragment>
      if(exRouteColors<.5) roughnessFactor=clamp(${kind === 'weld' ? '.20' : kind === 'pipe' ? '.135' : '.26'}+exVariation*.035+(texelRoughness.g-.7)*.10${kind === 'pipe' ? '-exHalo*.012+exHeat.r*.025+exBend*.018*exNoise(vec2(exS*85.0,exTheta*7.0))' : ''},.12,.31);`);
    shader.fragmentShader = shader.fragmentShader.replace('#include <lights_physical_fragment>', `#include <lights_physical_fragment>
      #ifdef USE_IRIDESCENCE
        material.iridescence=exTitanium*(1.0-exRouteColors)*${kind === 'pipe' ? '(.07+exHeat.b*.18+exHeat.g*.06)' : '.16'};
        material.iridescenceThickness=${kind === 'pipe' ? '110.0+exVariation*25.0+exHeat.b*65.0' : '115.0+exVariation*30.0'};
      #endif`);
    if (kind === 'pipe') shader.fragmentShader = shader.fragmentShader.replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
      float exBuff=.000055*exBend*exNoise(vec2(exS*120.0,exTheta*28.0));
      if(exRouteColors<.5) normal=perturbNormalArb(-vViewPosition,normal,vec2(dFdx(exBuff),dFdy(exBuff)),faceDirection);
    `);
  };
  return material;
}

export function finishExhaustMetal(material: THREE.MeshPhysicalMaterial, titanium: boolean, routeColors = false) {
  const uniforms = material.userData.exhaustFinish;
  uniforms.exTitanium.value = titanium ? 1 : 0;
  uniforms.exRouteColors.value = routeColors ? 1 : 0;
  material.metalness = routeColors ? 0 : 1;
  material.roughness = routeColors ? .8 : .26;
  material.clearcoat = routeColors ? 0 : .06;
  material.bumpScale = routeColors ? 0 : .0008;
}

export function createExhaustPipeSurface(route: ExhaustRoute, geometry: THREE.TubeGeometry, grain: THREE.Texture, seed: number) {
  const seams = exhaustSectionSeams(route), size = 4096, bytes = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const t = (i + .5) / size;
    const distance = Math.min(.16, ...seams.map(seam => Math.abs(t - seam) * route.length));
    const packed = Math.round(distance / .16 * 65535);
    bytes[i * 4] = packed >> 8; bytes[i * 4 + 1] = packed & 255; bytes[i * 4 + 3] = 255;
  }
  const texture = new THREE.DataTexture(bytes, size, 1); texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false; texture.needsUpdate = true;
  const { tubularSegments: segments, radialSegments } = geometry.parameters;
  const bend = new Float32Array(geometry.getAttribute('position').count);
  for (let i = 0; i <= segments; i++) {
    const t = i / segments, delta = .035 / route.length;
    const a = route.curve.getTangentAt(Math.max(0,t-delta)), b = route.curve.getTangentAt(Math.min(1,t+delta));
    const curvature = Math.acos(THREE.MathUtils.clamp(a.dot(b),-1,1)) / .07;
    const value = THREE.MathUtils.smoothstep(curvature,.25,1.2);
    bend.fill(value, i * (radialSegments + 1), (i + 1) * (radialSegments + 1));
  }
  geometry.setAttribute('exhaustBend', new THREE.BufferAttribute(bend,1));
  // Individual burn positions, widths and intensity for each bend. No repeated
  // colour ramp or fixed-pitch stripe is wrapped around the entire route.
  const random = (n: number) => { const v = Math.sin(n * 127.1 + seed * 31.7) * 43758.5453; return v - Math.floor(v); };
  const burns: Array<{ s: number; width: number; strength: number }> = [];
  let offset = 0;
  route.curve.curves.forEach((curve, index) => {
    const span = curve.getLength(), angle = curve.getTangentAt(.05).angleTo(curve.getTangentAt(.95));
    if (angle > .10) {
      let s = .05 + random(index * 11) * .07, step = 0;
      while (s < span - .035) {
        const n = index * 41 + step++;
        burns.push({ s: offset + s, width: .014 + random(n + 5) * .027, strength: .38 + random(n + 6) * .56 });
        s += .10 + random(n + 7) * .16;
      }
    }
    offset += span;
  });
  const heat = new Uint8Array(size * 4);
  for (let i = 0; i < size; i++) {
    const station = (i + .5) / size * route.length;
    let distance = .16, width = .02, strength = 0;
    for (const burn of burns) {
      const delta = Math.abs(station-burn.s);
      if(delta<distance) { distance=delta; width=burn.width; strength=burn.strength; }
    }
    heat[i*4]=0; heat[i*4+1]=Math.round(distance/.16*255);
    heat[i*4+2]=Math.round(width/.1*255); heat[i*4+3]=Math.round(strength*255);
  }
  const heatTexture = new THREE.DataTexture(heat,size,1); heatTexture.minFilter=heatTexture.magFilter=THREE.LinearFilter;
  heatTexture.generateMipmaps=false; heatTexture.needsUpdate=true;
  return { material: createExhaustMetal(grain,'pipe',true,seed,texture,route.length,heatTexture), texture, heatTexture, seams, burns };

}

/** A single shallow weld skin: irregular scallops, polished nearly flush. */
export function exhaustTubeWeldGeometry(route: ExhaustRoute, t: number, radiusAt: (t: number) => number, seed: number, detail = 256) {
  const axis = route.curve.getTangentAt(t).normalize();
  const across = new THREE.Vector3().crossVectors(axis,Math.abs(axis.y)<.9?new THREE.Vector3(0,1,0):new THREE.Vector3(1,0,0)).normalize();
  const other = new THREE.Vector3().crossVectors(axis,across).normalize();
  const rows = detail === 256 ? 12 : 8, sides = detail, positions: number[] = [], uv: number[] = [], indices: number[] = [];
  for (let k = 0; k <= rows; k++) for (let j = 0; j <= sides; j++) {
    const angle = j / sides * Math.PI * 2, u = k / rows * 2 - 1;
    const wobble = .0007 * Math.sin(angle * 5 + seed) + .00035 * Math.sin(angle * 13 - seed);
    const station = THREE.MathUtils.clamp(t + (u * (.017 + .0015 * Math.sin(angle * 7 + seed)) + wobble) / route.length,0,1);
    // Overlapping crescent-shaped TIG scallops, with irregular pitch. The
    // centre remains rounded while the edges are buffed into the parent tube.
    const phase = angle * 34 + .26 * Math.sin(angle * 5 + seed) - (1-u*u) * 2.3;
    const scallop = Math.pow(.5+.5*Math.cos(phase),3);
    const envelope = Math.pow(Math.max(0,1-u*u),.72);
    const rise = .00025 + envelope * (.0038 + .0020 * scallop + .0003 * Math.sin(angle * 11 + seed));
    const p = route.curve.getPointAt(station).addScaledVector(across,Math.cos(angle)*(radiusAt(station)+rise)).addScaledVector(other,Math.sin(angle)*(radiusAt(station)+rise));
    positions.push(p.x,p.y,p.z); uv.push(j/sides,k/rows);
    if (k < rows && j < sides) { const a=k*(sides+1)+j,b=a+1,c=a+sides+1; indices.push(a,b,c,b,c+1,c); }
  }
  const geometry = new THREE.BufferGeometry(); geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2)); geometry.setIndex(indices); geometry.computeVertexNormals(); geometry.computeBoundingSphere();
  return geometry;
}

/** Small non-uniform beads on the actual plate-to-tube attachment edges. */
export function exhaustEdgeWeldGeometry(points: THREE.Vector3[], radius = .005, seed = 0) {
  const path = new THREE.CatmullRomCurve3(points), length = path.getLength();
  const segments = Math.max(24,Math.ceil(length*280));
  const geometry = new THREE.TubeGeometry(path,segments,radius,6,false), position = geometry.getAttribute('position');
  for(let i=0;i<=segments;i++) {
    const t=i/segments, center=path.getPointAt(t);
    for(let j=0;j<=6;j++) {
      const n=i*7+j, p=new THREE.Vector3().fromBufferAttribute(position,n).sub(center);
      p.multiplyScalar(.92+.24*Math.sin(t*length*610+seed+j*.55)+.10*Math.sin(t*length*381-seed));
      p.add(center); position.setXYZ(n,p.x,p.y,p.z);
    }
  }
  geometry.computeVertexNormals(); geometry.computeBoundingSphere(); return geometry;
}
