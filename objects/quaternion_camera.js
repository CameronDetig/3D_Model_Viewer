// Handles the quaternion camera system

var rotAngle = 0.0;
var rotAxis = vec3(0, 0, 1);
var lastBallPos = vec3(0, 0, 0);

var rotationQuaternion = vec4(1, 0, 0, 0);
var initialCameraPosition = vec3(0.0, 0.0, 1.0); // Initial camera position
var cameraRadius = 250;
var cameraWorldPosition, cameraWorldPositionLoc;

var aspectRatio = 1.0; // Viewport aspect ratio

var lookAtPoint = vec3(0.0, 20, 0.0);
const cameraUpVector = vec3(0.0, 1.0, 0.0);

const defaultNear = 1;
var near = defaultNear;

const defaultFar = 1000;
var far = defaultFar;

const defaultFOV = 45;
var fov = defaultFOV;  // Field-of-view in Y direction angle (in degrees)



function multq(q1, q2) {
  // Quaternion Multiplication
  // vec4(a.x*b.x - dot(a.yzw, b.yzw), a.x*b.yzw+b.x*a.yzw+cross(b.yzw, a.yzw))

  var q1_xyz = vec3(q1[1], q1[2], q1[3]);
  var q2_xyz = vec3(q2[1], q2[2], q2[3]);

  return(vec4(q1[0] * q2[0] - dot(q1_xyz, q2_xyz),  // W
              add(cross(q2_xyz, q1_xyz), add(mult(q1[0], q2_xyz), mult(q2[0], q1_xyz)))));  // X, Y, Z
}


function invq(q) {
  // Inverse Quaternion
  // q = [w, x, y, z], conjugate q* = [w, -x, -y, -z]
  var q_dot = dot(q, q);
  
  return vec4(q[0] / q_dot, 
              -q[1] / q_dot, 
              -q[2] / q_dot, 
              -q[3] / q_dot);
}


function quatRotatePoint(point, quaternion) {
    // // q * p * q^-1
    // return (multq(multq(quaternion, point), invq(quaternion)));

    if (!(point.type == "vec3" || point.type == "vec4"))
      throw "point needs to be a vec3 or vec4";

    // Convert point to pure quaternion (w=0, xyz=point)
    var pointQuat = vec4(0, point[0], point[1], point[2]);
    
    // q * p * q^-1
    var result = multq(multq(quaternion, pointQuat), invq(quaternion));
    
    // Return only the xyz components (ignore w which should be ~0)
    return vec3(result[1], result[2], result[3]);
}


function calcTrackballPosition(x, y) {
  // Given 2D mouse coordinates, maps to trackball sphere
  var pos = vec3(x, y, 0);

  // Calc distance from view center
  var distance = pos[0] * pos[0] + pos[1] * pos[1];

  if (distance < 1.0) {
    // Inside the sphere
    pos[2] = Math.sqrt(1.0 - distance);
  } else {
    // Outside the sphere
    pos[0] *= 1.0 / Math.sqrt(distance);
    pos[1] *= 1.0 / Math.sqrt(distance);
    pos[2] = 0.0;
  }

  return pos;
}


function updateQuatCamera() {
    // sets the modelViewMatrix based on the quaternion rotation and look at camera system

    // Rotate the initial camera direction by the accumulated quaternion
    let rotatedDirection = quatRotatePoint(initialCameraPosition, rotationQuaternion);
    
    // Scale by camera radius and add to lookAt point
    cameraWorldPosition = vec3(
        lookAtPoint[0] + rotatedDirection[0] * cameraRadius,
        lookAtPoint[1] + rotatedDirection[1] * cameraRadius,
        lookAtPoint[2] + rotatedDirection[2] * cameraRadius
    );

    modelViewMatrix = lookAtCamera(cameraWorldPosition, lookAtPoint, cameraUpVector);
}


function resetCamera() {
    near = defaultNear;
    far = defaultFar;
    fov = defaultFOV;

    document.getElementById('Near_Clipping').value = near;
    document.getElementById('Far_Clipping').value = far;
    document.getElementById('Camera_FOV').value = fov;

    // Quaternion Trackball Variables
    rotAngle = 0.0;
    rotAxis = vec3(0, 0, 1);
    lastBallPos = vec3(0, 0, 0);

    rotationQuaternion = vec4(1, 0, 0, 0);
    cameraRadius = 250;

    lastMouseX = 0.0;
    lastMouseY = 0.0;

    updateQuatCamera();
}


function focusCameraOnModel() {

    lastMouseX = 0.0;
    lastMouseY = 0.0;

    lookAtPoint = vec3(0.0, 20, 0.0);
    cameraRadius = 250;

    updateQuatCamera();
}


function updateClippingPlanes() {

    let nearInput = getInputValue("Near_Clipping");
    let farInput = getInputValue("Far_Clipping");

    if (nearInput >= far - 1) {
        // Prevent near from going above far
        near = far - 1;
        // Update the UI value
        document.getElementById('Near_Clipping').value = near;
    } else {
        near = nearInput;
    }

    if (farInput <= near + 1) {
        // Prevent far from going below near
        far = near + 1;
        // Update the UI value
        document.getElementById('Far_Clipping').value = far;
    } else {
        far = farInput;
    }
}


function updateFOV() {
    fov = getInputValue("Camera_FOV");
}