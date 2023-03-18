import ModelLoader from "../../gl/model-loader.js";
import Rotator from "../../logic/animators/rotator.js";
import ViewBase from "./_view-base.js";

const INFO_MESSAGES = [
    "By 0b1, Inspired by Oolite and using some of its assets under the GPL",
]

const INFO_NOTES = [
    "Guide to implementation state:",
    " ",
    "POCQ: Working to POC quality, but some features rough or unfinished",
    "TODO:  Feature not yet implemented",
    "DONE: Feature fully working"
]

export default class WelcomeView extends ViewBase
{
    constructor(gameContext, viewId)
    {
        super(gameContext, viewId);

        this.AddPanel();
        this.AddTitle("Obelite");
        this.AddInfo(INFO_MESSAGES);
        this.AddNotes(INFO_NOTES);
        this.AddMenu(MenuItems);

        this.addCobra();
    }

    async addCobra()
    {
        const modelLoader = new ModelLoader(this.gameCtx);
        this.gameCtx.demoShip = await modelLoader.Load("ships/cobra-mk3");
        if (this.gameCtx.demoShip)
        {
            this.gameCtx.demoShip.Rotation = -3.8;
            this.gameCtx.demoShip.isVisible = true;
            this.gameCtx.demoShip.animator = new Rotator(this.gameCtx.demoShip, 0.5);
            this.gameCtx.scene.models.push(this.gameCtx.demoShip);
        }
    }
}

const MenuItems = [
    {
        caption: "View Ship Library",
        event: "changeView",
        detail: {to: "ShipLibrary"},
        help: "POCQ: View all ships and objects in the library"
    },
    {
        caption: "View Galactic Chart",
        event: "changeView",
        detail: {to: "GalacticChart"},
        help: "POCQ: View galactic chart 1"
    },
    {
        caption: "Start New Commander",
        event: "changeView",
        detail: {to: "NewCommander"},
        help: "TODO: Start the game as a new commander"
    },
    {
        caption: "Load Commander",
        event: "changeView",
        detail: {to: "LoadCommander"},
        help: "TODO: Load a previously saved commander"
    },

    {
        caption: "Game Options",
        event: "changeView",
        detail: {to: "GameOptions"},
        help: "TODO: Set camera, keyboard, and other options"
    }
];