import ViewBase from "./_view-base.js";

export default class GameOptions extends ViewBase
{
    constructor(gameContext, viewId)
    {
        super(gameContext, viewId);
 
        this.AddPanel("Game Options");
        this.AddInfo(["(game options view coming soon)"]);
        this.AddMenu(MenuItems);
    }
}

const MenuItems = [
    {
        caption: "Back",
        event: "changeView",
        detail: {to: "Welcome"}
    },
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