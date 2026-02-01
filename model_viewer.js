var gl, canvas;    
var grid;
var aspectRatio = 1.0;
var inputController;


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

    // Set initial camera position (quaternion_camera.js)
    cameraController = new QuaternionCamera();

    // Construct everything needed for the lighting program (light.js)
    makeLightProgram();

    // Use the handle_input.js script to manage functionality for user input (handle_input.js)
    inputController = new InputController(canvas, cameraController, {
        updateLighting: () => lightController.updateFromUI(modelController.program, modelController.vao),
        updateModelTransform: () => modelController.updateTransformFromUI(),
        updateModelSubdivisions: () => modelController.updateSubdivisionsFromUI()
    });

    // Use the grid.js script to make the grid and axis lines (grid.js)
    grid = new Grid(gl);
    grid.init(cameraController.modelViewMatrix);

    // Update lighting values with those from the UI (light.js)
    lightController.updateFromUI(modelController.program, modelController.vao);

    render();
}


// Render Loop
function render() {
    if (!modelController || !grid || !lightController || !cameraController) {
        requestAnimationFrame(render);
        return;
    }
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // calculate the camera perspective matrix
    let projectionMatrix = perspectiveCamera(cameraController.fov, aspectRatio, 1, cameraController.near, cameraController.far);

    // ------------------------  Draw Model  ----------------------------
    modelController.draw(cameraController.modelViewMatrix, projectionMatrix, cameraController.cameraWorldPosition);

    // ------------------------  Draw grid  ----------------------------
    grid.draw(cameraController.modelViewMatrix, projectionMatrix);

    // ------------------------  Draw light Point  ----------------------------
    lightController.draw(cameraController.modelViewMatrix, projectionMatrix);


    gl.bindVertexArray(null);
    requestAnimationFrame(render);
}
