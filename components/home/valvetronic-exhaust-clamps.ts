import * as THREE from 'three';

/** Split band with two barrel ends, a real helical thread and bevelled hex nut. */
export function createExhaustClamp(material: THREE.Material) {
  const group = new THREE.Group(); group.name = 'Split stainless band clamp · threaded barrel fastener';
  const geometries: THREE.BufferGeometry[] = [];
  function mesh<T extends THREE.BufferGeometry>(geometry: T, parent = group) {
    geometries.push(geometry); const object = new THREE.Mesh(geometry,material); parent.add(object); return object;
  }
  const radius = .200, width = .14, gauge = .006, gap = .28;
  // Local X runs along the pipe; +Z faces the same direction as the plates.
  const section = [new THREE.Vector2(radius-gauge,-width/2),new THREE.Vector2(radius,-width/2),new THREE.Vector2(radius,width/2),new THREE.Vector2(radius-gauge,width/2),new THREE.Vector2(radius-gauge,-width/2)];
  const band = new THREE.LatheGeometry(section,96,gap,Math.PI*2-gap*2); band.rotateZ(Math.PI/2); mesh(band);
  for(const side of [-1,1]) {
    const path = new THREE.CatmullRomCurve3(Array.from({length:65},(_,i)=>{
      const angle=gap+(Math.PI*2-gap*2)*i/64;
      return new THREE.Vector3(side*width/2,Math.sin(angle)*radius,Math.cos(angle)*radius);
    }));
    mesh(new THREE.TubeGeometry(path,96,.0022,6,false));
  }
  const barrelZ = radius+.025, barrelRadius = .040, bore = .0145, barrelLength = .084;
  for(const side of [-1,1]) {
    const barrel = new THREE.Group(); barrel.position.set(0,side*.064,barrelZ); group.add(barrel);
    const profile = [new THREE.Vector2(bore,-barrelLength/2),new THREE.Vector2(barrelRadius,-barrelLength/2),new THREE.Vector2(barrelRadius,barrelLength/2),new THREE.Vector2(bore,barrelLength/2),new THREE.Vector2(bore,-barrelLength/2)];
    mesh(new THREE.LatheGeometry(profile,48),barrel);
    // The end of the strap folds outward behind each barrel.
    const tab = mesh(new THREE.BoxGeometry(width*.94,.034,gauge));
    tab.position.set(0,side*.066,radius+.006); tab.rotation.x=side*.15;
  }

  const shaft = mesh(new THREE.CylinderGeometry(.0125,.0125,.302,24,1,false));
  shaft.position.set(0,-.025,barrelZ);
  // Model only the exposed thread; the portions inside the barrels stay hidden.
  for(const [start,end] of [[-.176,-.139],[-.023,.023],[.108,.123]]) {
    const turns=(end-start)/.0065;
    const count=Math.max(32,Math.ceil(turns*20));
    const helix = new THREE.CatmullRomCurve3(Array.from({length:count},(_,i)=>{
      const u=i/(count-1), angle=u*turns*Math.PI*2;
      return new THREE.Vector3(Math.cos(angle)*.0131,THREE.MathUtils.lerp(start,end,u),barrelZ+Math.sin(angle)*.0131);
    }));
    mesh(new THREE.TubeGeometry(helix,Math.ceil(turns*24),.00145,6,false));
  }
  const nutOutline = new THREE.Shape();
  for(let i=0;i<6;i++) {
    const angle=i/6*Math.PI*2+Math.PI/6, x=Math.cos(angle)*.029, y=Math.sin(angle)*.029;
    if(i===0)nutOutline.moveTo(x,y); else nutOutline.lineTo(x,y);
  }
  nutOutline.closePath();
  const hole = new THREE.Path(); hole.absarc(0,0,.0142,0,Math.PI*2,true); nutOutline.holes.push(hole);
  const nut = new THREE.ExtrudeGeometry(nutOutline,{depth:.023,bevelEnabled:true,bevelThickness:.0018,bevelSize:.0018,bevelSegments:2,curveSegments:32});
  nut.rotateX(-Math.PI/2); nut.translate(0,-.137,barrelZ); mesh(nut);
  const washer = new THREE.LatheGeometry([new THREE.Vector2(.0142,-.0018),new THREE.Vector2(.029,-.0018),new THREE.Vector2(.029,.0018),new THREE.Vector2(.0142,.0018),new THREE.Vector2(.0142,-.0018)],40);
  washer.translate(0,-.109,barrelZ); mesh(washer);
  const head = mesh(new THREE.CylinderGeometry(.025,.025,.011,32)); head.position.set(0,.117,barrelZ);
  const crown = mesh(new THREE.SphereGeometry(.024,24,12,0,Math.PI*2,0,Math.PI/2));
  crown.scale.y=.24; crown.position.set(0,.1225,barrelZ);
  return {group,geometries};
}
