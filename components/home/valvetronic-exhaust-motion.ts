const clamp = (value: number) => Math.max(0,Math.min(1,value));
const smooth = (value: number) => {const p=clamp(value);return p*p*(3-2*p);};
const mix = (from:number,to:number,p:number) => from+(to-from)*p;
type Shot = {at:number;azimuth:number;elevation:number;roll:number;bodyPitch:number;radius:number;target:[number,number,number]};
const shots: Shot[] = [
  {at:0,   azimuth:.18,elevation:.12,roll:0,bodyPitch:Math.PI,radius:9.8,target:[0,-.05,-.10]},
  {at:.12,azimuth:.14,elevation:.14,roll:0,bodyPitch:Math.PI,radius:8.8,target:[0,.05,-.30]},
  {at:.23,azimuth:-.10,elevation:.18,roll:-.01,bodyPitch:Math.PI*1.32,radius:6.5,target:[-.15,.20,-.72]},
  {at:.40,azimuth:-.22,elevation:.12,roll:.015,bodyPitch:Math.PI*1.5,radius:3.35,target:[0,.45,-.84]},
  {at:.49,azimuth:.18,elevation:.17,roll:.025,bodyPitch:Math.PI*1.56,radius:3.15,target:[.15,.60,-.70]},
  {at:.60,azimuth:-.60,elevation:-.12,roll:-.015,bodyPitch:Math.PI*2,radius:4.2,target:[-1.72,1.45,-.58]},
  {at:.69,azimuth:.60,elevation:-.10,roll:.015,bodyPitch:Math.PI*2,radius:4.2,target:[1.72,1.45,-.58]},
  {at:.77,azimuth:.34,elevation:.28,roll:.015,bodyPitch:Math.PI*2,radius:8.6,target:[0,-.20,-.24]},
  {at:.8275,azimuth:.34+Math.PI*.5,elevation:.40,roll:.015,bodyPitch:Math.PI*2,radius:8.8,target:[0,-.20,-.24]},
  {at:.885,azimuth:.34+Math.PI,elevation:.42,roll:.015,bodyPitch:Math.PI*2,radius:8.8,target:[0,-.20,-.24]},
  {at:.9425,azimuth:.34+Math.PI*1.5,elevation:.38,roll:.015,bodyPitch:Math.PI*2,radius:8.7,target:[0,-.20,-.24]},
  {at:1,azimuth:.34+Math.PI*2,elevation:.28,roll:.015,bodyPitch:Math.PI*2,radius:8.6,target:[0,-.20,-.24]},
];

/** Shape-preserving cubic interpolation carries velocity through every shot. */
function sample(p:number,value:(shot:Shot)=>number) {
  const i=Math.max(0,Math.min(shots.length-2,shots.findIndex(shot=>shot.at>=p)-1));
  const a=shots[i],b=shots[i+1],h=b.at-a.at,t=clamp((p-a.at)/h);
  function slope(index:number) {
    if(index===0 || index===shots.length-1) return 0;
    const prev=shots[index-1],current=shots[index],next=shots[index+1];
    const h0=current.at-prev.at,h1=next.at-current.at;
    const d0=(value(current)-value(prev))/h0,d1=(value(next)-value(current))/h1;
    if(d0*d1<=0) return 0;
    const w0=2*h1+h0,w1=h1+2*h0;
    return (w0+w1)/(w0/d0+w1/d1);
  }
  return (2*t*t*t-3*t*t+1)*value(a)+(t*t*t-2*t*t+t)*h*slope(i)+(-2*t*t*t+3*t*t)*value(b)+(t*t*t-t*t)*h*slope(i+1);
}

/** Directed camera shots around one intact assembly; scroll is the timeline. */
export function exhaustScrollPose(progress:number) {
  const p=clamp(progress);
  return {
    azimuth:sample(p,s=>s.azimuth),elevation:sample(p,s=>s.elevation),roll:sample(p,s=>s.roll),bodyPitch:sample(p,s=>s.bodyPitch),radius:sample(p,s=>s.radius),
    target:[0,1,2].map(index=>sample(p,s=>s.target[index])) as [number,number,number],
    lift:mix(-5.5,0,smooth((p-.025)/.245)),visible:p>.025,
    exposure:.66,environment:.58,
    key:1.10+Math.sin(p*Math.PI)*.18,
    rim:.90+Math.sin(p*Math.PI)*.15,
    lightX:mix(-6,4,smooth(p)),lightZ:mix(5,-3,smooth(p)),
    reflectionYaw:mix(-.7,.85,smooth(p)),reflectionRoll:Math.sin(p*Math.PI)*.12,
    typeOpacity:mix(.72,.10,smooth((p-.04)/.38)),
    detailOpacity:smooth((p-.72)/.20),hintOpacity:1-smooth(p/.18),
    floatAmount:smooth((p-.985)/.015),
  };
}
