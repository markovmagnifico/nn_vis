import { OrbitControls } from './OrbitControls.js';
// Set up the scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x62a0de);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const camera_pos = {
  x: 1.9294188566321564,
  y: 2.04276989721195,
  z: 1.7079176568979086,
};
const camera_rot = {
  x: -0.733413647166391,
  y: 0.4083569289071685,
  z: 0.343626256422292,
};
camera.position.set(camera_pos.x, camera_pos.y, camera_pos.z);
camera.rotation.set(camera_rot.x, camera_rot.y, camera_rot.z);
window.camera = camera;
const controls = new OrbitControls(camera, renderer.domElement);

export { scene, renderer, camera };
