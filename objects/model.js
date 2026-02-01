
var modelController;

const defaultSubdivisions = 5;
var subdivisions = defaultSubdivisions;
const DEBUG_MODEL = false;

class Model {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.vao = null;
        this.vertexBuffer = null;
        this.normalBuffer = null;
        this.modelToWorldMatrixLoc = null;
        this.modelToWorldMatrix = null;
        this.projectionMatrixLoc = null;
        this.viewMatrixLoc = null;
        this.transformNormalsMatrixLoc = null;
        this.cameraWorldPositionLoc = null;
        this.geometry = null;
    }

    init() {
        const gl = this.gl;
        // Initialize and load shaders. Uses function from init_shader.js
        this.program = initShaders(gl, "model-vertex-shader", "model-fragment-shader");

        // Make this the current shader program
        gl.useProgram(this.program);

        // Create model VAO and buffers
        this.vao = gl.createVertexArray();
        this.vertexBuffer = gl.createBuffer();
        this.normalBuffer = gl.createBuffer();

        // generate the teapot model
        this.geometry = createTeapotGeometry(defaultSubdivisions);
        this.loadModel(this.geometry, 20, 0);

        // Get matrix uniform locations and send to GPU
        this.modelToWorldMatrixLoc = gl.getUniformLocation(this.program, "modelToWorldMatrix");
        gl.uniformMatrix4fv(this.modelToWorldMatrixLoc, false, flatten(this.modelToWorldMatrix));

        // Get matrix uniform locations
        this.viewMatrixLoc = gl.getUniformLocation(this.program, "uModelViewMatrix");
        this.projectionMatrixLoc = gl.getUniformLocation(this.program, "uProjectionMatrix");
        this.transformNormalsMatrixLoc = gl.getUniformLocation(this.program, "uTransformNormalsMatrix");
        this.cameraWorldPositionLoc = gl.getUniformLocation(this.program, "uCameraWorldPosition");

        if (typeof materialShininess !== "undefined") {
            gl.uniform1f(gl.getUniformLocation(this.program, "uShininess"), materialShininess);
        }
    }

    loadModel(modelGeometry, modelScale=1, verticalOffset=0) {
        const gl = this.gl;
        // modelGeometry should be a 2D array where [0] is vertex positions and [1] is normal vectors
        // each are length 4
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        if (DEBUG_MODEL) {
            console.log('Vertices: ' + modelGeometry[0].length + ",\nVertex Normals: " + modelGeometry[1].length);

            console.log("vertex (x,y,z,w): "  + modelGeometry[0][0].length + " components \n"
                    + "normal (x,y,z,w): "  +  modelGeometry[1][0].length + " components (last component is 0!)");

            console.log("first 5 vertices\n");
            for (let k = 0; k < 5; k++) 
                console.log("\tvertex " + k + ": " + modelGeometry[0][k]);

            console.log("first 5 normals\n");
            for (let k = 0; k < 5; k++) 
                console.log("\tvertex " + k + ": " + modelGeometry[1][k]);
        }

        // make matrix to scale the model up and have it sit level on the grid
        this.modelToWorldMatrix = mat4(modelScale, 0.0, 0.0, 0.0,
                                    0.0, modelScale, 0.0, verticalOffset,
                                    0.0, 0.0, modelScale, 0.0,
                                    0.0, 0.0, 0.0, 1.0); 
        
        // vertex buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(modelGeometry[0])), gl.STATIC_DRAW);

        var positionLoc = gl.getAttribLocation(this.program, "aPosition");
        gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLoc);

        // normal buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, this.normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(modelGeometry[1])), gl.STATIC_DRAW);

        var normalLoc = gl.getAttribLocation(this.program, "aNormal");
        gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLoc);

        if (DEBUG_MODEL) {
            console.log("positionLoc:", positionLoc);
            console.log("normalLoc:", normalLoc);
        }

        // Unbind model VAO
        gl.bindVertexArray(null);
    }

    updateTransformFromUI() {
        const gl = this.gl;
        gl.useProgram(this.program);

        let modelXPos = getInputValue("Model_X_Pos");
        let modelYPos = getInputValue("Model_Y_Pos");
        let modelZPos = getInputValue("Model_Z_Pos");

        let modelXRot = getInputValue("Model_X_Rot");
        let modelYRot = getInputValue("Model_Y_Rot");
        let modelZRot = getInputValue("Model_Z_Rot");

        let modelXScale = getInputValue("Model_X_Scale");
        let modelYScale = getInputValue("Model_Y_Scale");
        let modelZScale = getInputValue("Model_Z_Scale");

        // Compute the sines and cosines of theta for each of the three axes.
        const angles = vec3(radians(modelXRot), radians(modelYRot), radians(modelZRot));
        if (DEBUG_MODEL) {
            console.log(angles)
        }

        const c = vec3(Math.cos(angles[0]), Math.cos(angles[1]), Math.cos(angles[2]));
        const s = vec3(Math.sin(angles[0]), Math.sin(angles[1]), Math.sin(angles[2]));

        // Remeber: these matrices are column-major
        const rotXMatrix = mat4( 1.0,  0.0,  0.0, 0.0,
                0.0,  c[0],  -s[0], 0.0,
                0.0, s[0],  c[0], 0.0,
                0.0,  0.0,  0.0, 1.0 );

        const rotYMatrix = mat4( c[1], 0.0, s[1], 0.0,
                0.0, 1.0,  0.0, 0.0,
                -s[1], 0.0,  c[1], 0.0,
                0.0, 0.0,  0.0, 1.0 );


        const rotZMatrix = mat4( c[2], -s[2], 0.0, 0.0,
                s[2],  c[2], 0.0, 0.0,
                0.0,  0.0, 1.0, 0.0,
                0.0,  0.0, 0.0, 1.0 );

        const scaleMatrix = mat4(
            modelXScale, 0.0, 0.0, 0.0,
            0.0, modelYScale, 0.0, 0.0,
            0.0, 0.0, modelZScale, 0.0,
            0.0, 0.0, 0.0, 1.0
        );

        const translateMatrix = mat4(
            1.0, 0.0, 0.0, modelXPos,
            0.0, 1.0, 0.0, modelYPos,
            0.0, 0.0, 1.0, modelZPos,
            0.0, 0.0, 0.0, 1.0
        );

        const accumulatedRotations = mult(rotZMatrix, mult(rotYMatrix, rotXMatrix));

        // acculumate transformations
        this.modelToWorldMatrix = mult(translateMatrix, mult(accumulatedRotations, scaleMatrix));

        gl.uniformMatrix4fv(this.modelToWorldMatrixLoc, false, flatten(this.modelToWorldMatrix));
    }

    updateSubdivisionsFromUI() {
        // Get number of subdivisions from the UI
        let numSubdivisions = getInputValue("Model_Subdivisions");

        // recreate the new model with the selected number of subdivisions
        this.geometry = createTeapotGeometry(numSubdivisions);
        this.loadModel(this.geometry, 30, 0);
    }

    draw(modelViewMatrix, projectionMatrix, cameraWorldPosition) {
        const gl = this.gl;
        const transformNormalsMatrix = normalMatrix(this.modelToWorldMatrix, true);

        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.uniformMatrix4fv(this.projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(this.viewMatrixLoc, false, flatten(modelViewMatrix));
        gl.uniformMatrix3fv(this.transformNormalsMatrixLoc, false, flatten(transformNormalsMatrix));
        gl.uniform3fv(this.cameraWorldPositionLoc, flatten(cameraWorldPosition));
        gl.drawArrays(gl.TRIANGLES, 0, this.geometry[0].length);
    }
}

function makeModelProgram() {
    modelController = new Model(gl);
    modelController.init();
}
