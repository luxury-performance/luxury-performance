import * as T from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { createPurosangue } from './model';

export type View = 'Perspective' | 'Front' | 'Side' | 'Rear' | 'Top';
export function createStudio(host: HTMLElement, onProgress: (p: number) => void, onEnd: () => void) {
  const renderer = new T.WebGLRenderer({ antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.75));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = T.PCFShadowMap;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  host.appendChild(renderer.domElement);
  const scene = new T.Scene(); scene.background = new T.Color(0x17191b);
  scene.fog = new T.Fog(0x17191b, 15, 35);
  const pmrem = new T.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const environment = pmrem.fromScene(room, .04); scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  const camera = new T.PerspectiveCamera(38, 1, .1, 70);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, .85, 0); controls.enableDamping = true; controls.enablePan = false;
  controls.minDistance = 4; controls.maxDistance = 17; controls.maxPolarAngle = Math.PI / 2 - .015;
  const car = createPurosangue(); scene.add(car.car);
  const floor = new T.Mesh(new T.PlaneGeometry(100, 100), new T.MeshStandardMaterial({ color: 0x101214, roughness: 1, metalness: 0 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = .025; floor.receiveShadow = true; scene.add(floor);
  const key = new T.DirectionalLight(0xf1f5ff, 2); key.position.set(-3, 7, 5); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.camera.left = -6; key.shadow.camera.right = 6;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -6; key.shadow.normalBias = .03; scene.add(key);
  const rim = new T.DirectionalLight(0xcedfff, 1.5); rim.position.set(3, 4, -5); scene.add(rim);
  scene.add(new T.HemisphereLight(0xe8f0ff, 0x34302c, .7));
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let target = 1, progress = 1, playing = false, last = 0, frame = 0, visible = true, disposed = false;
  let view: View = 'Perspective';
  function setView(next: View) {
    view = next;
    const scale = host.clientWidth < 600 ? 1.85 : 1;
    const positions: Record<View, [number, number, number]> = {
      Perspective: [-5.2, 2.8, 5.6], Front: [-6.8, 1.8, .001], Side: [0, 1.8, 7.2], Rear: [6.8, 2.1, 3], Top: [0, 8.2, .001],
    };
    camera.position.set(...positions[next]).multiplyScalar(scale); controls.target.set(0, .85, 0); controls.update();
  }
  function resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); setView(view); }
  const observer = new ResizeObserver(resize); observer.observe(host); resize();
  const intersection = new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }); intersection.observe(host);
  function tick(time: number) {
    if (disposed) return; frame = requestAnimationFrame(tick);
    const dt = Math.min((time - last) / 1000, .05); last = time;
    if (!visible || document.hidden) return;
    if (playing) { target = Math.min(1, target + dt / 12); if (target === 1) { playing = false; onEnd(); } }
    if (Math.abs(target - progress) > .0001) {
      progress = reduced ? target : T.MathUtils.damp(progress, target, 10, dt);
      if (Math.abs(target - progress) < .0005) progress = target;
      car.assemble(progress); onProgress(progress);
    }
    controls.update(); renderer.render(scene, camera);
  }
  frame = requestAnimationFrame(tick);
  return {
    setView,
    setProgress(value: number) { playing = false; target = T.MathUtils.clamp(value, 0, 1); },
    play() { if (target > .99) { target = 0; progress = 0; car.assemble(0); onProgress(0); } playing = true; },
    pause() { playing = false; },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); intersection.disconnect(); controls.dispose();
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
      scene.traverse(obj => { if (obj instanceof T.Mesh) { geometries.add(obj.geometry); (Array.isArray(obj.material) ? obj.material : [obj.material]).forEach(m => materials.add(m)); } });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); environment.dispose(); key.shadow.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
