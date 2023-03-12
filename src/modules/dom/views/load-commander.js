import ViewBase from "./_view-base.js";

export default class LoadCommander extends ViewBase
{
    constructor(gameContext, viewId)
    {
        super(gameContext, viewId);
 
        this.AddPanel();
        this.AddTitle("Load Commander");
        this.AddMenu(MenuItems);
    }
}

const MenuItems = [
    {
        caption: "Start New Commander",
        event: "changeView",
        detail: {to: "NewCommander"}
    },
    {
        caption: "Load Commander",
        event: "changeView",
        detail: {to: "LoadCommander"}
    },
    {
        caption: "View Ship Library",
        event: "changeView",
        detail: {to: "ShipLibrary"}
    },
    {
        caption: "Game Options",
        event: "changeView",
        detail: {to: "GameOptions"}
    }
];