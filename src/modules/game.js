import ViewController from "./dom/view-controller.js";
import DomHelper from "./dom/utilities/dom-helper.js";

import ShaderCache from "./gl/shader-cache.js";
import Scene from "./gl/scene.js";
import AnimationManager from "./logic/animation-manager.js";



export default class Game
{
    viewController;
    boundRenderFunction;
    animationManager;

    constructor()
    {
        this.gameCtx = {
            id: "gameContext",
            basePath:  document.location.pathname.split("index.html")[0],
            content: DomHelper.AppendElement(document.body, Elements.Content),
        };
        this.gameCtx.dataPath = this.gameCtx.basePath + "data";
        this.gameCtx.playerCtx = DefaultPlayerContext

        this.resetGLContext();
     }

    resetGLContext ()
    {
        if (this.gameCtx.canvas)
        {
            this.gameCtx.canvas.remove();
        }

        this.gameCtx.canvas = DomHelper.AppendElement(document.body, Elements.Canvas);

        this.gameCtx.canvas.width = document.body.clientWidth;
        this.gameCtx.canvas.height = document.body.clientHeight;

        this.gameCtx.gl = this.gameCtx.canvas.getContext("webgl2");

        this.gameCtx.shaderCache = new ShaderCache(this.gameCtx.gl, this.gameCtx.dataPath);

        this.gameCtx.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gameCtx.gl.clear(this.gameCtx.gl.COLOR_BUFFER_BIT);

        this.gameCtx.scene = new Scene(this.gameCtx);
    }

    async Begin()
    {
        this.viewController = new ViewController(this.gameCtx);

        document.body.addEventListener("keydown", this.onKey.bind(this));
        document.body.addEventListener("keyup", this.onKey.bind(this));
        

        this.gameCtx.animationManager = new AnimationManager(this.gameCtx, this.viewController);
        this.gameCtx.animationManager.start();

        this.viewController.ChangeView("Welcome");
        //this.viewController.ChangeView("ShipLibrary");
        //this.viewController.ChangeView("GalacticChart");
        //this.viewController.ChangeView("SystemSummmary");
    
        console.log("game initialization time: ", new Date().getTime() - window.$started, "milliseconds");
    }

    onResize(event)
    {
        document.body.dispatchEvent(new CustomEvent("viewResize", { detail: {}}));
    }

    onKey(event)
    {
        if (this.viewController)
        {
            this.viewController.onKey(event);
        }
        if (this.gameCtx.demoModel)
        {
            this.gameCtx.demoModel.animator.onKey(event);
        }
    }

    onKeyUp(event)
    {
        event.$keyUp = true;
        this.onKey(event);
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

const DefaultPlayerContext = {
    galaxy: 0,
    visiting: "Lave",
    selected: "Lave",
    selectedDistance: 0.0,
    fuel: 7.0    
};
