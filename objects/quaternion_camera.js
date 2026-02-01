// Handles the quaternion camera system

var cameraController;

const defaultNear = 1;
const defaultFar = 1000;
const defaultFOV = 45;

class QuaternionCamera {
  constructor() {
    this.rotAngle = 0.0;
    this.rotAxis = vec3(0, 0, 1);
    this.lastBallPos = vec3(0, 0, 0);

    this.rotationQuaternion = vec4(1, 0, 0, 0);
    this.initialCameraPosition = vec3(0.0, 0.0, 1.0);
    this.cameraRadius = 250;
    this.cameraWorldPosition = vec3(0.0, 0.0, 0.0);

    this.lookAtPoint = vec3(0.0, 20, 0.0);
    this.cameraUpVector = vec3(0.0, 1.0, 0.0);

    this.near = defaultNear;
    this.far = defaultFar;
    this.fov = defaultFOV;

    this.modelViewMatrix = mat4();
    this.update();
  }

  update() {
    // Rotate the initial camera direction by the accumulated quaternion
    let rotatedDirection = quatRotatePoint(this.initialCameraPosition, this.rotationQuaternion);
    
    // Scale by camera radius and add to lookAt point
    this.cameraWorldPosition = vec3(
      this.lookAtPoint[0] + rotatedDirection[0] * this.cameraRadius,
      this.lookAtPoint[1] + rotatedDirection[1] * this.cameraRadius,
      this.lookAtPoint[2] + rotatedDirection[2] * this.cameraRadius
    );

    this.modelViewMatrix = lookAtCamera(this.cameraWorldPosition, this.lookAtPoint, this.cameraUpVector);
  }

  startOrbit(normX, normY) {
    this.lastBallPos = calcTrackballPosition(normX, normY);
  }

  orbitTo(normX, normY) {
    let curBallPos = calcTrackballPosition(normX, normY);
    let rotation_speed = 1;

    let ballDelta = subtract(curBallPos, this.lastBallPos);

    if (magnitude(ballDelta) > 0.0) {
      this.rotAngle = rotation_speed * magnitude(ballDelta);
      this.rotAxis = cross(this.lastBallPos, curBallPos);
      this.lastBallPos = curBallPos;
    }

    this.rotAxis = normalize(this.rotAxis);
    let cos = Math.cos(this.rotAngle / 2.0);
    let sin = Math.sin(this.rotAngle / 2.0);

    let rotation = vec4(cos, sin * this.rotAxis[0], sin * this.rotAxis[1], sin * this.rotAxis[2]);
    this.rotationQuaternion = multq(this.rotationQuaternion, rotation);

    this.update();
  }

  pan(deltaX, deltaY) {
    // Rotate the initial camera direction by the accumulated quaternion
    let rotatedDirection = quatRotatePoint(this.initialCameraPosition, this.rotationQuaternion);
    
    // Scale by camera radius and add to lookAt point
    let cameraPosition = vec3(
      this.lookAtPoint[0] + rotatedDirection[0] * this.cameraRadius,
      this.lookAtPoint[1] + rotatedDirection[1] * this.cameraRadius,
      this.lookAtPoint[2] + rotatedDirection[2] * this.cameraRadius
    );

    // Calculate camera coordinate system
    let viewDirection = normalize(subtract(this.lookAtPoint, cameraPosition));
    let rightVector = normalize(cross(viewDirection, this.cameraUpVector));
    let upVector = normalize(cross(rightVector, viewDirection));

    // Convert mouse movement to world space movement
    let panAmount = 0.08; // controls pan sensitivity
    let rightMovement = mult(-deltaX * panAmount, rightVector);
    let upMovement = mult(deltaY * panAmount, upVector);

    // Update lookAt point
    this.lookAtPoint = add(this.lookAtPoint, add(rightMovement, upMovement));
    this.update();
  }

  dolly(deltaY) {
    this.cameraRadius += deltaY * 0.5;
    this.cameraRadius = Math.max(0.1, Math.min(10000, this.cameraRadius));
    this.update();
  }

  reset() {
    this.near = defaultNear;
    this.far = defaultFar;
    this.fov = defaultFOV;

    document.getElementById('Near_Clipping').value = this.near;
    document.getElementById('Far_Clipping').value = this.far;
    document.getElementById('Camera_FOV').value = this.fov;

    this.rotAngle = 0.0;
    this.rotAxis = vec3(0, 0, 1);
    this.lastBallPos = vec3(0, 0, 0);

    this.rotationQuaternion = vec4(1, 0, 0, 0);
    this.cameraRadius = 250;

    this.update();
  }

  focus() {
    this.lookAtPoint = vec3(0.0, 20, 0.0);
    this.cameraRadius = 250;
    this.update();
  }

  updateClippingPlanes() {
    let nearInput = getInputValue("Near_Clipping");
    let farInput = getInputValue("Far_Clipping");

    if (nearInput >= this.far - 1) {
      this.near = this.far - 1;
      document.getElementById('Near_Clipping').value = this.near;
    } else {
      this.near = nearInput;
    }

    if (farInput <= this.near + 1) {
      this.far = this.near + 1;
      document.getElementById('Far_Clipping').value = this.far;
    } else {
      this.far = farInput;
    }
  }

  updateFOV() {
    this.fov = getInputValue("Camera_FOV");
  }
}



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

