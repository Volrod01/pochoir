// ==UserScript==
// @name         Pochoir Eplace
// @namespace    http://tampermonkey.net/
// @version      1.1
// @description  Pochoir Eplace where students can upload their image correctly over the base canvas without clearing it and following zoom/move and pixel updates properly.
// @author       Alexis WAGNER
// @match        http://localhost:8080/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=epita.fr
// @grant        none
// ==/UserScript==

// Utils to prefix console logs
const log = (...args) => console.log("%c[Pochoir]", "color: orange; font-weight: bold;", ...args);
const warn = (...args) => console.warn("%c[Pochoir]", "color: orange; font-weight: bold;", ...args);
const error = (...args) => console.error("%c[Pochoir]", "color: orange; font-weight: bold;", ...args);

let isOverlayActive = false;
let drawingInProgress = false;
let lastDrawTime = 0;

function uploadImage() {
    let input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (event) => {
        let file = event.target.files[0];
        if (file) {
            let size = prompt("Enter the size in pixels (e.g., 50x50):");
            if (size) {
                let [width, height] = size.split("x").map(Number);
                if (isNaN(width) || isNaN(height)) {
                    alert("Invalid size format. Please use 'widthxheight'.");
                    return;
                }

                let reader = new FileReader();
                reader.onload = function(e) {
                    const originalImageData = e.target.result;

                    let img = new Image();
                    img.onload = function() {
                        let posX = prompt("Enter the X position (default is 50):", "50");
                        let posY = prompt("Enter the Y position (default is 50):", "50");
                        posX = posX ? parseInt(posX) : 50;
                        posY = posY ? parseInt(posY) : 50;
                        if (isNaN(posX) || isNaN(posY)) {
                            alert("Invalid position format. Please enter numbers.");
                            return;
                        }

                        // Save to localStorage
                        localStorage.setItem('pochoir_original_image', originalImageData);
                        localStorage.setItem('pochoir_width', width);
                        localStorage.setItem('pochoir_height', height);
                        localStorage.setItem('pochoir_x', posX);
                        localStorage.setItem('pochoir_y', posY);

                        drawOverlayImage();
                    };
                    img.src = originalImageData;
                };
                reader.readAsDataURL(file);
            } else {
                alert("Size input cancelled.");
            }
        }
    };
    input.click();
}

function drawOverlayImage() {
    if (drawingInProgress) return;
    drawingInProgress = true;

    const imageData = localStorage.getItem('pochoir_original_image');
    if (!imageData) {
        drawingInProgress = false;
        return;
    }

    const width = parseInt(localStorage.getItem('pochoir_width'));
    const height = parseInt(localStorage.getItem('pochoir_height'));
    const posX = parseInt(localStorage.getItem('pochoir_x'));
    const posY = parseInt(localStorage.getItem('pochoir_y'));

    let img = new Image();
    img.onload = function () {
        let canvas = document.querySelector("#canvas");
        if (!canvas) {
            error("Base canvas not found");
            drawingInProgress = false;
            return;
        }
        let ctx = canvas.getContext("2d");

        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.drawImage(img, posX, posY, width, height);
        ctx.restore();

        isOverlayActive = true;
        lastDrawTime = Date.now();
        drawingInProgress = false;
    };
    img.src = imageData;
}

function handleCanvasChange() {
    if (drawingInProgress) return;

    const now = Date.now();
    if (now - lastDrawTime < 200) {
        return;
    }

    setTimeout(() => {
        if (!isOverlayActive) {
            drawOverlayImage();
        }
    }, 100);
}

(function() {
    'use strict';

    setTimeout(() => {
        setupButtons();
        drawOverlayImage();
        setupCanvasObserver();
        hookSocketEvents();
    }, 500);

    function setupCanvasObserver() {
        const observer = new MutationObserver(function(mutations) {
            for (let mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (let node of mutation.addedNodes) {
                        if (node.nodeType === 1 && node.matches("#canvas")) {
                            handleCanvasChange();
                        }
                    }
                }
            }
        });

        const canvasContainer = document.querySelector("#container");
        if (canvasContainer) {
            observer.observe(canvasContainer, {
                childList: true,
                subtree: true
            });
        }
    }

    function setupButtons() {
        let buttonContainer = document.querySelector("#container > div.RoomCanvas > div.Header > div.ButtonContainer");

        if (!buttonContainer) {
            error("Button container not found");
            setTimeout(setupButtons, 1000);
            return;
        }

        log('Button container found');

        let uploadButton = document.createElement("button");
        uploadButton.innerText = "Upload Image";
        uploadButton.onclick = () => {
            uploadImage();
        };
        uploadButton.style.backgroundColor = "#ff4603";
        uploadButton.style.width = "122px";
        uploadButton.style.height = "25px";
        uploadButton.style.fontSize = "12px";
        uploadButton.style.padding = "5.6px 12px";
        buttonContainer.appendChild(uploadButton);

        let clearButton = document.createElement("button");
        clearButton.innerText = "Clear Image";
        clearButton.onclick = () => {
            localStorage.removeItem('pochoir_original_image');
            localStorage.removeItem('pochoir_width');
            localStorage.removeItem('pochoir_height');
            localStorage.removeItem('pochoir_x');
            localStorage.removeItem('pochoir_y');
            isOverlayActive = true;
            window.location.reload();
        };
        clearButton.style.backgroundColor = "#ff4603";
        clearButton.style.width = "122px";
        clearButton.style.height = "25px";
        clearButton.style.fontSize = "12px";
        clearButton.style.padding = "5.6px 12px";
        clearButton.style.marginLeft = "5px";
        buttonContainer.appendChild(clearButton);
    }

    function hookSocketEvents() {
        const oldSend = WebSocket.prototype.send;

        WebSocket.prototype.send = function (...args) {
            if (!this._alreadyHooked) {
                this._alreadyHooked = true;
                this.addEventListener('message', (event) => {
                    try {
                        if (event.data.startsWith('42')) {
                            const jsonData = event.data.substring(2);
                            const parsedData = JSON.parse(jsonData);
                            if (Array.isArray(parsedData) && parsedData[0] === "pixel-update") {
                                const pixelData = parsedData[1]?.result?.data?.json;
                                if (pixelData && pixelData.roomSlug === "epi-place") {
                                    setTimeout(() => {
                                        isOverlayActive = false;
                                        drawingInProgress = false;
                                        handleCanvasChange();
                                    }, 200);
                                }
                            }
                        } else {
                            warn('Message does not start with "42", ignoring:', event.data);
                        }
                    } catch (e) {
                        error('Error parsing message:', e);
                    }
                });
            }
            return oldSend.apply(this, args);
        };
    }
})();
