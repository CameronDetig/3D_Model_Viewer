// Variables for viewport interaction
class InputController {
    constructor(canvas, cameraController, callbacks) {
        this.canvas = canvas;
        this.cameraController = cameraController;
        this.callbacks = callbacks || {};

        this.leftClickIsDragging = false;
        this.middleClickIsDragging = false;
        this.rightClickIsDragging = false;
        this.lastMouseX = 0;
        this.lastMouseY = 0;

        this.bindEvents();
    }

    bindEvents() {
        this.canvas.addEventListener('mousedown', e => {
            e.preventDefault(); // Prevent default browser behavior (middle-click pan, right-click menu)

            switch (e.button) {
                case 0: // Left button
                    this.leftClickIsDragging = true;
                    let mouse_pos = this.normalizeMousePosition(e.clientX, e.clientY)
                    if (this.cameraController) {
                        this.cameraController.startOrbit(mouse_pos[0], mouse_pos[1]);
                    }
                    break;
                case 1: // Middle button
                    this.middleClickIsDragging = true;
                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;
                    break;
                case 2: // Right button
                    this.rightClickIsDragging = true;
                    this.lastMouseX = e.clientX;
                    this.lastMouseY = e.clientY;
                    break;
            }
        });

        this.canvas.addEventListener('mouseup', e => {
            // If mouse released, set dragging variables to false.
            switch (e.button) {
                case 0: // Left button
                    this.leftClickIsDragging = false;
                    break;
                case 1: // Middle button
                    this.middleClickIsDragging = false;
                    break;
                case 2: // Right button
                    this.rightClickIsDragging = false;
                    break;
            }
        });

        this.canvas.addEventListener('mousemove', e => {
            // If mouse is being moved, update camera variables
            e.preventDefault(); // Prevent default browser behavior (middle-click pan, right-click menu)

            if (this.leftClickIsDragging || this.middleClickIsDragging || this.rightClickIsDragging) {
                let mouseDeltaX = (e.clientX - this.lastMouseX);
                let mouseDeltaY = (e.clientY - this.lastMouseY);

                if (this.leftClickIsDragging) { // Trackball orbit the camera
                    let mouse_pos = this.normalizeMousePosition(e.clientX, e.clientY)
                    if (this.cameraController) {
                        this.cameraController.orbitTo(mouse_pos[0], mouse_pos[1]);
                    }
                } 

                else if (this.middleClickIsDragging) { // pan the camera
                    if (this.cameraController) {
                        this.cameraController.pan(mouseDeltaX, mouseDeltaY);
                    }
                } 

                else if (this.rightClickIsDragging) { // move the camera forward and backward
                    if (this.cameraController) {
                        this.cameraController.dolly(mouseDeltaY);
                    }
                }

                // Save the mouse positions for use in the next frame
                this.lastMouseX = e.clientX;
                this.lastMouseY = e.clientY;
            }
        });

        this.canvas.addEventListener('wheel', e => {
            e.preventDefault(); // prevent page from scrolling

            if (this.cameraController) {
                this.cameraController.dolly(e.deltaY);
            }
        });

        // Event listener for the Reset button
        const resetButton = document.getElementById("resetButton");
        resetButton.addEventListener("click", () => {
            if (this.cameraController) {
                this.cameraController.reset();
            }
        });

        window.addEventListener("keydown", event => {
            switch (event.key) {
                case "r":
                    if (this.cameraController) {
                        this.cameraController.reset();
                    }
                    break;
                case "f":
                    if (this.cameraController) {
                        this.cameraController.focus();
                    }
                    break;
                default:
                    console.log("Key Pressed:", event.key);
            }
        });

        // UI Inputs
        if (this.callbacks.updateModelSubdivisions) {
            this.addListener('Model_Subdivisions', this.callbacks.updateModelSubdivisions);
        }

        this.addListener('Near_Clipping', () => {
            if (this.cameraController) {
                this.cameraController.updateClippingPlanes();
            }
        });
        this.addListener('Far_Clipping', () => {
            if (this.cameraController) {
                this.cameraController.updateClippingPlanes();
            }
        });

        this.addListener('Camera_FOV', () => {
            if (this.cameraController) {
                this.cameraController.updateFOV();
            }
        });

        // Lighting inputs
        if (this.callbacks.updateLighting) {
            this.addListener('Light_X_Pos', this.callbacks.updateLighting);
            this.addListener('Light_Y_Pos', this.callbacks.updateLighting);
            this.addListener('Light_Z_Pos', this.callbacks.updateLighting);

            this.addListener('Light_Diffuse_Intensity', this.callbacks.updateLighting);
            this.addListener('Light_Specular_Intensity', this.callbacks.updateLighting);
            this.addListener('Light_Ambient_Intensity', this.callbacks.updateLighting);

            this.addListener('light_diffuse_color', this.callbacks.updateLighting);
            this.addListener('light_specular_color', this.callbacks.updateLighting);
            this.addListener('light_ambient_color', this.callbacks.updateLighting);

            this.addListener('material_diffuse_color', this.callbacks.updateLighting);
            this.addListener('material_specular_color', this.callbacks.updateLighting);
            this.addListener('material_ambient_color', this.callbacks.updateLighting);

            this.addListener('Material_Shininess', this.callbacks.updateLighting);
        }

        // Model Inputs
        if (this.callbacks.updateModelTransform) {
            this.addListener('Model_X_Pos', this.callbacks.updateModelTransform);
            this.addListener('Model_Y_Pos', this.callbacks.updateModelTransform);
            this.addListener('Model_Z_Pos', this.callbacks.updateModelTransform);

            this.addListener('Model_X_Rot', this.callbacks.updateModelTransform);
            this.addListener('Model_Y_Rot', this.callbacks.updateModelTransform);
            this.addListener('Model_Z_Rot', this.callbacks.updateModelTransform);

            this.addListener('Model_X_Scale', this.callbacks.updateModelTransform);
            this.addListener('Model_Y_Scale', this.callbacks.updateModelTransform);
            this.addListener('Model_Z_Scale', this.callbacks.updateModelTransform);
        }
    }

    normalizeMousePosition(mouseX, mouseY) {
        // Take in event.clientX and event.clientY and return normalized mouse X and Y
        // normalizes values to range (-1, 1)
        var rect = this.canvas.getBoundingClientRect();
        var localX = mouseX - rect.left;
        var localY = mouseY - rect.top;
        var x = 2 * localX / rect.width - 1;
        var y = 2 * (rect.height - localY) / rect.height - 1;

        return [x, y]
    }
    
    addListener(elemID, functionName) {
        let elem = document.getElementById(elemID);
        if (!elem) {
            throw new Error(`Missing UI element: ${elemID}`);
        }
        elem.addEventListener('input', functionName);
    }
}
