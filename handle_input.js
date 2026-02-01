
// Variables for viewport interaction
var leftClickIsDragging = false;
var lastMouseX, lastMouseY;

var middleClickIsDragging = false;
var rightClickIsDragging = false;


function handeInput() {

    // ---------------- Mouse camera controls ----------------------------------
    canvas.addEventListener('mousedown', e => {
        e.preventDefault(); // Prevent default browser behavior (middle-click pan, right-click menu)

        switch (e.button) {
            case 0: // Left button
                leftClickIsDragging = true;
                let mouse_pos = normalizeMousePosition(e.clientX, e.clientY)
                lastBallPos = calcTrackballPosition(mouse_pos[0], mouse_pos[1]);
                break;
            case 1: // Middle button
                middleClickIsDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                break;
            case 2: // Right button
                rightClickIsDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
                break;
        }
	});

	canvas.addEventListener('mouseup', e => {
		// If mouse released, set dragging variables to false.
        switch (e.button) {
            case 0: // Left button
                leftClickIsDragging = false;
                break;
            case 1: // Middle button
                middleClickIsDragging = false;
                break;
            case 2: // Right button
                rightClickIsDragging = false;
                break;
        }
	});

	canvas.addEventListener('mousemove', e => {
		// If mouse is being moved, update camera variables
        e.preventDefault(); // Prevent default browser behavior (middle-click pan, right-click menu)

        if (leftClickIsDragging || middleClickIsDragging || rightClickIsDragging){
            let mouseDeltaX = (e.clientX - lastMouseX);
            let mouseDeltaY = (e.clientY - lastMouseY);

            if (leftClickIsDragging) { // Trackball orbit the camera
                let mouse_pos = normalizeMousePosition(e.clientX, e.clientY)
                let curBallPos = calcTrackballPosition(mouse_pos[0], mouse_pos[1]);
                let rotation_speed = 1;

                let ballDelta = subtract(curBallPos, lastBallPos);

                // If there is a change in position on the trackball
                if (magnitude(ballDelta) > 0.0) {
                    // use distance moved along trackball to calculate a rotation amount
                    rotAngle = rotation_speed * magnitude(ballDelta);

                    // Use cross product to calculate the axis to rotate along
                    rotAxis = cross(lastBallPos, curBallPos);
                    
                    // Save this position for use in the next frame's calculation
                    lastBallPos = curBallPos;
                }

                // Update camera variables
                // normalize the rotation axis
                rotAxis = normalize(rotAxis);
                let cos = Math.cos(rotAngle / 2.0);
                let sin = Math.sin(rotAngle / 2.0);

                let rotation = vec4(cos, sin * rotAxis[0], sin * rotAxis[1], sin * rotAxis[2]);
                rotationQuaternion = multq(rotationQuaternion, rotation);

                updateQuatCamera();
            } 

            else if (middleClickIsDragging) { // pan the camera

                // Rotate the initial camera direction by the accumulated quaternion
                let rotatedDirection = quatRotatePoint(initialCameraPosition, rotationQuaternion);
                
                // Scale by camera radius and add to lookAt point
                let cameraPosition = vec3(
                    lookAtPoint[0] + rotatedDirection[0] * cameraRadius,
                    lookAtPoint[1] + rotatedDirection[1] * cameraRadius,
                    lookAtPoint[2] + rotatedDirection[2] * cameraRadius
                );

                // Calculate camera coordinate system
                let viewDirection = normalize(subtract(lookAtPoint, cameraPosition));
                let rightVector = normalize(cross(viewDirection, cameraUpVector));
                let upVector = normalize(cross(rightVector, viewDirection));

                // Convert mouse movement to world space movement
                let panAmount = 0.08; // controls pan sensitivity
                let rightMovement = mult(-mouseDeltaX * panAmount, rightVector);
                let upMovement = mult(mouseDeltaY * panAmount, upVector);

                // Update lookAt point
                lookAtPoint = add(lookAtPoint, add(rightMovement, upMovement));

                updateQuatCamera();
            } 

            else if (rightClickIsDragging) { // move the camera forward and backward
                
                cameraRadius += mouseDeltaY * 0.5;
                // clamp values
                cameraRadius = Math.max(0.1, Math.min(10000, cameraRadius));

                updateQuatCamera();
            }

            // Save the mouse positions for use in the next frame
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
	});

    canvas.addEventListener('wheel', e => {
        e.preventDefault(); // prevent page from scrolling

        // adjust camera radius based on mouse scroll wheel
        cameraRadius += e.deltaY * 0.5;
        // clamp values
        cameraRadius = Math.max(0.1, Math.min(10000, cameraRadius));

        updateQuatCamera();
    });

    // Event listener for the Reset button
	const resetButton = document.getElementById("resetButton");
	resetButton.addEventListener("click", resetCamera);

    window.addEventListener("keydown", function(event) {
        switch (event.key) {
            case "r":
                resetCamera();
                break;
            case "f":
                focusCameraOnModel();
                break;
            default:
                console.log("Key Pressed:", event.key);
        }
    });

    // UI Inputs
    addListener('Model_Subdivisions', updateModelSubdivisions);

    addListener('Near_Clipping', updateClippingPlanes);
    addListener('Far_Clipping', updateClippingPlanes);

    addListener('Camera_FOV', updateFOV);

    // Lighting inputs
    addListener('Light_X_Pos', updateLighting);
    addListener('Light_Y_Pos', updateLighting);
    addListener('Light_Z_Pos', updateLighting);

    addListener('Light_Diffuse_Intensity', updateLighting);
    addListener('Light_Specular_Intensity', updateLighting);
    addListener('Light_Ambient_Intensity', updateLighting);

    addListener('light_diffuse_color', updateLighting);
    addListener('light_specular_color', updateLighting);
    addListener('light_ambient_color', updateLighting);

    addListener('material_diffuse_color', updateLighting);
    addListener('material_specular_color', updateLighting);
    addListener('material_ambient_color', updateLighting);

    addListener('Material_Shininess', updateLighting);

    // Model Inputs
    addListener('Model_X_Pos', updateModelTransform);
    addListener('Model_Y_Pos', updateModelTransform);
    addListener('Model_Z_Pos', updateModelTransform);

    addListener('Model_X_Rot', updateModelTransform);
    addListener('Model_Y_Rot', updateModelTransform);
    addListener('Model_Z_Rot', updateModelTransform);

    addListener('Model_X_Scale', updateModelTransform);
    addListener('Model_Y_Scale', updateModelTransform);
    addListener('Model_Z_Scale', updateModelTransform);
}


function addListener(elemID, functionName) {
    let elem = document.getElementById(elemID);
    elem.addEventListener('input', functionName);
}


function normalizeMousePosition(mouseX, mouseY) {
  // Take in event.clientX and event.clientY and return normalized mouse X and Y 
  // normalizes values to range (-1, 1)
  var rect = canvas.getBoundingClientRect();
  var localX = mouseX - rect.left;
  var localY = mouseY - rect.top;
  var x = 2 * localX / rect.width - 1;
  var y = 2 * (rect.height - localY) / rect.height - 1;

  return [x, y]
}
