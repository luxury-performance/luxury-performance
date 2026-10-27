import * as THREE from 'three';
import type { ExhaustRoute } from './valvetronic-exhaust-routing';

type ParentSurface = {
  route: ExhaustRoute; geometry: THREE.TubeGeometry; station: number;
  radiusAt(t: number): number; offset?: THREE.Vector3;
};

/** Continue each parent pipe's exact UVs/material across the blended join. */
export function mapExhaustJoinSurface(geometry: THREE.BufferGeometry, parents: ParentSurface[]) {
  const position = geometry.getAttribute('position'), normal = geometry.getAttribute('normal');
  const prepared = parents.map(parent => {
    const offset = parent.offset ?? new THREE.Vector3();
    const start = Math.max(0,parent.station-1.1/parent.route.length), end = Math.min(1,parent.station+1.1/parent.route.length);
    const samples = Array.from({length: 129},(_,i) => {
      const t = THREE.MathUtils.lerp(start,end,i/128);
      return {t,point:parent.route.curve.getPointAt(t).add(offset)};
    });
    const segments = samples.slice(1).map((next,i) => {
      const direction = next.point.clone().sub(samples[i].point);
      return {start:samples[i],end:next,direction,inverseLength:1/Math.max(1e-12,direction.lengthSq())};
    });
    function project(p: THREE.Vector3) {
      let closest = Infinity, station = start;
      for(const segment of segments) {
        const dx=p.x-segment.start.point.x,dy=p.y-segment.start.point.y,dz=p.z-segment.start.point.z;
        const {x,y,z}=segment.direction;
        const u=THREE.MathUtils.clamp((dx*x+dy*y+dz*z)*segment.inverseLength,0,1);
        const ax=dx-u*x,ay=dy-u*y,az=dz-u*z,distance=ax*ax+ay*ay+az*az;
        if(distance<closest) {closest=distance;station=THREE.MathUtils.lerp(segment.start.t,segment.end.t,u);}
      }
      return {station,distance:Math.sqrt(closest)-parent.radiusAt(station)};
    }
    const cache = new Map<string,{u:number;v:number;bend:number}>();
    function uv(p: THREE.Vector3) {
      const key = `${p.x},${p.y},${p.z}`, cached = cache.get(key);
      if(cached) return {...cached};
      const {station} = project(p), count = parent.geometry.parameters.tubularSegments;
      const at = station*count, lo = Math.min(count-1,Math.floor(at)), weight = at-lo;
      const n = parent.geometry.normals[lo].clone().lerp(parent.geometry.normals[lo+1],weight).normalize();
      const b = parent.geometry.binormals[lo].clone().lerp(parent.geometry.binormals[lo+1],weight).normalize();
      const radial = p.clone().sub(offset).sub(parent.route.curve.getPointAt(station));
      const angle = (Math.atan2(radial.dot(b),-radial.dot(n))/ (Math.PI*2)+1)%1;
      const bend = parent.geometry.getAttribute('exhaustBend'), stride = parent.geometry.parameters.radialSegments+1;
      const result = {u:station,v:angle,bend:THREE.MathUtils.lerp(bend.getX(lo*stride),bend.getX((lo+1)*stride),weight)};
      cache.set(key,result); return {...result};
    }
    return {project,uv};
  });
  const triangles = parents.map(() => [] as number[]), point = new THREE.Vector3();
  for(let i=0;i<position.count;i+=3) {
    point.set(0,0,0);
    for(let k=0;k<3;k++)point.add(new THREE.Vector3().fromBufferAttribute(position,i+k));
    point.multiplyScalar(1/3);
    const scores = prepared.map(parent=>parent.project(point).distance);
    triangles[scores.indexOf(Math.min(...scores))].push(i);
  }
  const positions:number[]=[], normals:number[]=[], uvs:number[]=[], bends:number[]=[], colors:number[]=[];
  geometry.clearGroups();
  // Group triangles by parent so this adds two draw calls, not one per face.
  triangles.forEach((list,materialIndex) => {
    const start = positions.length/3;
    for(const triangle of list) {
      const mapped = [0,1,2].map(k=>prepared[materialIndex].uv(new THREE.Vector3().fromBufferAttribute(position,triangle+k)));
      if(Math.max(...mapped.map(p=>p.v))-Math.min(...mapped.map(p=>p.v))>.5)for(const p of mapped)if(p.v<.5)p.v+=1;
      for(let k=0;k<3;k++) {
        const index = triangle+k, uv = mapped[k];
        positions.push(position.getX(index),position.getY(index),position.getZ(index));
        normals.push(normal.getX(index),normal.getY(index),normal.getZ(index));
        uvs.push(uv.u,uv.v); bends.push(uv.bend); colors.push(1,1,1);
      }
    }
    if(list.length)geometry.addGroup(start,list.length*3,materialIndex);
  });
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  geometry.setAttribute('exhaustBend',new THREE.Float32BufferAttribute(bends,1));
  geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geometry.computeBoundingSphere(); return geometry;
}
