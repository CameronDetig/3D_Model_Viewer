# 3D Model Viewer

A WebGL-based 3D model viewer that renders and displays 3D models directly in the browser.

## Features

- Interactive 3D model rendering using WebGL
- Camera controls for viewing models from different angles
- Support for multiple models (bunny, teapot)
- Custom shader implementations

## Project Structure

- `index.html` - Main HTML page
- `model_viewer.js` - Main WebGL rendering logic
- `model_viewer.css` - Styling
- `common/` - Utility modules
  - `camera_utils.js` - Camera manipulation utilities
  - `init_shaders.js` - Shader initialization
  - `matrix_vector_utils.js` - Math utilities for 3D transformations
- `models/` - 3D model data files
  - `bunny.js` - Bunny model
  - `teapot.js` - Teapot model

## Getting Started

1. Clone this repository
2. Open `index.html` in a modern web browser that supports WebGL
3. Interact with the 3D models using your mouse/keyboard

## Browser Requirements

- Modern browser with WebGL support (Chrome, Firefox, Edge, Safari)

## License

MIT License
