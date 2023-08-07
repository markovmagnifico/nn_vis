import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Set up the scene and camera
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x62a0de);
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, -4, 10);
camera.lookAt(0, 0, 0);
const controls = new OrbitControls(camera, renderer.domElement);

// Create a basic green cube
const geometry1 = new THREE.BoxGeometry(1, 1, 1);
const material1 = new THREE.MeshBasicMaterial({ color: 0x77ee11 });
const cube = new THREE.Mesh(geometry1, material1);
scene.add(cube);

// Create a dashed line
const materia2 = new THREE.LineDashedMaterial({ color: 0x0000ff });
const points = [];
points.push(new THREE.Vector3(-10, 0, 0));
points.push(new THREE.Vector3(0, 10, 0));
points.push(new THREE.Vector3(10, 0, 0));
const geometry2 = new THREE.BufferGeometry().setFromPoints(points);
const line = new THREE.Line(geometry2, materia2);
scene.add(line);

// Making the cube clickable
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Making some text
// const loader = new FontLoader();
// loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
//   const geometry = new TextGeometry("I'm a cube?", {
//     font: font,
//     size: 1,
//     height: 1,
//   });
//   const material = new THREE.MeshBasicMaterial({ color: 0xffff00 });
//   const text = new THREE.Mesh(geometry, material);
//   scene.add(text);
// });

// Making some text appear over a cube when it is clicked
// window.addEventListener('click', (event) => {
//   // Convert mouse position to normalized device coordinates (-1 to +1)
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   // Update the picking ray with the camera and mouse position
//   raycaster.setFromCamera(mouse, camera);

//   // Calculate objects intersecting the picking ray
//   const intersects = raycaster.intersectObjects(scene.children);

//   for (let i = 0; i < intersects.length; i++) {
//     if (intersects[i].object === cube) {
//       alert("I'm a cube?");
//     }
//   }
// });

// Animation function for updating the scene
function animate() {
  requestAnimationFrame(animate);
  cube.rotation.x += 0.01;
  cube.rotation.y += 0.01;
  renderer.render(scene, camera);
}

// Run animation with webgl compatibility check
if (WebGL.isWebGLAvailable()) {
  // Initiate function or other initializations here
  animate();
} else {
  const warning = WebGL.getWebGLErrorMessage();
  document.getElementById('container').appendChild(warning);
}
