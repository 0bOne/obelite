import ShipLoader from "../../gl/ship-expander.js";
import ViewBase from "./_view-base.js";

export default class ShipFactory extends ViewBase
{
    constructor(gameContext, viewId)
    {
        super(gameContext, viewId);

        this.AddPanel("Ship Factory");
        this.AddMenu(MenuItems);

        this.addCobra();
    }

    async addCobra()
    {
        const modelLoader = new ShipLoader(this.gameCtx);
        const model = await modelLoader.Load("ships/cobra-mk4");
        model.wireframe = true;
        this.SetDemoModel(model);
    }
}

const MenuItems = [
    {
        caption: "Back",
        event: "changeView",
        detail: {to: "Welcome"}
    }
];