import FauxOffscreenCanvas from './faux-offscreen-canvas.js';

window.OffscreenCanvas = window.OffscreenCanvas || FauxOffscreenCanvas;
