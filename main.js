import canvasArray from './imageInput.js';
import { scene, renderer, camera } from './sceneSetup.js';
import {
  initializeMouseListeners,
  initializeKeyListeners,
  handleCameraMovement,
} from './ArrowControls.js';

initializeMouseListeners(camera, renderer.domElement);
initializeKeyListeners(controls);

/**
 * Setup for:
 * - Constants
 * - Input image array
 * - Intermediate model activations
 */

const cubeSize = 0.05;
const cubeSpacing = 1.1; // the space between cube centers
const geometry = new THREE.BoxGeometry(cubeSize, cubeSize, cubeSize);

// Load the trained mnist model
const savedModelPath = './model/model.json';
const model = await tf.loadLayersModel(savedModelPath);
window.model = model;

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

// // Usage example:
// const inputTensor = tf.tensor(canvasArray, [28, 28, 1]).expandDims(0).toFloat();
// // Use the new model to predict the intermediate activations for a given input
// const activations = activationModel.predict(inputTensor);
// window.activations = activations;

/*
  Visualizing the network
*/

function createEmptyArray(shape) {
  if (shape.length === 0) return null;
  const dim = shape[0];
  return Array.from({ length: dim }, () => createEmptyArray(shape.slice(1)));
}

function getColor(value) {
  return new THREE.Color(0.2 + value * 0.5, 0.6 + value * 0.4, 1 - value * 0.3);
}

function getColorString(value) {
  const color = getColor(value);
  const r = Math.floor(color.r * 255);
  const g = Math.floor(color.g * 255);
  const b = Math.floor(color.b * 255);
  return `rgb(${r},${g},${b})`;
}

function createCube(x, y, z) {
  // Create a cube and return the material (to update the color later)
  const color = getColor(0);
  const material = new THREE.MeshBasicMaterial({ color });
  const cube = new THREE.Mesh(geometry, material);
  cube.position.set(x, y, z);
  scene.add(cube);

  // Also create edges around the cube
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x808080 })
  );
  line.position.set(x, y, z);
  scene.add(line);

  return material;
}

function createGeometryStruct(model) {
  const geometryStruct = {
    input: createEmptyArray([28, 28]),
  };

  for (let i = 0; i < model.layers.length; i++) {
    const layer = model.layers[i];
    const shape = layer.outputShape.slice(1); // Exclude the leading 1 for batchSize
    geometryStruct[i] = createEmptyArray(shape);
  }

  return geometryStruct;
}
// Struct for tracking the cube geometries to update them with new colors
const geometryStruct = createGeometryStruct(activationModel);
window.geometryStruct = geometryStruct;

/**
 * Functions for updating the cube colors
 */
function update3DLayer(layerIndex, activations) {
  const [batchSize, height, width, numFilters] = activations.shape;

  for (let k = 0; k < numFilters; k++) {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const value = activations.arraySync()[0][i][j][k];
        const color = getColor(value);
        geometryStruct[layerIndex][i][j][k].color.set(color);
      }
    }
  }
}

function update1DLayer(layerIndex, activations) {
  const [batchSize, length] = activations.shape;

  for (let i = 0; i < length; i++) {
    const value = activations.arraySync()[0][i];
    const color = getColor(value);
    geometryStruct[layerIndex][i].color.set(color);
  }
}

function updateCubeColors() {
  // Update the input layer cubes
  for (let i = 0; i < 28; i++) {
    for (let j = 0; j < 28; j++) {
      const value = canvasArray[i][j];
      const color = getColor(value);
      geometryStruct['input'][i][j].color.set(color);
    }
  }

  const inputTensor = tf
    .tensor(canvasArray, [28, 28, 1])
    .expandDims(0)
    .toFloat();
  const activations = activationModel.predict(inputTensor);

  // Update the prediction display on the left
  updatePredictionDisplay(activations);

  for (let layerIndex = 0; layerIndex < activations.length; layerIndex++) {
    const activation = activations[layerIndex];
    const shapeLength = activation.shape.length;

    // If the shape length is 4 (including the batch size), it is a 3D layer; otherwise, it's a 1D layer
    if (shapeLength === 4) {
      update3DLayer(layerIndex, activation);
    } else if (shapeLength === 2) {
      update1DLayer(layerIndex, activation);
    } else {
      console.error(
        `Unsupported shape length: ${shapeLength} for layer: ${layerIndex}`
      );
    }
  }
}

function updatePredictionDisplay(outputActivations) {
  const finalLayerOutput = outputActivations[outputActivations.length - 1];
  const finalOutputArray = finalLayerOutput.arraySync()[0];
  finalOutputArray.forEach((value, index) => {
    const color = getColorString(value);
    console.log(color);
    const box = document.getElementById(`box-${index}`);
    const innerDiv = box.querySelector('div');
    box.style.backgroundColor = color;
    innerDiv.textContent = value.toFixed(2);
  });
}

/**
 * Functions for creating the cubes for the intermediate activations
 */
function draw2DLayer(arr) {
  const rows = arr.length;
  const cols = arr[0].length;
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      const material = createCube(
        (j - cols / 2) * cubeSize * cubeSpacing,
        (rows / 2 - i) * cubeSize * cubeSpacing,
        0
      );
      geometryStruct['input'][i][j] = material;
    }
  }
}

function draw3DLayer(layerIndex) {
  const offsetZ = -(layerIndex + 1);
  const layer = model.layers[layerIndex];
  const [batchSize, height, width, numFilters] = layer.outputShape;

  for (let k = 0; k < numFilters; k++) {
    for (let i = 0; i < height; i++) {
      for (let j = 0; j < width; j++) {
        const filterSize = width * cubeSize * 1.1;
        const space = cubeSize * 2;
        const filterOffset =
          filterSize / 2 + (k - numFilters / 2) * (filterSize + space);

        const material = createCube(
          (j - width / 2) * cubeSize * cubeSpacing + filterOffset,
          (height / 2 - i) * cubeSize * cubeSpacing,
          offsetZ
        );
        geometryStruct[layerIndex][i][j][k] = material;
      }
    }
  }
}

function draw1DLayer(layerIndex) {
  const offsetZ = -(layerIndex + 1);
  const layer = model.layers[layerIndex];
  const [batchSize, length] = layer.outputShape;
  for (let i = 0; i < length; i++) {
    let xLoc = (i - length / 2) * cubeSize * cubeSpacing;
    if (layerIndex == 6) {
      // Space out the last layer more
      xLoc *= 2;
      drawOutputLabel(i, xLoc, 0.1, offsetZ);
    }

    const material = createCube(xLoc, 0, offsetZ);
    geometryStruct[layerIndex][i] = material;
  }
}

const loader = new THREE.FontLoader();
function drawOutputLabel(n, x, y, z) {
  loader.load('fonts/helvetiker_regular.typeface.json', function (font) {
    // Create the text geometry
    const geometry = new THREE.TextGeometry(n.toString(), {
      font: font,
      size: 0.1,
      height: 0.01,
    });
    const material = new THREE.MeshBasicMaterial({ color: 0x000000 });
    const text = new THREE.Mesh(geometry, material);
    // Compute the offset to get the numbers centered over the cubes
    geometry.computeBoundingBox(); // compute bounding box to get text width
    const textWidth = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    let scaleFactor;
    if (n === 1) {
      // I have no idea why 1 is offset weird compared to the rest
      scaleFactor = 2.2;
    } else {
      scaleFactor = 1.1;
    }
    // Set pos and add to scene
    text.position.set(x - (textWidth * scaleFactor) / 2, y, z);
    scene.add(text);
  });
}

// Create all the layers
draw2DLayer(canvasArray);

draw3DLayer(0);
draw3DLayer(1);
draw3DLayer(2);
draw3DLayer(3);

draw1DLayer(4);
draw1DLayer(5);
draw1DLayer(6);

/**
 * run the animation to do updates
 */
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
  handleCameraMovement(camera);
}
animate();

/**
 * Setup event listeners.
 */
const canvas = document.getElementById('drawingCanvas');
const resetButton = document.getElementById('resetCanvas');
function setupEventListeners() {
  canvas.addEventListener('mousedown', (e) => {
    updateCubeColors();
  });
  canvas.addEventListener('mousemove', (e) => {
    updateCubeColors();
  });
  resetButton.addEventListener('click', updateCubeColors);
}
setupEventListeners();
