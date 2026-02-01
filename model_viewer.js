var gl, canvas;    

var modelViewMatrix;


function resizeCanvas() {
    // Called when the window is resized. Updates the canvas element size
    const canvas = document.getElementById("gl-canvas");
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    // Match drawing buffer to displayed size for correct aspect + sharpness
    canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));

    aspectRatio = rect.width / rect.height;
    
    // Update WebGL viewport to match new canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
}


// Runs after HTML page is loaded
window.onload = function init() {

    // Get canvas element
    canvas = document.getElementById("gl-canvas");
    
    const rect = canvas.getBoundingClientRect();
    const pixelRatio = window.devicePixelRatio || 1;

    canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
    canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
    aspectRatio = rect.width / rect.height;

    // Handle window resizing
    window.addEventListener("resize", resizeCanvas);

    // Initialize WebGL
    gl = canvas.getContext('webgl2');
    // Check for errors
    if (!gl) alert("WebGL 2.0 isn't available");

    // Specify viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Set a viewport background color
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    // Construct everything needed for the model program (model.js)
    makeModelProgram(); 

    // Use the handle_input.js script to manage functionality for user input (handle_input.js)
    handeInput();

    // Set initial camera position (quaterion_camera.js)
    updateQuatCamera();

    // Construct everything needed for the lighting program (light.js)
    makeLightProgram();

    // Use the grid.js script to make the grid and axis lines (grid.js)
    makeGridProgram();

    // Update lighting values with those from the UI (light.js)
    updateLighting();

    render();
}


// Render Loop
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // calculate the camera perspective matrix
    let projectionMatrix = perspectiveCamera(fov, aspectRatio, 1, near, far);

    // calculate normal matrix to transform normals
    transformNormalsMatrix = normalMatrix(modelModelToWorldMatrix, true);

    // ------------------------  Draw Model  ----------------------------
    gl.useProgram(modelProgram);
    gl.bindVertexArray(modelVAO);
    gl.uniformMatrix4fv(modelProjectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix3fv(transformNormalsMatrixLoc, false, flatten(transformNormalsMatrix));
    gl.uniform3fv(cameraWorldPositionLoc, flatten(cameraWorldPosition));
    gl.drawArrays(gl.TRIANGLES, 0, model_geometry[0].length)

    // ------------------------  Draw grid  ----------------------------
    gl.useProgram(gridProgram);
    gl.bindVertexArray(gridVAO);
    gl.uniformMatrix4fv(gridProjectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(gridModelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINES, 0, gridVertexCount);

    // ------------------------  Draw light Point  ----------------------------
    gl.useProgram(lightProgram);
    gl.bindVertexArray(lightVAO);
    gl.uniformMatrix4fv(lightProjectionMatrixLoc, false, flatten(projectionMatrix));
    gl.uniformMatrix4fv(lightModelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.drawArrays(gl.LINE_LOOP, 0, 8);
    gl.drawArrays(gl.LINE_LOOP, 8, 8);
    gl.drawArrays(gl.LINE_LOOP, 16, 8);


    gl.bindVertexArray(null);
    requestAnimationFrame(render);
}
