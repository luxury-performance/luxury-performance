import * as THREE from 'three';

/** A softly lit plane preserves the approved artwork's exact geometry. */
export async function createFlowScene(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
  camera.position.z = 8;
  let texture: THREE.Texture;
  try { texture = await new THREE.TextureLoader().loadAsync('/brand/flow-scene.svg'); }
  catch (error) { renderer.dispose(); throw error; }
  texture.minFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  const uniforms = {
    artwork: { value: texture }, time: { value: 0 },
    pointer: { value: new THREE.Vector2(.5, .5) },
  };
  const material = new THREE.ShaderMaterial({
    transparent: true, uniforms,
    vertexShader: `varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,
    fragmentShader: `
      uniform sampler2D artwork; uniform float time; uniform vec2 pointer; varying vec2 vUv;
      void main(){
        float ink=texture2D(artwork,vUv).a;
        float bevel=texture2D(artwork,vUv+vec2(.0008,.0012)).a-ink;
        float sweep=pow(max(0.,sin(vUv.x*3.8+vUv.y*2.1-time*.25)),10.);
        float spot=exp(-length((vUv-pointer)*vec2(1.1,1.6))*3.8);
        vec3 silver=vec3(.34,.35,.34)+vec3(.35,.34,.31)*sweep+vec3(.4,.36,.27)*spot;
        float edgeFade=smoothstep(0.,.1,vUv.x)*smoothstep(0.,.12,1.-vUv.x)*smoothstep(0.,.16,vUv.y)*smoothstep(0.,.16,1.-vUv.y);
        gl_FragColor=vec4(silver+bevel*.5,ink*edgeFade*.88);
      }`,
  });
  const geometry = new THREE.PlaneGeometry(8.9, 5.637);
  const mesh = new THREE.Mesh(geometry, material);
  scene.add(mesh);
  host.appendChild(renderer.domElement);
  let frame = 0, visible = false, paused = false, disposed = false, last = 0, elapsed = 0;
  const target = new THREE.Vector2(.5, .5);
  const draw = (stamp: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) { last = 0; return; }
    const delta = last ? Math.min((stamp - last) / 1000, .06) : 0;
    last = stamp;
    if (!paused) elapsed += delta;
    uniforms.time.value = elapsed;
    uniforms.pointer.value.lerp(target, .04);
    mesh.rotation.y += ((target.x - .5) * .07 - mesh.rotation.y) * .04;
    mesh.rotation.x += ((target.y - .5) * -.045 - mesh.rotation.x) * .04;
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(draw);
  };
  const start = () => { if (!frame && visible && !document.hidden && !disposed) frame = requestAnimationFrame(draw); };
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.updateProjectionMatrix();
    mesh.scale.setScalar(Math.max(1, (2 * camera.position.z * Math.tan(17 * Math.PI / 180) * camera.aspect) / 8.9));
    start();
  });
  resize.observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else { cancelAnimationFrame(frame); frame = 0; last = 0; } });
  observer.observe(host);
  const move = (event: PointerEvent) => {
    if (paused) return;
    const rect = host.getBoundingClientRect();
    target.set((event.clientX - rect.left) / rect.width, 1 - (event.clientY - rect.top) / rect.height);
  };
  const leave = () => target.set(.5, .5);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else start(); };
  const lost = (event: Event) => { event.preventDefault(); host.dataset.failed = 'true'; cancelAnimationFrame(frame); frame = 0; visible = false; };
  host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('webglcontextlost', lost);
  return {
    pause(value: boolean) { paused = value; if (paused) { cancelAnimationFrame(frame); frame = 0; last = 0; } else start(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      texture.dispose(); material.dispose(); geometry.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
