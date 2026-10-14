// Shared 3D viewer for the model and scene pages. Loads .glb files exported from the Unity project.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const stage = document.getElementById('stage');
const canvas = document.getElementById('view');
const status = document.getElementById('status');
const picker = document.getElementById('picker');
const note = document.getElementById('note');
const mode = stage.dataset.mode; // "model" or "scene"
const items = JSON.parse(document.getElementById('items').textContent);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(mode === 'model' ? 30 : 55, 1, 0.05, 2000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.dampingFactor = 0.12;
controls.zoomToCursor = true;
controls.maxPolarAngle = mode === 'model' ? Math.PI * 0.95 : Math.PI * 0.499;

const lightRig = new THREE.Group();
scene.add(lightRig);
let content = null;
let token = 0;
let brightness = 1;
let baseLights = [];

// Three-step ramp for the character materials, close to the game's cel shading.
const ramp = new THREE.DataTexture(new Uint8Array([150, 150, 150, 255, 255, 255, 255, 255]), 2, 1, THREE.RGBAFormat);
ramp.minFilter = ramp.magFilter = THREE.NearestFilter;
ramp.needsUpdate = true;

function resize() {
  const w = stage.clientWidth, h = stage.clientHeight;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(resize).observe(stage);

function disposeContent() {
  if (!content) return;
  scene.remove(content);
  content.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) for (const m of [].concat(o.material)) { if (m.map) m.map.dispose(); m.dispose(); }
  });
  content = null;
}

function setLights(list) {
  lightRig.clear();
  baseLights = [];
  for (const l of list) { lightRig.add(l); if (l.target) lightRig.add(l.target); baseLights.push([l, l.intensity]); }
  applyBrightness();
}
function applyBrightness() { for (const [l, i] of baseLights) l.intensity = i * brightness; }

function styleModel(root) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const src = o.material, ex = src.userData || {};
    const layer = (ex.shader || '').includes('FaceLayers');
    let m;
    if (layer) {
      m = new THREE.MeshBasicMaterial({ map: src.map, color: src.color, transparent: true, opacity: src.opacity, alphaTest: 0.02, side: THREE.DoubleSide, depthWrite: false });
      m.polygonOffset = true; m.polygonOffsetFactor = -1; m.polygonOffsetUnits = -1;
      o.renderOrder = ex.queue || 2001;
    } else {
      m = new THREE.MeshToonMaterial({ map: src.map, color: src.color, gradientMap: ramp, side: src.side, transparent: src.transparent, opacity: src.opacity, alphaTest: src.alphaTest });
    }
    m.name = src.name;
    o.material = m;
  });
}

function frameModel(root) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const dist = Math.max(size.y, size.x) * 0.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.15;
  controls.target.copy(c);
  camera.position.set(c.x - dist * 0.35, c.y + size.y * 0.1, c.z + dist * 0.94).sub(c).setLength(dist).add(c);
  camera.near = 0.02; camera.far = 100; camera.updateProjectionMatrix();
  controls.minDistance = 0.15; controls.maxDistance = dist * 4;
  scene.background = new THREE.Color(0x24262c);
  scene.fog = null;
  const hemi = new THREE.HemisphereLight(0xffffff, 0x8a8f9c, 1.5);
  const key = new THREE.DirectionalLight(0xfff2e0, 2.2);
  key.position.set(c.x - 2, c.y + 3, c.z + 3); key.target.position.copy(c);
  setLights([hemi, key]);
}

function frameScene(root, ex, item) {
  const box = new THREE.Box3().setFromObject(root);
  const size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const span = Math.max(size.x, size.z);
  const bg = item.background || [0.012, 0.014, 0.022];
  scene.background = new THREE.Color().setRGB(bg[0], bg[1], bg[2]);
  scene.fog = ex.fog ? new THREE.FogExp2(new THREE.Color().setRGB(...ex.fogColor), ex.fogDensity) : null;
  const lights = [];
  const amb = ex.ambient || [0.4, 0.4, 0.4];
  lights.push(new THREE.AmbientLight(new THREE.Color().setRGB(amb[0], amb[1], amb[2]), (item.ambient || 1) * Math.PI));
  const points = [];
  for (const l of ex.lights || []) {
    const col = new THREE.Color().setRGB(l.color[0], l.color[1], l.color[2]);
    if (l.type === 'Directional') {
      const d = new THREE.DirectionalLight(col, l.intensity * Math.PI * (item.sun || 1));
      d.position.set(c.x - l.dir[0] * 100, c.y - l.dir[1] * 100, c.z - l.dir[2] * 100); d.target.position.copy(c);
      lights.push(d);
    } else if (l.type === 'Point' || l.type === 'Spot') points.push(l);
  }
  // Keep the strongest point lights; a browser cannot afford every lamp in a large scene.
  points.sort((a, b) => b.intensity * b.range - a.intensity * a.range);
  for (const l of points.slice(0, item.maxPoints || 28)) {
    const col = new THREE.Color().setRGB(l.color[0], l.color[1], l.color[2]);
    const p = new THREE.PointLight(col, l.intensity * (item.point || 6), l.range * 1.2, 1.4);
    p.position.set(l.pos[0], l.pos[1], l.pos[2]);
    lights.push(p);
  }
  setLights(lights);
  const start = item.start;
  if (start) { camera.position.set(...start.pos); controls.target.set(...start.target); }
  else { controls.target.set(c.x, box.min.y + 1, c.z); camera.position.set(c.x, box.min.y + span * 0.55, c.z - span * 0.75); }
  camera.near = 0.1; camera.far = Math.max(600, span * 6); camera.updateProjectionMatrix();
  controls.minDistance = 0.5; controls.maxDistance = span * 3;
  status.dataset.span = span;
}

// A scene with a roof (the guild: the node named RF01_HallRoof; its gables stay) opens with the roof hidden, as the game's camera hides it,
// and gets a button to show it.
let roofParts = [], roofButton = null;
function setupRoof(root) {
  roofParts = [];
  root.traverse(o => { if (/^RF01_/.test(o.name)) roofParts.push(o); });
  if (!roofButton) {
    roofButton = document.createElement('button'); roofButton.type = 'button';
    roofButton.addEventListener('click', () => { const show = !roofParts[0].visible; for (const o of roofParts) o.visible = show; roofButton.textContent = show ? 'Hide roof' : 'Show roof'; });
    const full = document.getElementById('full'); full.parentNode.insertBefore(roofButton, full);
  }
  roofButton.hidden = roofParts.length === 0;
  for (const o of roofParts) o.visible = false;
  roofButton.textContent = 'Show roof';
}

async function load(index) {
  const item = items[index], mine = ++token;
  for (const b of picker.children) b.setAttribute('aria-pressed', b.dataset.i == index);
  note.textContent = item.note || '';
  status.hidden = false;
  status.textContent = 'Loading ' + item.label + '…';
  disposeContent();
  try {
    const gltf = await new GLTFLoader().loadAsync(item.file, e => {
      if (mine === token) status.textContent = 'Loading ' + item.label + '… ' + (e.loaded / 1048576).toFixed(1) + ' MB';
    });
    if (mine !== token) return;
    content = gltf.scene;
    for (const tex of gltf.parser.json.textures ? await Promise.all(gltf.parser.json.textures.map((_, i) => gltf.parser.getDependency('texture', i))) : []) tex.anisotropy = 8;
    if (mode === 'model') { styleModel(content); frameModel(content); }
    else frameScene(content, gltf.scene.userData || {}, item);
    scene.add(content);
    setupRoof(content);
    status.hidden = true;
    history.replaceState(null, '', '#' + item.id);
  } catch (err) {
    if (mine === token) status.textContent = 'Could not load ' + item.label + '. ' + err.message;
  }
}

items.forEach((item, i) => {
  const b = document.createElement('button');
  b.type = 'button'; b.textContent = item.label; b.dataset.i = i;
  b.addEventListener('click', () => load(i));
  picker.appendChild(b);
});

// Keyboard movement: carries the camera and its orbit centre together.
const keys = new Set();
const moveKeys = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
window.addEventListener('keydown', e => { if (moveKeys.includes(e.code) && document.activeElement === canvas) { keys.add(e.code); e.preventDefault(); } });
window.addEventListener('keyup', e => keys.delete(e.code));
canvas.addEventListener('blur', () => keys.clear());
canvas.addEventListener('pointerdown', () => canvas.focus());

const bright = document.getElementById('bright');
if (bright) bright.addEventListener('input', () => { brightness = parseFloat(bright.value); applyBrightness(); });
const full = document.getElementById('full');
if (full) full.addEventListener('click', () => { document.fullscreenElement ? document.exitFullscreen() : stage.requestFullscreen(); });

const clock = new THREE.Clock();
const fwd = new THREE.Vector3(), right = new THREE.Vector3(), step = new THREE.Vector3();
function tick() {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (keys.size) {
    camera.getWorldDirection(fwd); fwd.y = 0; fwd.normalize();
    right.crossVectors(fwd, camera.up).normalize();
    step.set(0, 0, 0);
    if (keys.has('KeyW') || keys.has('ArrowUp')) step.add(fwd);
    if (keys.has('KeyS') || keys.has('ArrowDown')) step.sub(fwd);
    if (keys.has('KeyD') || keys.has('ArrowRight')) step.add(right);
    if (keys.has('KeyA') || keys.has('ArrowLeft')) step.sub(right);
    if (keys.has('KeyE')) step.y += 1;
    if (keys.has('KeyQ')) step.y -= 1;
    const speed = Math.max(1.5, camera.position.distanceTo(controls.target) * 0.9);
    step.multiplyScalar(speed * dt);
    camera.position.add(step); controls.target.add(step);
  }
  controls.update();
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

resize();
const wanted = items.findIndex(i => '#' + i.id === location.hash);
load(wanted >= 0 ? wanted : 0);
tick();
