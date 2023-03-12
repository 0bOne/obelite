import ViewController from "./dom/view-controller.js";
import DomHelper from "./dom/utilities/dom-helper.js";

import ShaderCache from "./gl/shader-cache.js";
import Scene from "./gl/scene.js";
import ModelLoader from "./gl/model-loader.js";
import Rotator from "./logic/animators/rotator.js";
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
            canvas: DomHelper.AppendElement(document.body, Elements.Canvas),
            content: DomHelper.AppendElement(document.body, Elements.Content),
        };

        this.gameCtx.shaderCache = new ShaderCache(this.gameCtx);

        this.gameCtx.canvas.width = document.body.clientWidth;
        this.gameCtx.canvas.height = document.body.clientHeight;

        this.gameCtx.gl = this.gameCtx.canvas.getContext("webgl2");
        this.gameCtx.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gameCtx.gl.clear(this.gameCtx.gl.COLOR_BUFFER_BIT);

        this.gameCtx.dataPath = this.gameCtx.basePath + "data";
        this.gameCtx.scene = new Scene(this.gameCtx);
    }

    async Begin()
    {
        this.viewController = new ViewController(this.gameCtx);
        this.viewController.ChangeView("Welcome");
        document.body.addEventListener("keypress", this.onKeyPress.bind(this));
        
        await this.addCobra();

        this.gameCtx.animationManager = new AnimationManager(this.gameCtx);
        this.gameCtx.animationManager.start();

        console.log("game initialization time: ", new Date().getTime() - window.$started, "milliseconds");
    }

    async addCobra()
    {
        const modelLoader = new ModelLoader(this.gameCtx);
        this.gameCtx.demoShip = await modelLoader.Load("ships/detailed/cobra3")

        this.gameCtx.demoShip.Rotation = -3.8;
        this.gameCtx.demoShip.isVisible = true;
        this.gameCtx.demoShip.animator = new Rotator(this.gameCtx.demoShip, 0.5);

        this.gameCtx.scene.models.push(this.gameCtx.demoShip);
    }

    onResize(event)
    {
        document.body.dispatchEvent(new CustomEvent("viewResize", { detail: {}}));
    }

    onKeyPress(event)
    {
        this.gameCtx.demoShip.animator.onKeyPress(event);
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

