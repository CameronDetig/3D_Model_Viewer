
var lightProgram;
var lightVAO;

// Buffers
var lightVertexBuffer, lightColorBuffer;

var lightProjectionMatrixLoc, lightModelViewMatrixLoc;

// Light and material variables. These are set in the HTML file
var lightWorldPosition;

var lightDiffuse;
var lightSpecular;
var lightAmbient;

var materialDiffuse;
var materialSpecular;
var materialAmbient;

var materialShininess;

var lightPoints = [
    [0, 1, 0],
    [0.7, 0.7, 0],
    [1, 0, 0],
    [0.7, -0.7, 0],
    [0, -1, 0],
    [-0.7, -0.7, 0],
    [-1, 0, 0],
    [-0.7, 0.7, 0],

    [0, 0, 1],
    [0, 0.7, 0.7],
    [0, 1, 0],
    [0, 0.7, -0.7],
    [0, 0, -1],
    [0, -0.7, -0.7],
    [0, -1, 0],
    [0, -0.7, 0.7],

    [1, 0, 0],
    [0.7, 0, 0.7],
    [0, 0, 1],
    [-0.7, 0, 0.7],
    [-1, 0, 0],
    [-0.7, 0, -0.7],
    [0, 0, -1],
    [0.7, 0, -0.7]
]

// Scale up the points
for (let i=0; i < lightPoints.length; i++) {
    for (let j=0; j < 3; j++) {
        lightPoints[i][j] *= 4
    }
}

function makeLightProgram() {

    // Initialize and load shaders. Uses function from init_shader.js
    lightProgram = initShaders(gl, "light-vertex-shader", "light-fragment-shader");

    gl.useProgram(lightProgram);

    // Create light VAO
    lightVAO = gl.createVertexArray();
    gl.bindVertexArray(lightVAO);

    lightVertexBuffer = gl.createBuffer();

    // Don't need to scale the light as it is already in world coords, so just scale by 1
    let lightModelToWorldMatrix = mat4(1, 0.0, 0.0, 0.0,
                                    0.0, 1, 0.0, 0.0,
                                    0.0, 0.0, 1, 0.0,
                                    0.0, 0.0, 0.0, 1); 
    lightModelToWorldMatrixLoc = gl.getUniformLocation(lightProgram, "uModelToWorldMatrix");
    gl.uniformMatrix4fv(lightModelToWorldMatrixLoc, false, flatten(lightModelToWorldMatrix));

    // Get matrix uniform locations
    lightProjectionMatrixLoc = gl.getUniformLocation(lightProgram, "uProjectionMatrix");
    lightModelViewMatrixLoc = gl.getUniformLocation(lightProgram, "uModelViewMatrix");
    gl.uniformMatrix4fv(lightModelViewMatrixLoc, false, flatten(modelViewMatrix));

    // light vertex array attribute buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(lightPoints), gl.STATIC_DRAW);

    var lightPositionLoc = gl.getAttribLocation(lightProgram, "aPosition");
    gl.vertexAttribPointer(lightPositionLoc, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(lightPositionLoc);

    
    let lightColor = getColorFromElement("light_diffuse_color");
    gl.uniform4fv(gl.getUniformLocation(lightProgram, "uLightColor"), flatten(lightColor));


    // Unbind light VAO
    gl.bindVertexArray(null);
}


function getColorFromElement(elementID) {
    let ColorHex = document.getElementById(elementID).value;
    let r = parseInt(ColorHex.slice(1, 3), 16) / 255;
    let g = parseInt(ColorHex.slice(3, 5), 16) / 255;
    let b = parseInt(ColorHex.slice(5, 7), 16) / 255;

    return vec4(r, g, b, 1.0);
}


function updateLighting() {
    let lightX = getInputValue("Light_X_Pos");
    let lightY = getInputValue("Light_Y_Pos");
    let lightZ = getInputValue("Light_Z_Pos");

    lightWorldPosition = vec3(lightX, lightY, lightZ);

    // ------------ Model Program ------------

    lightDiffuse = getColorFromElement("light_diffuse_color");
    lightSpecular = getColorFromElement("light_specular_color");
    lightAmbient = getColorFromElement("light_ambient_color");

    materialDiffuse = getColorFromElement("material_diffuse_color");
    materialSpecular = getColorFromElement("material_specular_color");
    materialAmbient = getColorFromElement("material_ambient_color");

    materialShininess = getInputValue("Material_Shininess");

    gl.useProgram(modelProgram);
    gl.bindVertexArray(modelVAO);
    gl.uniform3fv(gl.getUniformLocation(modelProgram, "uLightWorldPosition"), flatten(lightWorldPosition));

    gl.uniform1f(gl.getUniformLocation(modelProgram, "uDiffuseIntensity"), getInputValue("Light_Diffuse_Intensity"));
    gl.uniform1f(gl.getUniformLocation(modelProgram, "uSpecularIntensity"), getInputValue("Light_Specular_Intensity"));
    gl.uniform1f(gl.getUniformLocation(modelProgram, "uAmbientIntensity"), getInputValue("Light_Ambient_Intensity"));

    let ambientProduct = mult(lightAmbient, materialAmbient);
    let diffuseProduct = mult(lightDiffuse, materialDiffuse);
    let specularProduct = mult(lightSpecular, materialSpecular);

    gl.uniform4fv(gl.getUniformLocation(modelProgram, "uAmbientProduct"), flatten(ambientProduct));
    gl.uniform4fv(gl.getUniformLocation(modelProgram, "uDiffuseProduct"), flatten(diffuseProduct));
    gl.uniform4fv(gl.getUniformLocation(modelProgram, "uSpecularProduct"), flatten(specularProduct));

    gl.uniform1f(gl.getUniformLocation(modelProgram, "uShininess"), materialShininess);

    // ------------ Light Program ------------
    gl.useProgram(lightProgram);
    gl.bindVertexArray(lightVAO);

    let lightModelToWorldMatrix = mat4(1, 0.0, 0.0, lightWorldPosition[0],
                                    0.0, 1, 0.0, lightWorldPosition[1],
                                    0.0, 0.0, 1, lightWorldPosition[2],
                                    0.0, 0.0, 0.0, 1); 

    lightModelToWorldMatrixLoc = gl.getUniformLocation(lightProgram, "uModelToWorldMatrix");
    gl.uniformMatrix4fv(lightModelToWorldMatrixLoc, false, flatten(lightModelToWorldMatrix));

    gl.uniform4fv(gl.getUniformLocation(lightProgram, "uLightColor"), lightDiffuse);
}


function getInputValue(elementID) {
    let element = document.getElementById(elementID);
    let elementStr = element.value;
    let elementVal = Number(elementStr);

    return elementVal
}
