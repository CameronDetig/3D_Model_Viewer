
var lightController;

const lightPoints = [
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
];

const scaledLightPoints = lightPoints.map(point => point.map(value => value * 4));

class Light {
    constructor(gl) {
        this.gl = gl;
        this.program = null;
        this.vao = null;
        this.projectionMatrixLoc = null;
        this.modelViewMatrixLoc = null;
        this.modelToWorldMatrixLoc = null;
        this.lightWorldPosition = vec3(0.0, 0.0, 0.0);
        this.lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
        this.lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);
        this.lightAmbient = vec4(0.0, 0.0, 0.0, 1.0);
        this.materialDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
        this.materialSpecular = vec4(1.0, 1.0, 1.0, 1.0);
        this.materialAmbient = vec4(1.0, 1.0, 1.0, 1.0);
        this.materialShininess = 1.0;
    }

    init(modelViewMatrix) {
        const gl = this.gl;
        this.program = initShaders(gl, "light-vertex-shader", "light-fragment-shader");
        gl.useProgram(this.program);

        // Create light VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        const lightVertexBuffer = gl.createBuffer();

        // Don't need to scale the light as it is already in world coords, so just scale by 1
        let lightModelToWorldMatrix = mat4(1, 0.0, 0.0, 0.0,
                                        0.0, 1, 0.0, 0.0,
                                        0.0, 0.0, 1, 0.0,
                                        0.0, 0.0, 0.0, 1); 
        this.modelToWorldMatrixLoc = gl.getUniformLocation(this.program, "uModelToWorldMatrix");
        gl.uniformMatrix4fv(this.modelToWorldMatrixLoc, false, flatten(lightModelToWorldMatrix));

        // Get matrix uniform locations
        this.projectionMatrixLoc = gl.getUniformLocation(this.program, "uProjectionMatrix");
        this.modelViewMatrixLoc = gl.getUniformLocation(this.program, "uModelViewMatrix");
        gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(modelViewMatrix));

        // light vertex array attribute buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, lightVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, flatten(scaledLightPoints), gl.STATIC_DRAW);

        var lightPositionLoc = gl.getAttribLocation(this.program, "aPosition");
        gl.vertexAttribPointer(lightPositionLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(lightPositionLoc);

        
        this.lightDiffuse = this.getColorFromElement("light_diffuse_color");
        gl.uniform4fv(gl.getUniformLocation(this.program, "uLightColor"), flatten(this.lightDiffuse));

        // Unbind light VAO
        gl.bindVertexArray(null);
    }

    updateFromUI(modelProgram, modelVAO) {
        let lightX = this.getInputValue("Light_X_Pos");
        let lightY = this.getInputValue("Light_Y_Pos");
        let lightZ = this.getInputValue("Light_Z_Pos");

        this.lightWorldPosition = vec3(lightX, lightY, lightZ);

        // ------------ Model Program ------------

        this.lightDiffuse = this.getColorFromElement("light_diffuse_color");
        this.lightSpecular = this.getColorFromElement("light_specular_color");
        this.lightAmbient = this.getColorFromElement("light_ambient_color");

        this.materialDiffuse = this.getColorFromElement("material_diffuse_color");
        this.materialSpecular = this.getColorFromElement("material_specular_color");
        this.materialAmbient = this.getColorFromElement("material_ambient_color");

        this.materialShininess = this.getInputValue("Material_Shininess");

        const gl = this.gl;
        gl.useProgram(modelProgram);
        gl.bindVertexArray(modelVAO);
        gl.uniform3fv(gl.getUniformLocation(modelProgram, "uLightWorldPosition"), flatten(this.lightWorldPosition));

        gl.uniform1f(gl.getUniformLocation(modelProgram, "uDiffuseIntensity"), this.getInputValue("Light_Diffuse_Intensity"));
        gl.uniform1f(gl.getUniformLocation(modelProgram, "uSpecularIntensity"), this.getInputValue("Light_Specular_Intensity"));
        gl.uniform1f(gl.getUniformLocation(modelProgram, "uAmbientIntensity"), this.getInputValue("Light_Ambient_Intensity"));

        let ambientProduct = mult(this.lightAmbient, this.materialAmbient);
        let diffuseProduct = mult(this.lightDiffuse, this.materialDiffuse);
        let specularProduct = mult(this.lightSpecular, this.materialSpecular);

        gl.uniform4fv(gl.getUniformLocation(modelProgram, "uAmbientProduct"), flatten(ambientProduct));
        gl.uniform4fv(gl.getUniformLocation(modelProgram, "uDiffuseProduct"), flatten(diffuseProduct));
        gl.uniform4fv(gl.getUniformLocation(modelProgram, "uSpecularProduct"), flatten(specularProduct));

        gl.uniform1f(gl.getUniformLocation(modelProgram, "uShininess"), this.materialShininess);

        // ------------ Light Program ------------
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);

        let lightModelToWorldMatrix = mat4(1, 0.0, 0.0, this.lightWorldPosition[0],
                                        0.0, 1, 0.0, this.lightWorldPosition[1],
                                        0.0, 0.0, 1, this.lightWorldPosition[2],
                                        0.0, 0.0, 0.0, 1); 

        gl.uniformMatrix4fv(this.modelToWorldMatrixLoc, false, flatten(lightModelToWorldMatrix));
        gl.uniform4fv(gl.getUniformLocation(this.program, "uLightColor"), this.lightDiffuse);
    }

    draw(modelViewMatrix, projectionMatrix) {
        const gl = this.gl;
        gl.useProgram(this.program);
        gl.bindVertexArray(this.vao);
        gl.uniformMatrix4fv(this.projectionMatrixLoc, false, flatten(projectionMatrix));
        gl.uniformMatrix4fv(this.modelViewMatrixLoc, false, flatten(modelViewMatrix));
        gl.drawArrays(gl.LINE_LOOP, 0, 8);
        gl.drawArrays(gl.LINE_LOOP, 8, 8);
        gl.drawArrays(gl.LINE_LOOP, 16, 8);
    }

    getColorFromElement(elementID) {
        let element = document.getElementById(elementID);
        if (!element) {
            throw new Error(`Missing UI element: ${elementID}`);
        }
        let ColorHex = element.value;
        let r = parseInt(ColorHex.slice(1, 3), 16) / 255;
        let g = parseInt(ColorHex.slice(3, 5), 16) / 255;
        let b = parseInt(ColorHex.slice(5, 7), 16) / 255;

        return vec4(r, g, b, 1.0);
    }

    getInputValue(elementID) {
        let element = document.getElementById(elementID);
        let elementStr = element.value;
        let elementVal = Number(elementStr);

        return elementVal
    }
}

function makeLightProgram() {
    lightController = new Light(gl);
    lightController.init(cameraController.modelViewMatrix);
}
