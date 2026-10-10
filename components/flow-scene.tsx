import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

/** Three sculpted airfoils, lit by a studio environment rather than a logo texture. */
export async function createFlowScene(host: HTMLElement) {
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.3;
  renderer.domElement.setAttribute('aria-hidden', 'true');
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 1, .1, 40);
  camera.position.set(0, 0, 9);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .04);
  scene.environment = environment.texture;
  room.dispose(); pmrem.dispose();
  const sculpture = new THREE.Group();
  sculpture.scale.setScalar(1.2);
  sculpture.position.x = .35;
  scene.add(sculpture);
  const geometries: THREE.BufferGeometry[] = [];
  const materials: THREE.MeshPhysicalMaterial[] = [];
  for (let blade = 0; blade < 3; blade++) {
    const positions: number[] = [], indices: number[] = [];
    const lengthSegments = 160, ringSegments = 24;
    for (let i = 0; i <= lengthSegments; i++) {
      const t = i / lengthSegments;
      const taper = Math.pow(Math.sin(Math.PI * t), .65);
      const twist = -.8 + t * 2.6 + blade * .12;
      for (let j = 0; j <= ringSegments; j++) {
        const angle = j / ringSegments * Math.PI * 2;
        const broad = Math.cos(angle) * .72 * taper;
        const thin = Math.sin(angle) * .055 * taper;
        positions.push(
          (t - .5) * 6.6 + blade * .08,
          (blade - 1) * .72 + Math.sin(t * Math.PI * 1.65 - .8) * .62 + broad * Math.cos(twist) - thin * Math.sin(twist),
          Math.sin(t * Math.PI * 2 - .5) * .48 + broad * Math.sin(twist) + thin * Math.cos(twist),
        );
        if (i < lengthSegments && j < ringSegments) {
          const a = i * (ringSegments + 1) + j, b = a + ringSegments + 1;
          indices.push(a, a + 1, b, a + 1, b + 1, b);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices); geometry.computeVertexNormals();
    const material = new THREE.MeshPhysicalMaterial({ color: blade === 1 ? 0x8c8e90 : 0x44484b, metalness: 1, roughness: .24, clearcoat: 1, clearcoatRoughness: .16, side: THREE.DoubleSide });
    sculpture.add(new THREE.Mesh(geometry, material));
    geometries.push(geometry); materials.push(material);
  }
  const rim = new THREE.DirectionalLight(0xe5eaff, 4);
  rim.position.set(-3, 5, 4); scene.add(rim);
  const warm = new THREE.DirectionalLight(0xe9dcc0, 2);
  warm.position.set(5, -2, 2); scene.add(warm);
  host.appendChild(renderer.domElement);
  delete host.dataset.failed;
  let frame = 0, visible = false, paused = false, disposed = false, last = 0, elapsed = 0;
  let scrollProgress = .5;
  const pointer = new THREE.Vector2(), target = new THREE.Vector2();
  const draw = (stamp: number) => {
    frame = 0;
    if (disposed || !visible || document.hidden) { last = 0; return; }
    const delta = last ? Math.min((stamp - last) / 1000, .06) : 0;
    last = stamp;
    if (!paused) elapsed += delta;
    pointer.lerp(target, .045);
    sculpture.rotation.y += ((scrollProgress - .5) * .85 + pointer.x * .22 - sculpture.rotation.y) * .045;
    sculpture.rotation.x += (-.2 + pointer.y * .14 - sculpture.rotation.x) * .045;
    sculpture.rotation.z = -.18 + Math.sin(elapsed * .18) * .025;
    sculpture.position.y = Math.sin(elapsed * .4) * .055;
    rim.position.x = -3 + Math.sin(elapsed * .24) * 3;
    renderer.render(scene, camera);
    if (!paused) frame = requestAnimationFrame(draw);
  };
  const start = () => { if (!frame && visible && !document.hidden && !disposed && !paused) frame = requestAnimationFrame(draw); };
  const scroll = () => {
    const rect = host.getBoundingClientRect();
    scrollProgress = THREE.MathUtils.clamp((innerHeight - rect.top) / (innerHeight + rect.height), 0, 1);
  };
  const resize = new ResizeObserver(() => {
    const { width, height } = host.getBoundingClientRect();
    renderer.setSize(width, height);
    camera.aspect = width / Math.max(1, height);
    camera.position.z = Math.max(8, 4.15 / (Math.tan(17 * Math.PI / 180) * camera.aspect));
    camera.updateProjectionMatrix(); scroll(); start();
    if (paused) renderer.render(scene, camera);
  });
  resize.observe(host);
  const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) { scroll(); start(); } else { cancelAnimationFrame(frame); frame = 0; last = 0; } });
  observer.observe(host);
  const move = (event: PointerEvent) => {
    if (paused) return;
    const rect = host.getBoundingClientRect();
    target.set((event.clientX - rect.left) / rect.width - .5, (event.clientY - rect.top) / rect.height - .5);
  };
  const leave = () => target.set(0, 0);
  const visibility = () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; last = 0; } else start(); };
  const lost = (event: Event) => { event.preventDefault(); host.dataset.failed = 'true'; cancelAnimationFrame(frame); frame = 0; visible = false; };
  host.addEventListener('pointermove', move); host.addEventListener('pointerleave', leave);
  window.addEventListener('scroll', scroll, { passive: true });
  document.addEventListener('visibilitychange', visibility);
  renderer.domElement.addEventListener('webglcontextlost', lost);
  return {
    pause(value: boolean) { paused = value; if (paused) { cancelAnimationFrame(frame); frame = 0; last = 0; } else start(); },
    dispose() {
      disposed = true; cancelAnimationFrame(frame); resize.disconnect(); observer.disconnect();
      host.removeEventListener('pointermove', move); host.removeEventListener('pointerleave', leave);
      window.removeEventListener('scroll', scroll); document.removeEventListener('visibilitychange', visibility);
      renderer.domElement.removeEventListener('webglcontextlost', lost);
      geometries.forEach(geometry => geometry.dispose()); materials.forEach(material => material.dispose());
      environment.dispose(); renderer.dispose(); renderer.domElement.remove();
    },
  };
}
