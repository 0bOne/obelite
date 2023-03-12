import ViewController from "./dom/view-controller.js";
import DomHelper from "./utilities/dom-helper.js";

import ShapeLoader from "./gl/model-loader.js";
import ShaderCache from "./gl/shader-cache.js";
import Scene from "./gl/scene.js";
//import Ship from "./entities/ship.js";
//import Display3d from "./dom/display/display-3d.js";

import TextureDebugger from "./debug/textures/debugger.js";
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
        //this.BeginThree();
        //this.BeginThreeYaml();
        //this.BeginTextureDebug();
    }

    async BeginThree()
    {
        this.Ship = new Ship();
        await this.Ship.Build();

        this.display = new Display3d();
        this.display.Scene.add(this.Ship.Mesh);
        this.display.StartAnimating();
    }

    async BeginThreeYaml()
    {
        this.Ship = new Ship();
        await this.Ship.BuildFromYaml();

        this.display = new Display3d();
        this.display.Scene.add(this.Ship.Mesh);
        this.display.StartAnimating();
    }


    async BeginNative()
    {
        document.body.addEventListener("keypress", this.onKeyPress.bind(this));
        //setup context and gl context as window-global references
        window.$g = {
            id: "gameContext",
            basePath:  document.location.pathname.split("index.html")[0],
            content: DomHelper.AppendElement(document.body, Elements.Content),
            canvas: DomHelper.AppendElement(document.body, Elements.Canvas),
            shaderCache: new ShaderCache()
        };

        window.$g.canvas.width = document.body.clientWidth;
        window.$g.canvas.height = document.body.clientHeight;

        window.$g.dataPath = window.$g.basePath + "data";

        window.$gl = $g.canvas.getContext("webgl2");
        window.$gl.$instance = "main instance";

        //GlInterceptor.ObserveFunctions(window.$gl);

        window.$t = {
            id: "time",
            then: 0,
            now: 0,
            delta: 0,
        };

        window.$fps = {
            id: "frame rate",
            delta: 0,
            then: 0,
            now: 0,
            frames: 0
        }

        $gl.clearColor(1.0, 0.0, 0.0, 1.0);
        $gl.clear($gl.COLOR_BUFFER_BIT);

        //this.shape = await ShapeLoader.Load("basics/white-square");
        //this.shape = await ShapeLoader.Load("basics/colored-square");
        //this.shape = await ShapeLoader.Load("basics/colored-cube");
        //this.shape = await ShapeLoader.Load("basics/colored-cube-lit");
        //this.shape = await ShapeLoader.Load("basics/textured-cube");
        //this.shape = await ShapeLoader.Load("basics/textured-cube-lit");
        //this.shape = await ShapeLoader.Load("ships/redux/cobra3");
        this.shape = await ShapeLoader.Load("ships/detailed/cobra3");

        this.shape.Rotation = -3.8;

        //NEXT STEPS:
        // - Cobra redux to yaml + render
        // - Ship converter. oolite.plist -> yaml 
        //   + texture copy
        //   + find out if redux is used in the game (and if so, when)
        // - Cobra full to yaml + render with static material
        //   + render with defined materials
        //   + render with additional textures

        this._boundRenderFunction = this.renderNative.bind(this);
        requestAnimationFrame(this._boundRenderFunction);

        console.log("init time: ", new Date().getTime() - window.$started, "milliseconds");
    }

    renderNative(now)
    {
        //update global animation times
        $t.now = now * 0.001; // convert to seconds
        $t.delta = $t.now - $t.then; 
        $t.then = $t.now;

        this.updateFrameRate();

        //randering
        Scene.Draw(this.shape);

        //animation calculations
        if (this._rotating === true)
        {
            this.shape.Rotation -= $t.delta * 0.5;
        }
        //this.shape.Rotation = 0;


        requestAnimationFrame(this._boundRenderFunction);
    }

    updateFrameRate(now)
    {
        $fps.frames++;
        $fps.delta += $t.delta;
        if ($fps.delta > 1.0)
        {
            //console.log($fps.frames, $fps.delta);
            document.title = "fps: " + ($fps.frames/$fps.delta).toFixed(1);
            $fps.frames = 0;
            $fps.delta = 0;
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
            console.log("rotation", this.shape.Rotation);
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

