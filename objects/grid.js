
var gridProgram;
var gridVAO;

// Buffers
var gridVertexBuffer, gridColorBuffer;

var gridVertexCount = 0;

var gridProjectionMatrixLoc, gridModelViewMatrixLoc;


function makeGridProgram() {

    // Initialize and load shaders. Uses function from init_shader.js
    gridProgram = initShaders(gl, "grid-vertex-shader", "grid-fragment-shader");

    gl.useProgram(gridProgram);

    // Create grid VAO
    gridVAO = gl.createVertexArray();
    gl.bindVertexArray(gridVAO);

    // Don't need to scale the grid as it is already in world coords, so just scale by 1
    let gridModelToWorldMatrix = mat4(1, 0.0, 0.0, 0.0,
                                  0.0, 1, 0.0, 0.0,
                                  0.0, 0.0, 1, 0.0,
                                  0.0, 0.0, 0.0, 1); 
    gridModelToWorldMatrixLoc = gl.getUniformLocation(gridProgram, "modelToWorldMatrix");
    gl.uniformMatrix4fv(gridModelToWorldMatrixLoc, false, flatten(gridModelToWorldMatrix));

    // Get matrix uniform locations
    gridProjectionMatrixLoc = gl.getUniformLocation(gridProgram, "uProjectionMatrix");

    gridModelViewMatrixLoc = gl.getUniformLocation(gridProgram, "uModelViewMatrix");
    gl.uniformMatrix4fv(gridModelViewMatrixLoc, false, flatten(modelViewMatrix));
    
    let gridVertices = [];
    let gridColors = [];
    
    let gridSize = 100;  
    let numLines = 10;  
    let spacingIncrement = gridSize / numLines;

    let halfGrid = gridSize / 2;
    
    // Make lines of grid
    for (let i = 0; i <= numLines; i++) {
        let distance = (spacingIncrement * i) - halfGrid;

        if (distance != 0) {

            // Z lines
            gridVertices.push(distance, 0, -halfGrid);
            gridVertices.push(distance, 0, halfGrid);

            // X Lines
            gridVertices.push(-halfGrid, 0, distance);
            gridVertices.push(halfGrid, 0, distance);
            
            // Colors for 4 vertices
            gridColors.push(0.3, 0.3, 0.3, 1.0);
            gridColors.push(0.3, 0.3, 0.3, 1.0);
            gridColors.push(0.3, 0.3, 0.3, 1.0);
            gridColors.push(0.3, 0.3, 0.3, 1.0);
        }
    }

    let axisLength = gridSize * 10

    // + X Line
    gridVertices.push(0, 0, 0);
    gridVertices.push(axisLength, 0, 0);
    gridColors.push(1, 0, 0, 1);
    gridColors.push(0.5, 0.5, 0.5, 1);
    // - X Line
    gridVertices.push(0, 0, 0);
    gridVertices.push(-axisLength, 0, 0);
    gridColors.push(1, 0, 0, 1);
    gridColors.push(0.5, 0.5, 0.5, 1);

    // + Y Line
    gridVertices.push(0, 0, 0);
    gridVertices.push(0, axisLength, 0);
    gridColors.push(0, 1, 0, 1);
    gridColors.push(0.5, 0.5, 0.5, 1);
    // - Y Line
    gridVertices.push(0, 0, 0);
    gridVertices.push(0, -axisLength, 0);
    gridColors.push(0, 1, 0, 1);
    gridColors.push(0.5, 0.5, 0.5, 1);

    // + Z Line
    gridVertices.push(0, 0, 0);
    gridVertices.push(0, 0, axisLength);
    gridColors.push(0, 0, 1, 1);
    gridColors.push(0.5, 0.5, 0.5, 1);
    // - Z Line
    gridVertices.push(0, 0, 0);
    gridVertices.push(0, 0, -axisLength);
    gridColors.push(0, 0, 1, 1);
    gridColors.push(0.5, 0.5, 0.5, 1);

    // Calculate vertex count
    gridVertexCount = gridVertices.length / 3;

    // grid vertex array attribute buffer
    gridVertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridVertices), gl.STATIC_DRAW);

    var gridPositionLoc = gl.getAttribLocation(gridProgram, "aPosition");
    gl.vertexAttribPointer(gridPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gridPositionLoc);

    // grid vertex color buffer
    gridColorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, gridColorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(gridColors), gl.STATIC_DRAW);

    var gridColorLoc = gl.getAttribLocation(gridProgram, "aColor");
    gl.vertexAttribPointer(gridColorLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gridColorLoc);

    // Unbind grid VAO
    gl.bindVertexArray(null);
}