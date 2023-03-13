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
            content: DomHelper.AppendElement(document.body, Elements.Content),
        };
        this.gameCtx.dataPath = this.gameCtx.basePath + "data";

        this.resetGLContext();
     }

    resetGLContext ()
    {
        if (this.gameCtx.canvas)
        {
            this.gameCtx.canvas.remove();
        }

        this.gameCtx.canvas = DomHelper.AppendElement(document.body, Elements.Canvas);
        this.gameCtx.shaderCache = new ShaderCache(this.gameCtx);

        this.gameCtx.canvas.width = document.body.clientWidth;
        this.gameCtx.canvas.height = document.body.clientHeight;

        this.gameCtx.gl = this.gameCtx.canvas.getContext("webgl2");
        this.gameCtx.gl.clearColor(0.0, 0.0, 0.0, 1.0);
        this.gameCtx.gl.clear(this.gameCtx.gl.COLOR_BUFFER_BIT);

        this.gameCtx.scene = new Scene(this.gameCtx);

    }

    async Begin()
    {
        this.viewController = new ViewController(this.gameCtx);

        document.body.addEventListener("keypress", this.onKeyPress.bind(this));
        
        await this.addCobra();

        this.gameCtx.animationManager = new AnimationManager(this.gameCtx);
        this.gameCtx.animationManager.start();

        //this.viewController.ChangeView("Welcome");
        this.viewController.ChangeView("ShipLibrary");

        console.log("game initialization time: ", new Date().getTime() - window.$started, "milliseconds");
    }

    async addCobra()
    {
        const modelLoader = new ModelLoader(this.gameCtx);
        //this.gameCtx.demoShip = await modelLoader.Load("ships/adder");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/anaconda");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/asp");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/boa");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/boa-mk2");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/cobra-mk1");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/cobra-mk3");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/constrictor");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/ferdelance");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/viper");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/viper-interceptor");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/gecko");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/krait");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/mamba");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/moray");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/shuttle");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/python");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/sidewinder");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/transporter");
        //this.gameCtx.demoShip = await modelLoader.Load("ships/worm");
        //this.gameCtx.demoShip = await modelLoader.Load("thargoids/thargoid");
        //this.gameCtx.demoShip = await modelLoader.Load("thargoids/thargon");
        
        //this.gameCtx.demoShip = await modelLoader.Load("weapons/missile");
        //this.gameCtx.demoShip = await modelLoader.Load("weapons/missile-hardhead");
        //this.gameCtx.demoShip = await modelLoader.Load("weapons/qbomb");
    
        //TODO: figure out why stations are partially complete
        //TODO: those with mirror writing: flip texture horizontally
        //this.gameCtx.demoShip = await modelLoader.Load("stations/coriolis");
        //this.gameCtx.demoShip = await modelLoader.Load("stations/dodo");
        //this.gameCtx.demoShip = await modelLoader.Load("stations/ico");
        //this.gameCtx.demoShip = await modelLoader.Load("stations/rock-hermit");
        
        //this.gameCtx.demoShip = await modelLoader.Load("misc/asteroid");
        //this.gameCtx.demoShip = await modelLoader.Load("misc/barrel");
        //this.gameCtx.demoShip = await modelLoader.Load("misc/escape-capsule");
        //this.gameCtx.demoShip = await modelLoader.Load("misc/buoy");

        if (this.gameCtx.demoShip)
        {
            this.gameCtx.demoShip.Rotation = -3.8;
            this.gameCtx.demoShip.isVisible = true;
            this.gameCtx.demoShip.animator = new Rotator(this.gameCtx.demoShip, 0.5);
            this.gameCtx.scene.models.push(this.gameCtx.demoShip);
        }
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

