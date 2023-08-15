import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import WebGL from 'three/addons/capabilities/WebGL.js';
import model from './train.js';
import convModel from './model.js';

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
// Give edges to the cube
const edges1 = new THREE.EdgesGeometry(geometry1);
const line1 = new THREE.LineSegments(
  edges1,
  new THREE.LineBasicMaterial({ color: 0x000000 })
);
scene.add(line1);

// // Create a dashed line
// const materia2 = new THREE.LineDashedMaterial({ color: 0x0000ff });
// const points = [];
// points.push(new THREE.Vector3(-10, 0, 0));
// points.push(new THREE.Vector3(0, 10, 0));
// points.push(new THREE.Vector3(10, 0, 0));
// const geometry2 = new THREE.BufferGeometry().setFromPoints(points);
// const line2 = new THREE.Line(geometry2, materia2);
// scene.add(line2);

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
  line1.rotation.x += 0.01;
  line1.rotation.y += 0.01;
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

/*

Begin tensorflow.js section for learning

*/
const weight = Array.from(model.getWeights()[0].dataSync());
const bias = Array.from(model.getWeights()[1].dataSync());

console.log(model);
console.log(`Model weight: ${weight}`);
console.log(`Model bias: ${bias}`);
window.model = model;

/*

Drawing a model (no weights for now)

*/
window.convModel = convModel;
const weightsArray = convModel.getWeights()[0].dataSync();
const kernelHeight = 5;
const kernelWidth = 5;
const inputChannels = 1;
const outputChannels = 8;

// Reshaping the array into the 4D shape
const weights4D = tf.tensor(weightsArray, [
  kernelHeight,
  kernelWidth,
  inputChannels,
  outputChannels,
]);

// Accessing the kernel for each filter:
for (let i = 0; i < outputChannels; i++) {
  const kernel = weights4D.slice(
    [0, 0, 0, i],
    [kernelHeight, kernelWidth, inputChannels, 1]
  );
  // kernel now contains the 5x5 weights for the i-th filter
  let kernelArray = kernel.arraySync();
  let kernelString = kernelArray.map((row) => row.join(' ')).join('\n');
  console.log(`Printing the ${i}th kernel:`);
  console.log(kernelString);
}

/*
Getting something from the user
*/
// Get the input and error message elements
let inputElement = document.getElementById('user-input');
let errorMessageElement = document.getElementById('error-message');

let fontLoader = new FontLoader();
let textMesh;

function createTextMesh(text, font) {
  let geometry = new TextGeometry(text, {
    font: font,
    size: 1,
    height: 0.2,
  });

  let material = new THREE.MeshBasicMaterial({ color: 0x000000 });

  let mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(-5, 2, 0);
  // mesh.rotation.set(0, -Math.PI / 2, 0);

  return mesh;
}

function updateSceneText(newText, font) {
  // Remove the old text mesh from the scene
  if (textMesh) {
    scene.remove(textMesh);
  }

  // Create a new text mesh
  textMesh = createTextMesh(newText, font);

  // Add the new text mesh to the scene
  scene.add(textMesh);
}

// fontLoader.load('fonts/helvetiker_regular.typeface.json', (font) => {
//   // Handle the input event
//   inputElement.addEventListener('input', (event) => {
//     let userInput = event.target.value;

//     // Check if the input is a number
//     if (isNaN(userInput)) {
//       errorMessageElement.textContent = 'Please enter a number.';
//     } else {
//       errorMessageElement.textContent = '';
//       updateSceneText(userInput, font);
//     }
//   });
// });

// Adding a way for the user to draw
// Initialize the drawing mode

const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const toggleSwitch = document.getElementById('toggleSwitch');
const resetButton = document.getElementById('resetCanvas');
const brushSizeControl = document.getElementById('brushSize');

let brushSize = parseInt(brushSizeControl.value);
let drawingMode = 'draw';
let drawing = false;
const scale = 10;
const canvasArray = Array(28)
  .fill()
  .map(() => Array(28).fill(0)); // 0: black, 1: white
window.canvasArray = canvasArray;

function initializeCanvas() {
  canvas.width = 280;
  canvas.height = 280;
  renderCanvasFromArray();
}

function updateCanvasArray(x, y, value) {
  canvasArray[y][x] = value;
}

function renderCanvasFromArray() {
  ctx.fillStyle = 'black';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = 'white';
  for (let y = 0; y < canvasArray.length; y++) {
    for (let x = 0; x < canvasArray[y].length; x++) {
      if (canvasArray[y][x] === 1) {
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }
}

// Function to reset the canvas array and render it
function resetCanvas() {
  for (let y = 0; y < canvasArray.length; y++) {
    for (let x = 0; x < canvasArray[y].length; x++) {
      canvasArray[y][x] = 0;
    }
  }
  renderCanvasFromArray();
}

// Function to update the brush size
function updateBrushSize() {
  brushSize = parseInt(this.value);
}

function toggleDrawingMode() {
  drawingMode = this.checked ? 'erase' : 'draw';
}

function drawPixel(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const centerX = Math.floor((e.clientX - rect.left) / scale);
  const centerY = Math.floor((e.clientY - rect.top) / scale);

  const startX = centerX - Math.floor(brushSize / 2);
  const startY = centerY - Math.floor(brushSize / 2);

  const value = drawingMode === 'draw' ? 1 : 0;

  for (let i = 0; i < brushSize; i++) {
    for (let j = 0; j < brushSize; j++) {
      const x = startX + i;
      const y = startY + j;
      if (x >= 0 && x < 28 && y >= 0 && y < 28) {
        updateCanvasArray(x, y, value);
      }
    }
  }

  renderCanvasFromArray();
}

function setupEventListeners() {
  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    drawPixel(e);
  });
  canvas.addEventListener('mouseup', () => (drawing = false));
  canvas.addEventListener('mousemove', drawPixel);
  canvas.addEventListener('mouseout', () => (drawing = false));
  toggleSwitch.addEventListener('change', toggleDrawingMode);
  resetButton.addEventListener('click', resetCanvas);
  brushSizeControl.addEventListener('input', updateBrushSize);
}

// Initialization
initializeCanvas();
setupEventListeners();
