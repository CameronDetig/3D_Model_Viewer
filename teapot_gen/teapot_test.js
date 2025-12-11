var gl, program, canvas;

var vertexBuffer;
var normalBuffer;

var modelScale = 0.25;
var modelToWorldMatrixLoc;
var modelToWorldMatrix = [[modelScale, 0.0, 0.0, 0.0],
						  [0.0, modelScale, 0.0, 0.0],
						  [0.0, 0.0, modelScale, 0.0],
						  [0.0, 0.0, 0.0, 1.0]]; 

window.onload = function init() {

	// Get canvas element
    canvas = document.getElementById("gl-canvas");

	// Initialize WebGL
    gl = canvas.getContext('webgl2');
	// gl = initWebGL(canvas);
	// Check for errors
    if (!gl) alert("WebGL 2.0 isn't available");

	// Initialize and load shaders. Uses function from init_shader.js
    program = initShaders(gl, "vertex-shader", "fragment-shader");
    // Make this the current shader program
    gl.useProgram(program);

	// Specify viewport
    gl.viewport(0, 0, canvas.width, canvas.height);
    // Set a viewport background color
    gl.clearColor(0.5, 0.5, 0.5, 1.0);
    // Enable depth testing
    gl.enable(gl.DEPTH_TEST);

	vertexBuffer = gl.createBuffer();
	normalBuffer = gl.createBuffer();


	// generate the teapot model
	teapot_geom = createTeapotGeometry(4);
	
	console.log('Teapot model: ' +
		teapot_geom[0].length + ' vertices, ' + teapot_geom[1].length + " vertex normals");

	console.log("vertex (x,y,z,w): "  + teapot_geom[0][0].length + " components \n"
	+ "Normal (x,y,z,w: "  +  teapot_geom[1][0].length + " components (last component is 0!)");

	console.log("first 5 vertices\n");
	for (let k = 0; k < 5; k++) 
		console.log("\tvertex " + k + ": " + teapot_geom[0][k]);

	console.log("first 5 normals\n");
	for (let k = 0; k < 5; k++) 
		console.log("\tvertex " + k + ": " + teapot_geom[1][k]);

	console.log(flatten(teapot_geom[0]).length)
	console.log(flatten(teapot_geom[1]).length)

	
	// vertex buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(teapot_geom[0])), gl.STATIC_DRAW);

	var positionLoc = gl.getAttribLocation(program, "aPosition");
    gl.vertexAttribPointer(positionLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(positionLoc);

	// normal buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(flatten(teapot_geom[1])), gl.STATIC_DRAW);

	var normalLoc = gl.getAttribLocation(program, "aNormal");
    gl.vertexAttribPointer(normalLoc, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(normalLoc);


	console.log("positionLoc:", positionLoc);
	console.log("normalLoc:", normalLoc);

	modelToWorldMatrixLoc = gl.getUniformLocation(program, "uModelToWorldMatrix");
    gl.uniformMatrix4fv(modelToWorldMatrixLoc, false, flatten(modelToWorldMatrix));

	render();
}

function render() {
	gl.clear( gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	gl.drawArrays(gl.TRIANGLES, 0, teapot_geom[0].length)
}
