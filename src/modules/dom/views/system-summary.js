import DomHelper from "../utilities/dom-helper.js";
import ViewBase from "./_view-base.js";
import ShaderCache from "../../gl/shader-cache.js";
import PlanetLoader from "../../gl/planet-loader.js";

const CANVAS_DIMENSION = 400;

export default class SystemView extends ViewBase {
    constructor(gameCtx, viewId) {
        super(gameCtx, viewId);

        this.AddPanel();
        this.AddTitle("System Info");


        //this.AddMenu(MenuItems);


        this.addPlanet();
    }

    async addPlanet() 
    {
        const galaxyNumber = this.gameCtx.playerCtx.galaxy;
        const planetName = this.gameCtx.playerCtx.selected;
        const loader = new PlanetLoader(this.gameCtx);
        const model = await loader.Load(galaxyNumber, planetName);

        this.SetDemoModel(model);
    }



}

const MenuItems = [
    {
        caption: "Go Back",
        event: "changeView",
        detail: { to: "Welcome" },
        help: "return to previous"
    }
];

const Styles = {
    PlanetCanvas: {
        backgroundColor: "black",
        cursor: "none",
        border: "1px solid white"
    },
};

const Elements = {
    PlanetCanvas: {
        tag: "canvas",
        styles: Styles.PlanetCanvas
    },
}