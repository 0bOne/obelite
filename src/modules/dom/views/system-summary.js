import DomHelper from "../utilities/dom-helper.js";
import ViewBase from "./_view-base.js";
import PlanetLoader from "../../gl/planet-loader.js";

const CANVAS_DIMENSION = 400;

export default class SystemView extends ViewBase {
    constructor(gameCtx, viewId) {
        super(gameCtx, viewId);

        this.AddPanel();
        this.AddTitle("Data on " + this.gameCtx.playerCtx.selected);

        this.area = DomHelper.AppendElement(this.panel, Elements.LibraryArea);

        //TODO: move leftside, statistic, blurb, etc, into base class to be shared ship lib view
        this.leftSide = DomHelper.AppendElement(this.area, Elements.LeftSide);

        this.economy = DomHelper.AppendElement(this.leftSide, Elements.Statistic, "econ");
        this.techLevel = DomHelper.AppendElement(this.leftSide, Elements.Statistic, "tech level");
        this.population = DomHelper.AppendElement(this.leftSide, Elements.Statistic, "population");
        this.productivity = DomHelper.AppendElement(this.leftSide, Elements.Statistic, "productivity");
        this.radius = DomHelper.AppendElement(this.leftSide, Elements.Statistic, "radius");
        this.distance = DomHelper.AppendElement(this.leftSide, Elements.Statistic, "distance");
        
        this.blurb = DomHelper.AppendElement(this.panel, Elements.Blurb, "blurb here");

        this.AddMenu(MenuItems);
        this.addPlanet();
    }

    async addPlanet() 
    {
        const galaxyNumber = this.gameCtx.playerCtx.galaxy;
        const planetName = this.gameCtx.playerCtx.selected;
        const loader = new PlanetLoader(this.gameCtx);
        const model = await loader.Load(galaxyNumber, planetName);
        model.worldPosition = {x: 1.0, y: 0.2, z: -4.5},

        this.SetDemoModel(model);

        this.economy.textContent = "Economy: " + model.info.demographics.economy;
        this.techLevel.textContent = "Tech Level: " + model.info.demographics.tech;
        this.population.textContent = "Population: " + (parseInt(model.info.demographics.type) / 10) 
                                        + " billion (" + model.info.demographics.inhabitants + ")";
                                
        this.productivity.innerHTML = "Productivity: " + model.info.demographics.gdp + " M&cent;";

        this.radius.textContent = "Average Radius: " + model.info.radius + " km";

        const ly = (this.gameCtx.playerCtx.selectedDistance || 0.0).toFixed(1);
        this.distance.textContent = "Distance: " +  + ly + " ly";

        this.blurb.textContent = model.info.demographics.description;
    }
}

const MenuItems = [
    {
        caption: "Go Back",
        event: "changeView",
        detail: { to: "GalacticChart" },
        help: "return to previous"
    }
];

const Styles = {
    PlanetCanvas: {
        backgroundColor: "black",
        cursor: "none",
        border: "1px solid white"
    },
    LibraryArea: {
        flexGrow: 1,
        alignSelf: "stretch",
        alignItems: "flex-start"
    },
    LeftSide: {
        flexGrow: 1,
        alignSelf: "stretch",
        alignItems: "flex-start"
    },
    Info: {
        minWidth: "220px",
        backgroundColor: "transparent",
        margin: "5px",
        textAlign: "left"
    },
    Yellow: {
        color: "yellow"
    },
    Green: {
        color: "green"
    },
    Blurb: {
        backgroundColor: "transparent",
        fontStyle: "italic",
        margin: "5px",
        marginBottom: "32px",
        lineHeight: "1.6rem",
        textAlign: "left",
    }
};

const Elements = {
    PlanetCanvas: {
        tag: "canvas",
        styles: Styles.PlanetCanvas
    },
    LibraryArea: {
        tag: "div",
        classes: "flex-across",
        styles: Styles.LibraryArea
    },
    LeftSide: {
        tag: "div",
        classes: "flex-down",
        styles: Styles.LeftSide
    },
    Statistic: {
        tag: "p",
        classes: "bold",
        styles: [Styles.Info, Styles.Yellow]
    },
    Blurb: {
        tag: "p",
        classes: "italic",
        styles: [Styles.Blurb, Styles.Green]
    }
}