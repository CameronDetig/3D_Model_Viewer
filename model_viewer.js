var gl, program;

// VAOs
var modelVAO, gridVAO;

// Buffers
var iBuffer, vBuffer, cBuffer;
var gridVertexBuffer, gridColorBuffer;

// size of the world coordinates
var worldCoords = [100, 100, 100];
var worldToNDCMatrixLoc;
var worldToNDCMatrix =   [[1.0/worldCoords[0], 0.0, 0.0, 0.0],
						  [0.0, 1.0/worldCoords[1], 0.0, 0.0],
						  [0.0, 0.0, 1.0/worldCoords[2], 0.0],
						  [0.0, 0.0, 0.0, 1.0]];

var modelScale = 1;
var modelToWorldMatrixLoc;
var modelToWorldMatrix = [[modelScale, 0.0, 0.0, 0.0],
						  [0.0, modelScale, 0.0, 0.0],
						  [0.0, 0.0, modelScale, 0.0],
						  [0.0, 0.0, 0.0, 1.0]]; 

var modelViewMatrix, modelViewMatrixLoc;
var projectionMatrix, projectionMatrixLoc;

// Camera Variables
const defaultNear = 0.1;
var nearSlider = defaultNear;
var near = defaultNear;

const defaultFar = 20;
var farSlider = defaultFar;
var far = defaultFar;

const defaultRadius = 4;
var cameraRadius = defaultRadius;

const defaultFOV = 45;
var fov = defaultFOV;  // Field-of-view in Y direction angle (in degrees)
var fovSlider = defaultFOV;

var horizAngle = Math.PI / 2; // theta
var vertAngle = Math.PI / 2; // phi

var aspectRatio = 1.0; // Viewport aspect ratio

var cameraPosition;
var lookAtPoint = vec3(0.0, 0.5, 0.0);
const cameraUpVector = vec3(0.0, 1.0, 0.0);

// Variables for viewport interaction
var leftClickIsDragging = false;
var lastMouseX, lastMouseY;
var orbitSpeed = 0.005;

var middleClickIsDragging = false;
var rightClickIsDragging = false;

// Misc variables
var gridVertexCount = 0;
var selectedModelIndicesLength = 0;

function randFloat(min, max) {
    // Returns a random float within the range of min and max
    return Math.random() * (max - min) + min;
}

function resizeCanvas() {
    // Called when the window is resized. Updates the canvas element size
    const canvas = document.getElementById("gl-canvas");

    // Calculate available space 
    canvas.height = window.innerHeight * 0.95;
    canvas.width = window.innerWidth - 500;  // reserve 600 pixels for the controls on the right;

    aspectRatio = canvas.width / canvas.height;
    
    // Update WebGL viewport to match new canvas size
    gl.viewport(0, 0, canvas.width, canvas.height);
}

function resetView() {
    near = defaultNear;
    nearSliderValueDisplay.innerHTML = defaultNear;
    nearSlider.value = defaultNear;

    far = defaultFar;
    farSliderValueDisplay.innerHTML = defaultFar;
    farSlider.value = defaultFar;

    fov = defaultFOV;
    fovSliderValueDisplay.innerHTML = defaultFOV;
    fovSlider.value = defaultFOV;

    cameraRadius = defaultRadius;

    horizAngle = Math.PI / 2; // theta
    vertAngle = Math.PI / 2; // phi
    lastMouseX = 0.0;
    lastMouseY = 0.0;

    lookAtPoint = vec3(0.0, 0.5, 0.0);
}

function focusViewToModel() {

    cameraRadius = defaultRadius;

    lastMouseX = 0.0;
    lastMouseY = 0.0;

    lookAtPoint = vec3(0.0, 0.5, 0.0);
}


function loadModel(modelVertices, modelIndices, modelScale=1, verticalOffset=0) {
    gl.bindVertexArray(modelVAO);

    // array element buffer
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, iBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(modelIndices), gl.STATIC_DRAW);

    let movedModelVertices = [];
    // move the model up so it sits on the grid plane
    for (let i = 0; i < modelVertices.length; i++) {
        movedModelVertices.push([modelVertices[i][0] * modelScale,
                                modelVertices[i][1] * modelScale + verticalOffset,
                                modelVertices[i][2] * modelScale]);
    }

    // vertex array attribute buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(movedModelVertices), gl.STATIC_DRAW);

    var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

    // color array attribute buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, cBuffer);

    let positionRanges =   {"x_min": Infinity, "x_max": -Infinity,
                            "y_min": Infinity, "y_max": -Infinity,
                            "z_min": Infinity, "z_max": -Infinity}
    // Find the min and max value ranges
    for (let i = 0; i < movedModelVertices.length; i++) {
        positionRanges["x_min"] = Math.min(positionRanges["x_min"], movedModelVertices[i][0]);
        positionRanges["x_max"] = Math.max(positionRanges["x_max"], movedModelVertices[i][0]);

        positionRanges["y_min"] = Math.min(positionRanges["y_min"], movedModelVertices[i][1]);
        positionRanges["y_max"] = Math.max(positionRanges["y_max"], movedModelVertices[i][1]);

        positionRanges["z_min"] = Math.min(positionRanges["z_min"], movedModelVertices[i][2]);
        positionRanges["z_max"] = Math.max(positionRanges["z_max"], movedModelVertices[i][2]);
    }

    // Create color array with same length as vertices
    let vertexColors = [];
    for (let i = 0; i < movedModelVertices.length; i++) {

        let offset = randFloat(-0.1, 0.1)
        // Map the colors as a relationship to vertex position
        vertexColors.push([(movedModelVertices[i][0] - positionRanges["x_min"]) / (positionRanges["x_max"] - positionRanges["x_min"]) + offset, 
                            (movedModelVertices[i][1] - positionRanges["y_min"]) / (positionRanges["y_max"] - positionRanges["y_min"]) + offset,
                            (movedModelVertices[i][2] - positionRanges["z_min"]) / (positionRanges["z_max"] - positionRanges["z_min"] + offset),
                            1.0]); 
    }
    gl.bufferData(gl.ARRAY_BUFFER, flatten(vertexColors), gl.STATIC_DRAW);

    var colorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(colorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(colorLoc);

    // Unbind model VAO
    gl.bindVertexArray(null);

    selectedModelIndicesLength = modelIndices.length;
}


// Runs after HTML page is loaded
window.onload = function init() {

    // Get canvas element
    const canvas = document.getElementById("gl-canvas");
    
    canvas.height = window.innerHeight * 0.95;
    canvas.width = window.innerWidth - 500;  // reserve 600 pixels for the controls on the right;
    aspectRatio = canvas.width / canvas.height;

    // Initialize WebGL
    gl = canvas.getContext('webgl2');
    // gl = initWebGL(canvas);

    // Check for errors
    if (!gl) alert("WebGL 2.0 isn't available");

    // Specify viewport
    gl.viewport(0, 0, canvas.width, canvas.height);

    // Set a viewport background color
    gl.clearColor(0.5, 0.5, 0.5, 1.0);

    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

    gl.lineWidth(10.0);

    // Initialize and load shaders. Uses function from init_shader.js
    program = initShaders(gl, "vertex-shader", "fragment-shader");

    // Make this the current shader program
    gl.useProgram(program);

    // Create model VAO and buffers
    modelVAO = gl.createVertexArray();
    iBuffer = gl.createBuffer();
    vBuffer = gl.createBuffer();
    cBuffer = gl.createBuffer();

    loadModel(teapot_vertices, teapot_indices, 1, 40);

    // Get matrix uniform locations and send to GPU
    worldToNDCMatrixLoc = gl.getUniformLocation(program, "worldToNDCMatrix");
    gl.uniformMatrix4fv(worldToNDCMatrixLoc, false, flatten(worldToNDCMatrix));

    modelToWorldMatrixLoc = gl.getUniformLocation(program, "modelToWorldMatrix");
    gl.uniformMatrix4fv(modelToWorldMatrixLoc, false, flatten(modelToWorldMatrix));

    // Get matrix uniform locations
    modelViewMatrixLoc = gl.getUniformLocation(program, "uModelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation(program, "uProjectionMatrix");


    const modelDropDown = document.getElementById('modelDropDown');
    modelDropDown.addEventListener('change', function(event) {
        const selectedValue = event.target.value;
        console.log('Selected model:', selectedValue);

        if (selectedValue == 'teapot') {
            // Load teapot model
            loadModel(teapot_vertices, teapot_indices, 1, 40);
        } else if (selectedValue == 'bunny') {
            // Load bunny model
            loadModel(bunny_vertices, bunny_indices, 800, -28);
        }
    });



    // Near Clipping Plane Slider
	nearSlider = document.getElementById("nearClippingPlaneSlider");
	nearSliderValueDisplay = document.getElementById("nearClippingPlaneSliderValue");
	nearSliderValueDisplay.innerHTML = nearSlider.value; // Display initial slider value
	nearSlider.oninput = function() { // Update slider value if it is changed
		nearSliderValueDisplay.innerHTML = this.value;

        if (this.value >= far - 0.1) {
            // Prevent near from going above far
            near = far - 0.1
            nearSliderValueDisplay.innerHTML = near.toFixed(1);;
            nearSlider.value = near.toFixed(1);
        } else {
            near = parseFloat(this.value);
        }
	}

    // Far Clipping Plane Slider
	farSlider = document.getElementById("farClippingPlaneSlider");
	farSliderValueDisplay = document.getElementById("farClippingPlaneSliderValue");
	farSliderValueDisplay.innerHTML = farSlider.value; // Display initial slider value
	farSlider.oninput = function() { // Update slider value if it is changed
		farSliderValueDisplay.innerHTML = this.value;

		if (this.value <= near + 0.1) {
            // Prevent far from going below near
            far = near + 0.1
            farSliderValueDisplay.innerHTML = far.toFixed(1);;
            farSlider.value = far.toFixed(1);
        } else {
            far = parseFloat(this.value);
        }
	}

    // Field of View Slider
	fovSlider = document.getElementById("fovSlider");
	fovSliderValueDisplay = document.getElementById("fovSliderValue");
	fovSliderValueDisplay.innerHTML = fovSlider.value; // Display initial slider value
	fovSlider.oninput = function() { // Update slider value if it is changed
		fovSliderValueDisplay.innerHTML = this.value;
		fov = parseFloat(this.value);
	}

    // ---------------- Mouse camera controls ----------------------------------
    canvas.addEventListener('mousedown', e => {
        switch (e.button) {
            case 0: // Left button
                leftClickIsDragging = true;
                lastMouseX = e.clientX;
                lastMouseY = e.clientY;
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
		// If mouse being moved, update camera variables

        if (leftClickIsDragging || middleClickIsDragging || rightClickIsDragging){
            let deltaX = (e.clientX - lastMouseX);
            let deltaY = (e.clientY - lastMouseY);

            if (leftClickIsDragging) { // Orbit the camera

                // Update the camera angles
                horizAngle += deltaX * orbitSpeed;
                vertAngle += -deltaY * orbitSpeed;

                // Clamp vertical angle to prevent camera flipping over the top or bottom
                vertAngle = Math.max(0.1, Math.min(Math.PI - 0.1, vertAngle));
            } 

            else if (middleClickIsDragging) { // pan the camera

                cameraPosition = vec3(
                    lookAtPoint[0] + cameraRadius * Math.sin(vertAngle) * Math.cos(horizAngle),
                    lookAtPoint[1] + cameraRadius * Math.cos(vertAngle), 
                    lookAtPoint[2] + cameraRadius * Math.sin(vertAngle) * Math.sin(horizAngle)
                );

                // Calculate camera coordinate system
                let viewDirection = normalize(subtract(lookAtPoint, cameraPosition));
                let rightVector = normalize(cross(viewDirection, cameraUpVector));
                let upVector = normalize(cross(rightVector, viewDirection));

                // Convert mouse movement to world space movement
                let panAmount = 0.003; // controls pan sensitivity
                let rightMovement = mult(-deltaX * panAmount, rightVector);
                let upMovement = mult(deltaY * panAmount, upVector);

                // Update lookAt point
                lookAtPoint = add(lookAtPoint, add(rightMovement, upMovement));
            } 

            else if (rightClickIsDragging) { // move the camera forward and backward
                
                cameraRadius += deltaY * 0.01;
                // clamp values
                cameraRadius = Math.max(0.5, Math.min(20, cameraRadius));
            }

            // Save the mouse positions for use in the next frame
            lastMouseX = e.clientX;
            lastMouseY = e.clientY;
        }
	});

    canvas.addEventListener('wheel', e => {
        e.preventDefault(); // prevent page from scrolling

        // adjust camera radius based on mouse scroll wheel
        cameraRadius += e.deltaY * 0.01;
        // clamp values
        cameraRadius = Math.max(0.5, Math.min(20, cameraRadius));
    });

    // Event listener for the Reset button
	const resetButton = document.getElementById("resetButton");
	resetButton.addEventListener("click", resetView);

    window.addEventListener("keydown", function(event) {
        switch (event.key) {
            case "r":
                resetView();
                break;
            case "f":
                focusViewToModel();
                break;
            default:
                console.log("Key Pressed:", event.key);
        }
    });

    // Handle window resizing
    window.addEventListener("resize", resizeCanvas);


    makeGrid();

    render();
}


function makeGrid() {
    let gridVertices = [];
    let gridColors = [];
    
    let gridSize = 200;  
    let numLines = 10;  
    let spacingIncrement = gridSize / numLines;

    let halfGrid = gridSize / 2;
    
    // Lines along Z-axis 
    for (let i = 0; i <= numLines; i++) {
        let distance = (spacingIncrement * i) - halfGrid;
        gridVertices.push(distance, 0, -halfGrid);
        gridVertices.push(distance, 0, halfGrid);

        gridVertices.push(-halfGrid, 0, distance);
        gridVertices.push(halfGrid, 0, distance);
        
        // Colors for 4 vertices
        gridColors.push(0.3, 0.3, 0.3, 1.0);
        gridColors.push(0.3, 0.3, 0.3, 1.0);
        gridColors.push(0.3, 0.3, 0.3, 1.0);
        gridColors.push(0.3, 0.3, 0.3, 1.0);
    }

    // Calculate vertex count
    gridVertexCount = gridVertices.length / 3;

    // Create grid VAO
    gridVAO = gl.createVertexArray();
    gl.bindVertexArray(gridVAO);

    // grid vertex array attribute buffer
    gridVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);

    var gridPositionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(gridPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gridPositionLoc);

    // grid color array attribute buffer
    gridColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridColors), gl.STATIC_DRAW);

    var gridColorLoc = gl.getAttribLocation(program, "aColor");
    gl.vertexAttribPointer(gridColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gridColorLoc);

    // Unbind grid VAO
    gl.bindVertexArray(null);
}


// Render Loop
function render() {
    gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    cameraPosition = vec3(
        lookAtPoint[0] + cameraRadius * Math.sin(vertAngle) * Math.cos(horizAngle),
        lookAtPoint[1] + cameraRadius * Math.cos(vertAngle), 
        lookAtPoint[2] + cameraRadius * Math.sin(vertAngle) * Math.sin(horizAngle)
    );

    modelViewMatrix = lookAtCamera(cameraPosition, lookAtPoint, cameraUpVector);
    projectionMatrix = perspectiveCamera(fov, aspectRatio, 1, near, far);

    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

    // Draw model
    gl.bindVertexArray(modelVAO);
    gl.drawElements(gl.TRIANGLES, selectedModelIndicesLength, gl.UNSIGNED_INT, 0);

    // Draw grid
    gl.bindVertexArray(gridVAO);
    gl.drawArrays(gl.LINES, 0, gridVertexCount);


    gl.bindVertexArray(null);
    requestAnimationFrame(render);
}