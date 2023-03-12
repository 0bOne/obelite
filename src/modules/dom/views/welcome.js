import ViewBase from "./_view-base.js";

const INFO_LICENSE = "By 0b1, Inspired by Oolite and using some of its assets under the GPL";

export default class WelcomeView extends ViewBase
{
    constructor(gameContext, viewId)
    {
        super(gameContext, viewId);

        this.AddPanel();
        this.AddTitle("Obelite");
        this.AddInfo([INFO_LICENSE]);
        this.AddMenu(MenuItems);
    }
}

const MenuItems = [
    {
        caption: "Start New Commander",
        event: "changeView",
        detail: {to: "NewCommander"},
        help: "Start the game as a new commander"
    },
    {
        caption: "Load Commander",
        event: "changeView",
        detail: {to: "LoadCommander"},
        help: "Load a previously saved commander"
    },
    {
        caption: "View Ship Library",
        event: "changeView",
        detail: {to: "ShipLibrary"},
        help: "View all ships and objects in the library"
    },
    {
        caption: "Game Options",
        event: "changeView",
        detail: {to: "GameOptions"},
        help: "Set camera, keyboard, and other options"
    }
];