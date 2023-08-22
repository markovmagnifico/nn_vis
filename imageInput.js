const canvas = document.getElementById('drawingCanvas');
const ctx = canvas.getContext('2d');
const toggleSwitch = document.getElementById('toggleSwitch');
const resetButton = document.getElementById('resetCanvas');
const brushSizeControl = document.getElementById('brushSize');
const brushTypeToggle = document.getElementById('smoothBrush');

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

  for (let y = 0; y < canvasArray.length; y++) {
    for (let x = 0; x < canvasArray[y].length; x++) {
      const value = canvasArray[y][x];
      if (value > 0) {
        const colorValue = Math.floor(value * 255);
        ctx.fillStyle = `rgb(${colorValue}, ${colorValue}, ${colorValue})`;
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

// Some variables to prevent drawing from saturating the array quickly
let lastDrawPosition = null;
const drawThreshold = 1; // pixels
function drawSmoothPixel(e) {
  if (!drawing) return;

  const rect = canvas.getBoundingClientRect();
  const centerX = Math.floor((e.clientX - rect.left) / scale);
  const centerY = Math.floor((e.clientY - rect.top) / scale);

  // If the last draw position is set, check the distance
  if (lastDrawPosition) {
    const distance = Math.sqrt(
      Math.pow(centerX - lastDrawPosition.x, 2) +
        Math.pow(centerY - lastDrawPosition.y, 2)
    );
    if (distance < drawThreshold) return;
  }
  lastDrawPosition = { x: centerX, y: centerY };

  for (let y = centerY - brushSize; y <= centerY + brushSize; y++) {
    for (let x = centerX - brushSize; x <= centerX + brushSize; x++) {
      if (x >= 0 && x < 28 && y >= 0 && y < 28) {
        const distance = Math.sqrt(
          Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2)
        );
        if (distance <= brushSize) {
          // const newValue =
          //   canvasArray[y][x] + value * (1 - distance / brushSize);
          // canvasArray[y][x] = Math.min(1, Math.max(0, newValue));
          const intensity = 1 - distance / brushSize;
          let value;
          if (drawingMode === 'draw') {
            value = canvasArray[y][x] + intensity;
          } else {
            // erasing
            value = canvasArray[y][x] - intensity * canvasArray[y][x];
          }
          canvasArray[y][x] = Math.min(1, Math.max(0, value));
        }
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

let drawFunction = drawSmoothPixel;
function toggleSmoothDrawing() {
  drawFunction = this.checked ? drawSmoothPixel : drawPixel;
}

function setupEventListeners() {
  canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    lastDrawPosition = null;
    drawFunction(e);
  });
  canvas.addEventListener('mouseup', () => (drawing = false));
  canvas.addEventListener('mousemove', (e) => {
    drawFunction(e);
  });
  canvas.addEventListener('mouseout', () => (drawing = false));
  toggleSwitch.addEventListener('change', toggleDrawingMode);
  resetButton.addEventListener('click', resetCanvas);
  brushSizeControl.addEventListener('input', updateBrushSize);
  brushTypeToggle.addEventListener('change', toggleSmoothDrawing);
}

// Initialization
initializeCanvas();
setupEventListeners();

export default canvasArray;
