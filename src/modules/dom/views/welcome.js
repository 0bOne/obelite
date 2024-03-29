import ShipLoader from "../../gl/loaders/ship-loader.js";
import ShipShowroom from "../../logic/animators/ship-showroom.js";
import ViewBase from "./_view-base.js";

const INFO_MESSAGES = [
    "By 0b1, Inspired by Oolite and using some of its assets under the GPL",
]

const INFO_NOTES = [
    "When you take off the training wheels and slough off the security blankets:",
    " ",
    "The universe is the limit",
    "No Typescript training pants",
    "No React sleep-aids",
    "No Unity uncertainty",
    "No gimmicks, clutter, comfort toys or noise",
    "Just plain, clean JS, with a mild sprinkle of GLSL"
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