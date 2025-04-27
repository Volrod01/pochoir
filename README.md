# Pochoir

**Pochoir** is a Tampermonkey userscript designed to enhance the experience of working with collaborative pixel art canvases. It allows users to upload images and overlay them on the canvas, ensuring proper alignment and updates while maintaining the integrity of the base canvas.

## Features

- **Image Upload and Overlay**: Upload an image and overlay it on the canvas with adjustable size and position.
- **Canvas Synchronization**: Automatically redraws the overlay when the canvas updates.
- **Custom Buttons**: Adds buttons to the interface for uploading and clearing images.
- **WebSocket Integration**: Hooks into WebSocket events to detect pixel updates and refresh the overlay as needed.

## Installation

1. Install the Tampermonkey add-on on your browser. _[Chrome, Edge](https://chrome.google.com/webstore/detail/tampermonkey/dhdgffkkebhmkfjojejmpbldmpobfkfo) [Firefox](https://addons.mozilla.org/en-US/firefox/addon/tampermonkey/)_

2. Open [this link](https://github.com/Volrod01/pochoir/raw/main/pochoir.js) and press the "Install" button to add the script to Tampermonkey.

## Usage

1. Navigate to the canvas page (e.g., `http://localhost:8080/`).
2. Use the "Upload Image" button to select an image, specify its size, and position it on the canvas.
3. The overlay will appear on the canvas with a semi-transparent effect.
4. Use the "Clear Image" button to remove the overlay and reset the settings.
