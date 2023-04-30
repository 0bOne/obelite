import DomHelper from "../utilities/dom-helper.js";
import ViewBase from "./_view-base.js";
import PlanetLoader from "../../gl/loaders/planet-loader.js";
import PlanetShowroom from "../../logic/animators/planet-showroom.js";

const CANVAS_DIMENSION = 400;

export default class SystemView extends ViewBase {

    constructor(gameCtx, viewId) {
        super(gameCtx, viewId);

        this.AddPanel("Data on " + this.gameCtx.playerCtx.selected);

        this.panel.AddDefinition(Composites.PanelExtra);
        
        //this.blurb = DomHelper.AppendElement(this.panel, Elements.Blurb);

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

        model.animator = new PlanetShowroom(model);
        this.SetDemoModel(model);

        const stats = this.panel.namedElements.leftSide.namedElements;
        stats.government.textContent = "Government: " + governments[model.info.demographics.government];
        stats.economy.textContent = "Economy: " + economies[model.info.demographics.economy];
        stats.techLevel.textContent = "Tech Level: " + model.info.demographics.tech;
        stats.population.textContent = "Population: " + (parseInt(model.info.demographics.type) / 10) 
                                        + " billion (" + model.info.demographics.inhabitants + ")";
                                
        stats.productivity.innerHTML = "Productivity: " + model.info.demographics.gdp + " M&cent;";

        stats.radius.textContent = "Average Radius: " + model.info.radius + " km";

        const ly = (this.gameCtx.playerCtx.selectedDistance || 0.0).toFixed(1);
        stats.distance.textContent = "Distance: " +  + ly + " ly";

        this.panel.namedElements.blurb.textContent = model.info.demographics.description;
    }
}

const economies = [
    "Rich Industrial",
    "Average Rich Industrial",
    "Poor Rich Industrial",
    "Mainly Rich Industrial",
    "Mainly Agricultural",
    "Rich Agricultural",
    "Average Agricultural",
    "Poor Agricultural"
];

const governments = [
    "Anarchy",
    "Feudal",
    "Multi-government",
    "Dictatorship",
    "Communist",
    "Confederacy",
    "Democracy",
    "Corporate State"
];

const MenuItems = [
    {
        caption: "Go Back",
        event: "changeView",
        detail: { to: "GalacticChart" },
        help: "return to previous"
    }
];

const Elements = {
    Statistic: {
        classes: "bold",
        styles: {
            minWidth: "220px",
            backgroundColor: "transparent",
            margin: "5px",
            textAlign: "left",
            color: "--first-text-color",
        }
    }
}

const Composites = {
    PanelExtra: {
        elements: [ {
            tag: "xt-flex",
            options: {across: false},
            name: "leftSide",
            styles: {
                flexGrow: 1,
                color: "blue",
                alignSelf: "stretch",
                alignItems: "start"
            },
            elements: [ {
                name: "government",
                extends: Elements.Statistic
            }, {
                name: "economy",
                extends: Elements.Statistic
            }, {
                name: "techLevel",
                extends: Elements.Statistic
            }, {
                name: "population",
                extends: Elements.Statistic
            }, {
                name: "productivity",
                extends: Elements.Statistic
            }, {
                name: "radius",
                extends: Elements.Statistic
            }, {
                name: "distance",
                extends: Elements.Statistic
            }]
        }, {
            name: "blurb",
            classes: "italic",
            styles: {
                backgroundColor: "transparent",
                fontStyle: "italic",
                margin: "5px",
                marginBottom: "32px",
                lineHeight: "1.6rem",
                textAlign: "left",
                color: "--second-text-color"
            }
        }]
    }
};

