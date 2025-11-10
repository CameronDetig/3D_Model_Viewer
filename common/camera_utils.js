//
//  Camera Utility functions
//  Modified from: https://www.interactivecomputergraphics.com/Code/Common/MVnew.js
//                 Interactive Computer Graphics - A Top-Down Approach 8th ed


//---------------  Calculate camera orientation -----------------------------
// "lookAt" function from textbook
function lookAtCamera(cameraPos, lookAtPoint, cameraUpVector)
{
    // Make sure all input variables are vectors
    if (cameraPos.type != 'vec3') { throw "lookAt(): first parameter [cameraPos] must be an a vec3"; }
    if (lookAtPoint.type != 'vec3') { throw "lookAt(): second parameter [lookAtPoint] must be an a vec3"; }
    if (cameraUpVector.type != 'vec3') { throw "lookAt(): third parameter [cameraUpVector] must be an a vec3"; }
    if (equal(cameraPos, lookAtPoint)) { return mat4(); }

    var lookAtVector = normalize( subtract(lookAtPoint, cameraPos) );  // vector for the direction the camera is pointing
    
    var u = normalize( cross(lookAtVector, cameraUpVector) ); // vector pointing to the right of the camera
    var v = normalize( cross(u, lookAtVector) );        // "up" direction relative to the camera
    n = negate(lookAtVector);

    var modelViewMatrix = mat4(
        u[0], u[1], u[2], -dot(u, cameraPos),
        v[0], v[1], v[2], -dot(v, cameraPos),
        n[0], n[1], n[2], -dot(n, cameraPos),
        0.0,  0.0,  0.0,  1.0
    );

    return modelViewMatrix;
}


function calculateCameraAxes(cameraPos, lookAtPoint, cameraUpVector) {
    // console.log(lookAtPoint)
    // Make sure all input variables are vectors
    if (cameraPos.type != 'vec3') { throw "lookAt(): first parameter [cameraPos] must be an a vec3"; }
    // if (lookAtPoint.type != 'vec3') { throw "lookAt(): second parameter [lookAtPoint] must be an a vec3"; }
    if (cameraUpVector.type != 'vec3') { throw "lookAt(): third parameter [cameraUpVector] must be an a vec3"; }
    if (equal(cameraPos, lookAtPoint)) { return mat4(); }

    var lookAtVector = normalize( subtract(lookAtPoint, cameraPos) );  // vector for the direction the camera is pointing
    
    var u = normalize( cross(lookAtVector, cameraUpVector) ); // vector pointing to the right of the camera
    var v = normalize( cross(u, lookAtVector) );        // "up" direction relative to the camera
    n = negate(lookAtVector);

    var cameraAxesMatrix = mat4(
        u[0], u[1], u[2], 0.0,
        v[0], v[1], v[2], 0.0,
        n[0], n[1], n[2], 0.0,
        0.0,  0.0,  0.0,  1.0
    );

    return cameraAxesMatrix;
}

//---------------  Orthographic Matrix Generator -----------------------------
// "ortho" function from the textbook
function orthographicCamera( left, right, bottom, top, near, far )
{
    if ( left == right ) { throw "ortho(): left and right are equal"; }
    if ( bottom == top ) { throw "ortho(): bottom and top are equal"; }
    if ( near == far )   { throw "ortho(): near and far are equal"; }

    var width = right - left;
    var height = top - bottom;
    var depth = far - near;

    var projectionMatrix = mat4();

    // Scale scene to be 2x2x2
    // Translate scene to be centered at 0,0,0
    var projectionMatrix = mat4(
        2.0 / width,    0.0,            0.0,            -(left + right) / width,
        0.0,            2.0 / height,   0.0,            -(top + bottom) / height,
        0.0,            0.0,            -2.0 / depth,   -(near + far) / depth,
        0.0,            0.0,            0.0,            1.0
    );

    return projectionMatrix;
}

//---------------  Perspective Matrix Generator -----------------------------
// "perspective" function from the textbook
function perspectiveCamera( fovy, aspectRatio, vertScale, near, far )
{
    var scalingFactor = 1.0 / Math.tan( radians(fovy) / 2 );
    var depth = far - near;

    var projectionMatrix = mat4(
        scalingFactor/aspectRatio,      0.0,                        0.0,                        0.0,
        0.0,                            scalingFactor/vertScale,    0.0,                        0.0,
        0.0,                            0.0,                        -(near + far) / depth,      -2 * near * far / depth,
        0.0,                            0.0,                        -1,                         0.0
    );

    return projectionMatrix;
}