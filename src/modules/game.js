import ViewController from "./dom/view-controller.js";
import DomHelper from "./utilities/dom-helper.js";

import ShapeLoader from "./gl/model-loader.js";
import ShaderCache from "./gl/shader-cache.js";
import Scene from "./gl/scene.js";
import ModelLoader from "./gl/model-loader.js";
//import Ship from "./entities/ship.js";
//import Display3d from "./dom/display/display-3d.js";

//import TextureDebugger from "./debug/textures/debugger.js";
//import GlInterceptor from "./gl/gl_interceptor.js";

export default class Game
{
    _viewController;
    _boundRenderFunction;
    _rotating;

    constructor()
    {
    }

    async Begin()
    {
        this.BeginNative();
    }

    async BeginNative()
    {
        document.body.addEventListener("keypress", this.onKeyPress.bind(this));
        //setup context and gl context as window-global references
        const gameCtx = {
            id: "gameContext",
            basePath:  document.location.pathname.split("index.html")[0],
            content: DomHelper.AppendElement(document.body, Elements.Content),
            canvas: DomHelper.AppendElement(document.body, Elements.Canvas),
        };

        gameCtx.shaderCache = new ShaderCache(gameCtx);

        gameCtx.canvas.width = document.body.clientWidth;
        gameCtx.canvas.height = document.body.clientHeight;

        gameCtx.dataPath = gameCtx.basePath + "data";

        gameCtx.gl = gameCtx.canvas.getContext("webgl2");
        gameCtx.gl.$instance = "main instance";

        //GlInterceptor.ObserveFunctions(window.$gl);

        gameCtx.t = {
            id: "time",
            then: 0,
            now: 0,
            delta: 0,
        };

        gameCtx.fps = {
            id: "frame rate",
            delta: 0,
            then: 0,
            now: 0,
            frames: 0
        }

        gameCtx.gl.clearColor(1.0, 0.0, 0.0, 1.0);
        gameCtx.gl.clear(gameCtx.gl.COLOR_BUFFER_BIT);

        //this.shape = await ShapeLoader.Load("basics/white-square");
        //this.shape = await ShapeLoader.Load("basics/colored-square");
        //this.shape = await ShapeLoader.Load("basics/colored-cube");
        //this.shape = await ShapeLoader.Load("basics/colored-cube-lit");
        //this.shape = await ShapeLoader.Load("basics/textured-cube");
        //this.shape = await ShapeLoader.Load("basics/textured-cube-lit");
        //this.shape = await ShapeLoader.Load("ships/redux/cobra3");

        gameCtx.scene = new Scene(gameCtx);

        const modelLoader = new ModelLoader(gameCtx);

        gameCtx.scene.shapes.push(await modelLoader.Load("ships/detailed/cobra3"));
        gameCtx.scene.shapes[0].Rotation = -3.8;

        this._boundRenderFunction = this.renderNative.bind(this);
        requestAnimationFrame(this._boundRenderFunction);

        this.gameCtx = gameCtx;
        console.log("game initialization time: ", new Date().getTime() - window.$started, "milliseconds");
    }

    renderNative(now)
    {
        //update global animation times
        this.gameCtx.t.now = now * 0.001; // convert to seconds
        this.gameCtx.t.delta = this.gameCtx.t.now - this.gameCtx.t.then; 
        this.gameCtx.t.then = this.gameCtx.t.now;

        this.updateFrameRate();

        //randering
        this.gameCtx.scene.Draw();

        //animation calculations
        if (this._rotating === true)
        {
            this.gameCtx.scene.shapes[0].Rotation -= this.gameCtx.t.delta * 0.5;
        }
        //this.shape.Rotation = 0;

        requestAnimationFrame(this._boundRenderFunction);
    }

    updateFrameRate(now)
    {
        this.gameCtx.fps.frames++;
        this.gameCtx.fps.delta += this.gameCtx.t.delta;
        if (this.gameCtx.fps.delta > 1.0)
        {
            //console.log($fps.frames, $fps.delta);
            document.title = "fps: " + (this.gameCtx.fps.frames/this.gameCtx.fps.delta).toFixed(1);
            this.gameCtx.fps.frames = 0;
            this.gameCtx.fps.delta = 0;
        }       
    }

    onResize(event)
    {
        document.body.dispatchEvent(new CustomEvent("viewResize", { detail: {}}));
    }

    async BeginTextureDebug()
    {
        const dataPath = document.location.pathname.split("index.html")[0] + "data";
        const modelPath = dataPath + "/models/ships/redux/cobra3";

        const d = new TextureDebugger();
        await d.display(modelPath);
    }

    onKeyPress(event)
    {
        if (event.key === " ")
        {
            this._rotating = !this._rotating;
            console.log("rotation", this.gameCtx.scene.shapes[0].Rotation);
        }
    }
}

const Styles = {
    Canvas: {
        width: "100%",
        height: "100%"
    }
}

const Elements = {
    Content: {
        id: "content",
        tag: "div",
        styles: {position: "absolute", height: "100%"}
    },
    Canvas: {
        id: "wglCanvas",
        tag: "canvas",
        styles: Styles.Canvas
    }
};

