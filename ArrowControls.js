let isMouseDown = false;
let prevMousePos = { x: 0, y: 0 };

export function initializeMouseListeners(camera, domElement) {
  domElement.addEventListener('mousedown', (event) => {
    isMouseDown = true;
    prevMousePos.x = event.clientX;
    prevMousePos.y = event.clientY;
  });

  domElement.addEventListener('mousemove', (event) => {
    if (!isMouseDown) return;

    const dx = event.clientX - prevMousePos.x;
    const dy = event.clientY - prevMousePos.y;

    const rotationSpeed = 0.005;

    // Create quaternions for the individual axis rotations
    const qVertical = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(1, 0, 0),
      -dy * rotationSpeed
    );
    const qHorizontal = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      -dx * rotationSpeed
    );

    // Apply the rotations to the camera's quaternion
    camera.quaternion.multiplyQuaternions(qHorizontal, camera.quaternion);
    camera.quaternion.multiplyQuaternions(camera.quaternion, qVertical);

    // Update previous mouse position
    prevMousePos.x = event.clientX;
    prevMousePos.y = event.clientY;
  });

  domElement.addEventListener('mouseup', () => {
    isMouseDown = false;
  });

  domElement.addEventListener('wheel', (event) => {
    const zoomFactor = 1.05;
    if (event.deltaY < 0) {
      camera.position.multiplyScalar(1 / zoomFactor);
    } else if (event.deltaY > 0) {
      camera.position.multiplyScalar(zoomFactor);
    }
  });
}

let keyStates = {
  ArrowUp: false,
  ArrowDown: false,
  ArrowLeft: false,
  ArrowRight: false,
};

export function initializeKeyListeners(controls) {
  document.addEventListener('keydown', function (event) {
    const key = event.key;
    if (keyStates.hasOwnProperty(key)) {
      keyStates[key] = true;
      controls.enabled = false;
    }
  });

  document.addEventListener('keyup', function (event) {
    const key = event.key;
    if (keyStates.hasOwnProperty(key)) {
      keyStates[key] = false;
      controls.enabled = true;
    }
  });
}

export function handleCameraMovement(camera, step = 0.1) {
  let dir = new THREE.Vector3();

  for (const [key, pressed] of Object.entries(keyStates)) {
    if (pressed) {
      switch (key) {
        case 'ArrowUp':
          dir.z -= step;
          break;
        case 'ArrowDown':
          dir.z += step;
          break;
        case 'ArrowLeft':
          dir.x -= step;
          break;
        case 'ArrowRight':
          dir.x += step;
          break;
      }
    }
  }

  camera.position.add(dir);
}
