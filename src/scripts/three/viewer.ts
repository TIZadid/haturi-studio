import type { ModelKind } from '../../lib/product-schema';
import { pad2 } from '../../lib/format';
import { reducedMotion } from '../motion/lifecycle';
import { fitDistance } from './layout';
import { models } from './models';
import type { ModelHandle } from './models/types';
import { tokenColor } from './tokens';

export function webglAvailable(): boolean {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl2') ?? c.getContext('webgl'));
  } catch {
    return false;
  }
}

export async function mountViewer(el: HTMLElement): Promise<() => void> {
  const kind = el.dataset.viewer as ModelKind | undefined;
  const stage = el.querySelector<HTMLElement>('.viewer__stage');
  if (!kind || !stage || !webglAvailable()) return () => {};

  const [THREE, { OrbitControls }, { RoomEnvironment }, factory] = await Promise.all([
    import('three'),
    import('three/examples/jsm/controls/OrbitControls.js'),
    import('three/examples/jsm/environments/RoomEnvironment.js'),
    models[kind](),
  ]);
  const reduced = reducedMotion();
  const countEl = el.querySelector<HTMLElement>('[data-viewer-count]');
  const resetBtn = el.querySelector<HTMLButtonElement>('[data-viewer-reset]');

  let model: ModelHandle | null = null;
  const updateCaption = () => {
    if (!model) return;
    const c = model.count();
    if (countEl) countEl.textContent = c.current >= c.max ? `${pad2(c.current)} / ${pad2(c.max)} — ${c.fullLine}` : `${c.noun} ${pad2(c.current)} / ${pad2(c.max)}`;
    el.dataset.count = String(c.current);
    if (resetBtn) resetBtn.hidden = c.current === 0;
  };
  // build the model before touching the DOM so a failing factory leaves the photo untouched
  model = factory({ THREE, reduced, changed: updateCaption });
  const m = model;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  // a soft studio room for reflections, so metal and oiled wood read as materials, not flat colour
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environment = envTex;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 500);
  scene.add(new THREE.HemisphereLight(tokenColor('--color-cream'), tokenColor('--color-accent-2-900'), 0.9));
  const key = new THREE.DirectionalLight(tokenColor('--color-accent-2-200'), 3);
  key.position.set(-14, 18, 22);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.radius = 6;
  Object.assign(key.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
  scene.add(key);
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.ShadowMaterial({ opacity: 0.22 }));
  wall.receiveShadow = true;

  scene.add(m.root);
  const box = new THREE.Box3().setFromObject(m.root);
  const centre = box.getCenter(new THREE.Vector3());
  wall.position.z = box.min.z - 0.01;
  scene.add(wall);
  updateCaption();

  const controls = new OrbitControls(camera, renderer.domElement);
  Object.assign(controls, {
    enableZoom: false, enablePan: false, enableDamping: true, dampingFactor: 0.08,
    minAzimuthAngle: -Math.PI / 3, maxAzimuthAngle: Math.PI / 3,
    minPolarAngle: Math.PI / 2 - 0.35, maxPolarAngle: Math.PI / 2 + 0.25,
  });
  // OrbitControls sets touch-action:none; restore vertical page scrolling on touch
  renderer.domElement.style.touchAction = 'pan-y';

  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    // look straight at the model's centre so nothing reads as tilted or raised
    camera.position.set(centre.x, centre.y, centre.z + fitDistance(m.size.width, m.size.height, camera.fov, camera.aspect));
    controls.target.copy(centre);
    camera.updateProjectionMatrix();
    controls.update();
  };
  const ro = new ResizeObserver(resize);
  ro.observe(stage);
  resize();

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down: { x: number; y: number } | null = null;
  let lastInput = performance.now();
  const onDown = (e: PointerEvent) => { down = { x: e.clientX, y: e.clientY }; lastInput = performance.now(); };
  const onUp = (e: PointerEvent) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 6) { down = null; return; }
    down = null;
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(m.root, true)[0];
    if (hit) m.pick(hit.point);
  };
  const onReset = () => { m.reset(); updateCaption(); };
  renderer.domElement.addEventListener('pointerdown', onDown);
  renderer.domElement.addEventListener('pointerup', onUp);
  resetBtn?.addEventListener('click', onReset);

  let visible = true;
  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  io.observe(el);

  const clock = new THREE.Clock();
  let raf = 0;
  const loop = () => {
    raf = requestAnimationFrame(loop);
    if (!visible || document.hidden) { clock.getDelta(); return; }
    const dt = Math.min(clock.getDelta(), 0.05);
    const t = clock.elapsedTime;
    if (!reduced && performance.now() - lastInput > 3000) m.root.rotation.y = Math.sin(t * 0.4) * 0.22;
    m.update(dt, t);
    controls.update();
    renderer.render(scene, camera);
  };
  loop();
  el.dataset.ready = '';

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    controls.dispose();
    resetBtn?.removeEventListener('click', onReset);
    m.dispose();
    wall.geometry.dispose();
    (wall.material as import('three').Material).dispose();
    envTex.dispose();
    pmrem.dispose();
    renderer.dispose();
    renderer.domElement.remove();
    delete el.dataset.ready;
  };
}
