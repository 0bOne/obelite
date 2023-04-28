import ShipLoader from "../../gl/ship-loader.js";
import ShipShowroom from "../../logic/animators/ship-showroom.js";
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

        this.AddPanel("Obelite");
        this.AddInfo(INFO_MESSAGES);
        this.AddNotes(INFO_NOTES);
        this.AddMenu(MenuItems);

        this.addCobra();
    }

    async addCobra()
    {
        const modelLoader = new ShipLoader(this.gameCtx);
        const model = await modelLoader.Load("ships/cobra-mk3");
        //const model = await modelLoader.Load("stations/icosahedron");
        //model.animator = new ShipShowroom(model, -5.0, -5.0);
        //model.wireframe = true;
        this.SetDemoModel(model);
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