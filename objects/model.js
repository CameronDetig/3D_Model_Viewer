
var modelProgram;
var modelVAO;

// Buffers
var modelVertexBuffer, modelNormalBuffer;

var modelModelToWorldMatrixLoc;
var modelModelToWorldMatrix; 

var modelProjectionMatrixLoc, modelViewMatrixLoc;
var transformNormalsMatrix, transformNormalsMatrixLoc;

var model_geometry;

const defaultSubdivisions = 5;
var subdivisions = defaultSubdivisions;

function makeModelProgram() {

    // Initialize and load shaders. Uses function from init_shader.js
    modelProgram = initShaders(gl, "model-vertex-shader", "model-fragment-shader");

    // Make this the current shader program
    gl.useProgram(modelProgram);

    // Create model VAO and buffers
    modelVAO = gl.createVertexArray();
    modelVertexBuffer = gl.createBuffer();
    modelNormalBuffer = gl.createBuffer();

    // generate the teapot model
	model_geometry = createTeapotGeometry(defaultSubdivisions);
    loadModel(model_geometry, modelScale=20, verticalOffset=0);

    // Get matrix uniform locations and send to GPU
    modelModelToWorldMatrixLoc = gl.getUniformLocation(modelProgram, "modelToWorldMatrix");
    gl.uniformMatrix4fv(modelModelToWorldMatrixLoc, false, flatten(modelModelToWorldMatrix));

    // Get matrix uniform locations
    modelViewMatrixLoc = gl.getUniformLocation(modelProgram, "uModelViewMatrix");
    modelProjectionMatrixLoc = gl.getUniformLocation(modelProgram, "uProjectionMatrix");
    transformNormalsMatrixLoc = gl.getUniformLocation(modelProgram, "uTransformNormalsMatrix");
    cameraWorldPositionLoc = gl.getUniformLocation(modelProgram, "uCameraWorldPosition");

    gl.uniform1f(gl.getUniformLocation(modelProgram, "uShininess"), materialShininess);
}


function loadModel(modelGeometry, modelScale=1, verticalOffset=0) {
    // modelGeometry should be a 2D array where [0] is vertex positions and [1] is normal vectors
    // each are length 4
    gl.useProgram(modelProgram);
    gl.bindVertexArray(modelVAO);

    console.log('Vertices: ' + modelGeometry[0].length + ",\nVertex Normals: " + modelGeometry[1].length);

	console.log("vertex (x,y,z,w): "  + modelGeometry[0][0].length + " components \n"
	          + "normal (x,y,z,w): "  +  modelGeometry[1][0].length + " components (last component is 0!)");

    console.log("first 5 vertices\n");
	for (let k = 0; k < 5; k++) 
		console.log("\tvertex " + k + ": " + modelGeometry[0][k]);

	console.log("first 5 normals\n");
	for (let k = 0; k < 5; k++) 
		console.log("\tvertex " + k + ": " + modelGeometry[1][k]);

    // make matrix to scale the model up and have it sit level on the grid
    modelModelToWorldMatrix = mat4(modelScale, 0.0, 0.0, 0.0,
						        0.0, modelScale, 0.0, verticalOffset,
						        0.0, 0.0, modelScale, 0.0,
						        0.0, 0.0, 0.0, 1.0); 
	
	// vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, modelVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(modelGeometry[0])), gl.STATIC_DRAW);

	var positionLoc = gl.getAttribLocation(modelProgram, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

	// normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, modelNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(modelGeometry[1])), gl.STATIC_DRAW);

	var normalLoc = gl.getAttribLocation(modelProgram, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);

	console.log("positionLoc:", positionLoc);
	console.log("normalLoc:", normalLoc);

    // Unbind model VAO
    gl.bindVertexArray(null);
}


function updateModelTransform() {

    gl.useProgram(modelProgram);

    let modelXPos = getInputValue("Model_X_Pos");
    let modelYPos = getInputValue("Model_Y_Pos");
    let modelZPos = getInputValue("Model_Z_Pos");

    let modelXRot = getInputValue("Model_X_Rot");
    let modelYRot = getInputValue("Model_Y_Rot");
    let modelZRot = getInputValue("Model_Z_Rot");

    let modelXScale = getInputValue("Model_X_Scale");
    let modelYScale = getInputValue("Model_Y_Scale");
    let modelZScale = getInputValue("Model_Z_Scale");

    // // send matrix to GPU
    // modelModelToWorldMatrix = mat4(modelXScale, 0.0, 0.0, modelXPos,
	// 					            0.0, modelYScale, 0.0, modelYPos,
	// 					            0.0, 0.0, modelZScale, modelZPos,
	// 					            0.0, 0.0, 0.0, 1.0); 


    // Compute the sines and cosines of theta for each of the three axes.
    angles = vec3(radians(modelXRot), radians(modelYRot), radians(modelZRot));
    console.log(angles)

    c = vec3(Math.cos(angles[0]), Math.cos(angles[1]), Math.cos(angles[2]));
    s = vec3(Math.sin(angles[0]), Math.sin(angles[1]), Math.sin(angles[2]));

    // Remeber: these matrices are column-major
    rotXMatrix = mat4( 1.0,  0.0,  0.0, 0.0,
            0.0,  c[0],  -s[0], 0.0,
            0.0, s[0],  c[0], 0.0,
            0.0,  0.0,  0.0, 1.0 );

    rotYMatrix = mat4( c[1], 0.0, s[1], 0.0,
            0.0, 1.0,  0.0, 0.0,
            -s[1], 0.0,  c[1], 0.0,
            0.0, 0.0,  0.0, 1.0 );


    rotZMatrix = mat4( c[2], -s[2], 0.0, 0.0,
            s[2],  c[2], 0.0, 0.0,
            0.0,  0.0, 1.0, 0.0,
            0.0,  0.0, 0.0, 1.0 );

    scaleMatrix = mat4(
        modelXScale, 0.0, 0.0, 0.0,
        0.0, modelYScale, 0.0, 0.0,
        0.0, 0.0, modelZScale, 0.0,
        0.0, 0.0, 0.0, 1.0
    );

    translateMatrix = mat4(
        1.0, 0.0, 0.0, modelXPos,
        0.0, 1.0, 0.0, modelYPos,
        0.0, 0.0, 1.0, modelZPos,
        0.0, 0.0, 0.0, 1.0
    );

    accumulatedRotations = mult(rotZMatrix, mult(rotYMatrix, rotXMatrix));

    // acculumate transformations
    modelModelToWorldMatrix = mult(translateMatrix, mult(accumulatedRotations, scaleMatrix));

    gl.uniformMatrix4fv(modelModelToWorldMatrixLoc, false, flatten(modelModelToWorldMatrix));

}


function updateModelSubdivisions() {

    // Get number of subdivisions from the UI
    let numSubdivisions = getInputValue("Model_Subdivisions");

    // recreate the new model with the selected number of subdivisions
    model_geometry = createTeapotGeometry(numSubdivisions);
    loadModel(model_geometry, modelScale=30, verticalOffset=0);
}


