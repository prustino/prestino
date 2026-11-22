// Visualizzatore 3D per le pagine progetto (Three.js).
// Uso: <div class="model-3d" data-model-3d data-src="modelli/nome.glb"> … </div>, più l'importmap di "three" nella pagina.
// Il modello si carica solo quando il riquadro si avvicina allo schermo e si disegna solo mentre è visibile.
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return Boolean(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch {
    return false;
  }
}

async function mount(box) {
  const stage = box.querySelector('[data-model-stage]');
  const status = box.querySelector('[data-model-status]');
  const setStatus = (text) => { if (status) status.textContent = text; };

  if (!webglAvailable()) {
    box.classList.add('is-unsupported');
    setStatus('Il tuo browser non può mostrare il modello 3D.');
    return;
  }

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.append(renderer.domElement);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  const camera = new THREE.PerspectiveCamera(28, 1, 0.005, 20);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  // Tasto destro (o due dita) per spostare il piano di vista; il punto guardato resta vicino al modello.
  controls.enablePan = true;
  controls.screenSpacePanning = true;
  controls.maxPolarAngle = Math.PI / 2 - 0.03;
  controls.autoRotateSpeed = 0.6;

  const sun = new THREE.DirectionalLight(0xffffff, 1.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun, new THREE.HemisphereLight(0xffffff, 0x3a3a34, 0.4));

  let needsRender = true;
  const render = () => { needsRender = true; };
  const resize = () => {
    const { width, height } = stage.getBoundingClientRect();
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    render();
  };
  new ResizeObserver(resize).observe(stage);
  resize();

  setStatus('Caricamento del modello 3D…');
  let gltf;
  try {
    gltf = await new GLTFLoader().setMeshoptDecoder(MeshoptDecoder).loadAsync(box.dataset.src, (event) => {
      if (event.total) setStatus(`Caricamento del modello 3D… ${Math.round((event.loaded / event.total) * 100)}%`);
    });
  } catch {
    box.classList.add('is-unsupported');
    setStatus('Non è stato possibile caricare il modello 3D.');
    return;
  }

  const model = gltf.scene;
  model.traverse((node) => {
    if (!node.isMesh) return;
    const transparent = node.material.transparent;
    node.castShadow = !transparent;
    node.receiveShadow = !transparent;
    // I vetri possono chiedere riflessi più intensi dell'ambiente (extras del materiale nel GLB).
    const envMapIntensity = node.material.userData?.envMapIntensity;
    if (typeof envMapIntensity === 'number') node.material.envMapIntensity = envMapIntensity;
  });
  scene.add(model);

  // Inquadratura, luce e ombra a terra calcolate sulle dimensioni del modello.
  const bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  const center = bounds.getCenter(new THREE.Vector3());
  const radius = Math.max(size.x, size.y, size.z);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(radius * 4, radius * 4), new THREE.ShadowMaterial({ opacity: 0.28 }));
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = bounds.min.y;
  ground.receiveShadow = true;
  scene.add(ground);
  sun.position.set(center.x + radius * 0.6, center.y + radius * 1.4, center.z + radius * 0.9);
  sun.target.position.copy(center);
  scene.add(sun.target);
  Object.assign(sun.shadow.camera, { left: -radius, right: radius, top: radius, bottom: -radius, near: 0.01, far: radius * 4 });
  sun.shadow.camera.updateProjectionMatrix();
  controls.target.copy(center);
  controls.minDistance = radius * 0.35;
  controls.maxDistance = radius * 4;
  const panLimit = bounds.clone().expandByScalar(radius * 0.15);
  const clamped = new THREE.Vector3();
  controls.addEventListener('change', () => {
    clamped.copy(controls.target).clamp(panLimit.min, panLimit.max);
    if (clamped.equals(controls.target)) return;
    camera.position.add(clamped.sub(controls.target));
    controls.target.add(clamped);
  });

  // Viste predefinite: azimut e altezza della camera, distanza rispetto a quella che fa entrare il modello intero.
  const views = { tre: [0.62, 0.2, 0.6], profilo: [Math.PI / 2, 0.04, 0.66], alto: [Math.PI / 2, 1.25, 0.66] };
  const sphere = size.length() / 2;
  const fitDistance = () => {
    const vertical = THREE.MathUtils.degToRad(camera.fov);
    const horizontal = 2 * Math.atan(Math.tan(vertical / 2) * camera.aspect);
    return sphere / Math.sin(Math.min(vertical, horizontal) / 2);
  };
  let currentView = views.tre;
  let touched = false;
  const look = (view) => {
    currentView = view;
    const [azimuth, elevation, distance] = view;
    // In un riquadro alto e stretto (telefono in verticale) la camera resta alla distanza piena, per non tagliare prua e poppa.
    controls.target.copy(center);
    const r = fitDistance() * (camera.aspect < 1 ? Math.max(distance, 0.9) : distance);
    camera.position.set(
      center.x + r * Math.cos(elevation) * Math.cos(azimuth),
      center.y + r * Math.sin(elevation),
      center.z + r * Math.cos(elevation) * Math.sin(azimuth),
    );
    controls.update();
    render();
  };
  look(views.tre);

  const stopAutoRotate = () => { controls.autoRotate = false; };
  controls.autoRotate = !reducedMotion.matches;
  controls.addEventListener('start', () => { touched = true; stopAutoRotate(); });
  // Finché il visitatore non ha toccato il modello, un cambio di dimensioni rifà l'inquadratura.
  new ResizeObserver(() => { if (!touched) look(currentView); }).observe(stage);
  controls.addEventListener('change', render);
  box.querySelectorAll('[data-model-view]').forEach((button) => button.addEventListener('click', () => {
    stopAutoRotate();
    look(views[button.dataset.modelView] || views.tre);
  }));

  // Disegna solo quando il riquadro è visibile e qualcosa è cambiato.
  let visible = true;
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) render(); }).observe(box);
  renderer.setAnimationLoop(() => {
    if (!visible) return;
    const moving = controls.update();
    if (controls.autoRotate || moving || needsRender) {
      renderer.render(scene, camera);
      needsRender = false;
    }
  });

  box.classList.add('is-ready');
  setStatus('');
}

document.querySelectorAll('[data-model-3d]').forEach((box) => {
  const observer = new IntersectionObserver((entries) => {
    if (!entries.some((entry) => entry.isIntersecting)) return;
    observer.disconnect();
    mount(box);
  }, { rootMargin: '300px 0px' });
  observer.observe(box);
});
