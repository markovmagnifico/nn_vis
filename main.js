import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import WebGL from 'three/addons/capabilities/WebGL.js';

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
camera.position.set(0, -2.9, 0.7);
camera.rotation.set(1, -4.3, 6);
window.camera = camera;
const controls = new OrbitControls(camera, renderer.domElement);

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

/*
  Visualizing the network
*/

function getColor(value) {
  return new THREE.Color(0.2 + value * 0.5, 0.6 + value * 0.4, 1 - value * 0.3);
}

const cubeSize = 0.05; // You can adjust this to fit the grid
const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);
const cubeMaterials = new Array(28)
  .fill(null)
  .map(() => new Array(28).fill(null));

function createCubes() {
  for (let i = 0; i < 28; i++) {
    for (let j = 0; j < 28; j++) {
      const value = canvasArray[i][j];
      const color = getColor(value);
      const material = new THREE.MeshBasicMaterial({ color });

      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(
        (j - 14) * cubeSize * 1.1,
        (14 - i) * cubeSize * 1.1,
        0
      ); // Adjust for rotation
      scene.add(cube);

      cubeMaterials[i][j] = material;
    }
  }
}

createCubes();

function updateCubeColors() {
  for (let i = 0; i < 28; i++) {
    for (let j = 0; j < 28; j++) {
      const value = canvasArray[i][j];
      const color = getColor(value);
      cubeMaterials[i][j].color.set(color);
    }
  }
}

// Load the trained mnist model
const savedModelPath = 'model/model.json';
const model = await tf.loadLayersModel(savedModelPath);
window.model = model;

const inputTensor = tf.tensor(canvasArray, [28, 28, 1]).expandDims(0).toFloat();

// Collect all the intermediate layers
const layerOutputs = [];
for (const layer of model.layers) {
  layerOutputs.push(layer.output);
}
// Define a new model that outputs the intermediate activations
const activationModel = tf.model({
  inputs: model.input,
  outputs: layerOutputs,
});
window.activationModel = activationModel;
// Use the new model to predict the intermediate activations for a given input
const activations = activationModel.predict(inputTensor);
window.activations = activations;

function createConvLayer(layerIndex, offsetX, offsetY, offsetZ) {
  const activations = window.activations[layerIndex]; // Get activations for the specified layer
  const [batchSize, height, width, numFilters] = activations.shape;

  for (let k = 0; k < numFilters; k++) {
    // Iterate through filters
    for (let i = 0; i < height; i++) {
      // Iterate through height
      for (let j = 0; j < width; j++) {
        // Iterate through width
        const value = activations.arraySync()[0][i][j][k]; // Get activation value
        const color = getColor(value);
        const material = new THREE.MeshBasicMaterial({ color });

        const cube = new THREE.Mesh(geometry, material);
        cube.position.set(
          offsetX + j * cubeSize * 1.5,
          offsetY + (height - i) * cubeSize * 1.5,
          offsetZ + k * cubeSize * 2 // Separate different filters in the Z-direction
        );
        scene.add(cube);
      }
    }
  }
}

createConvLayer(0, 0, -1, 1);

// run the animation to do updates
function animate() {
  updateCubeColors();
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();
