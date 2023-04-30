//firefox offscreen canvas has to be enabled, which isn't a realistic option to a game player
//instead use this hidden onscreen canvas polyfill

export default class FauxOffscreenCanvas
{
    _canvas;

    constructor(width, height, parent)
    {
        parent = parent || document.body;
        this._canvas = document.createElement("canvas");
        this._canvas.width = width;
        this._canvas.height = height;
        this._canvas.style.position = "absolute";
        this._canvas.style.visibility = "hidden";
        this._canvas.classList.add("faux-offscreen-canvas")
        parent.appendChild(this._canvas);
    }

    getContext(contextId)
    {
        return this._canvas.getContext(contextId);
    }

    get canvas()
    {
        return this._canvas;
    }

    get width()
    {
        return this._canvas.width;
    }

    
    get height()
    {
        return this._canvas.height;
    }
}