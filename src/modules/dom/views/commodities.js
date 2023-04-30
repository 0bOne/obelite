import PlanetLoader from "../../gl/loaders/planet-loader.js";
import CommodityAmounts from "../../logic/rules/commodity-amounts.js";
import ViewBase from "./_view-base.js";
import {BUY, SELL} from "./icons/svg-icons.js";
import jsYaml from "../utilities/js-yaml.js";

export default class CommodityView extends ViewBase {

    constructor(gameCtx, viewId) 
    {
        super(gameCtx, viewId);

        //TODO: should only be able to get commodity data on current planet, NOT selected planet
        this.currentGalaxy = this.gameCtx.playerCtx.galaxy;
        this.currentPlanet = this.gameCtx.playerCtx.selected;
        this.itemsHeld = this.gameCtx.playerCtx.commodities || {};

        this.AddPanel(this.currentPlanet + " Commodity Market");
        this.addGrid();

        this.AddMenu(MenuItems);
    }

    addGrid()
    {
        this.grid = this.panel.AddChild(Composites.CommodityGrid);
        this.credits = this.panel.AddChild(Elements.CreditsInfo);
    }

    async Create()
    {
        await super.Create();
        await this.loadCommodities();
        this.populateGrid();
        this.updateCredits();
    }

    async loadCommodities()
    {
        const url = this.gameCtx.dataPath + "/trade/commodities2.yaml";
        this.commodities = await jsYaml.fetch(url);
        const planetLoader = new PlanetLoader(this.gameCtx);
        const planetInfo = await planetLoader.LoadInfo(this.currentGalaxy, this.currentPlanet);
        CommodityAmounts.Calculate(this.commodities, planetInfo);
    }

    populateGrid()
    {
        this.commodities.forEach(commodity => {
            const units = UnitLabels[commodity.unit] || "??";
            const available = commodity.available || "-";
            const held = this.itemsHeld[commodity.name] || "-";
            const legality = (commodity.legal === "no") ? "lm": "-";
            
            const row = this.grid.NewRow();
            row.name.textContent = commodity.name;
            row.price.textContent =  commodity.cost.toFixed(1);
            row.available.textContent =  available;
            row.availUnits.textContent = units;
            row.held.textContent =  held, units;
            row.heldUnits.textContent = units;
            row.legal.textContent =  legality;

            commodity.row = row;
            commodity.buyButton = row.buttons.AddChild(Elements.BuyButton);
            commodity.sellButton = row.buttons.AddChild(Elements.SellButton);

            commodity.buyButton.addEventListener("click", this.onBuyClicked.bind(this, commodity));
            commodity.sellButton.addEventListener("click", this.onSellClicked.bind(this, commodity));
            this.updateButtons(commodity);
        });
    }

    onBuyClicked(commodity, evt)
    {
        const available = commodity.available || 0;
        const held = this.itemsHeld[commodity.name] || 0;
        if (available > 0)
        {
            this.performTransaction(commodity, available - 1, held + 1, -commodity.cost);
        }    
    }

    onSellClicked(commodity, evt)
    {
        const available = commodity.available || 0;
        const held = this.itemsHeld[commodity.name] || 0;
        if (held > 0)
        {
            this.performTransaction(commodity, available + 1, held - 1, commodity.cost);
        }
    }

    performTransaction(commodity, available, held, moneyChange)
    {
        this.itemsHeld[commodity.name] = held;
        commodity.available = available;
        this.gameCtx.playerCtx.credits += moneyChange;
        this.updateButtons(commodity);
        this.updateCredits();
    }


    updateButtons(commodity)
    {
        const available = commodity.available || 0;
        const held = this.itemsHeld[commodity.name] || 0;
        const cantAfford = (this.gameCtx.playerCtx.credits < commodity.cost);
        commodity.buyButton.disabled = (available === 0 || cantAfford)
        commodity.sellButton.disabled = (held === 0);

        commodity.row.available.textContent = available;
        commodity.row.held.textContent = held;
}

    updateCredits()
    {
        this.credits.textContent = "Credits Available: " + this.gameCtx.playerCtx.credits;
    }
}

const UnitLabels = {
    "T": "t",
    "K": "kg",
    "g": "g"
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
    IconButton: {
        border: 0,
        display: "inline-block",
        width: "1rem",
        height:"1rem",
        $enabled: {
            color: "inherit",
            cursor: "pointer"
        },
        $disabled: {
          color: "linen",
          opacity: 0.6
        }
    },
    IconStyle: {
        width: "1rem",
        height: "1rem"
    },
    CreditsInfo: {
        minWidth: "100%",
        backgroundColor: "transparent",
        justifySelf: "start",
        margin: "5px",
        color: "--second-text-color",
        textAlign: "left"
    },
};

const Elements = {
    BuyButton: {
        tag: "xt-control",
        role: "button",
        attributes: {title: "Buy"},
        icon: {svg: BUY, styles: Styles.IconStyle},
        styles: [Styles.IconButton]
    },
    SellButton: {
        tag: "xt-control",
        role: "button",
        attributes: {title: "Sell"},
        icon: {svg: SELL, styles: Styles.IconStyle},
        styles: [Styles.IconButton]
    },
    CreditsInfo: {
        tag: "xt-div",
        classes: "bold",
        styles: [Styles.CreditsInfo]
    },
};


const GridStyles = {
    Grid: {
        marginTop: "1rem",
        marginBottom: "1rem",
        lineHeight: "1.2rem"
    },
    Header: {
        textTransform: "capitalize",
        color: "--headcell-text-color",
        fontFamily: "--bold-font",
        fontSize: "1rem"
    },
    UnitsHeader: {
        //offset to right-align with units
        textTransform: "capitalize",
        color: "--headcell-text-color",
        fontFamily: "--bold-font",
        fontSize: "1rem",
        justifySelf: "end",
        whiteSpace: "nowrap",
        position: "relative",
        left: "1.5rem",
        overflow: "visible"
    },
    Body: {
        color: "--first-text-color",
        fontFamily: "--bold-font"
    },
    UnitsCell: {
        color: "--first-text-color",
        paddingLeft: "0.5rem"
    },
    NameCell: {
        color: "--first-text-color",
        textTransform: "capitalize",
        fontFamily: "--bold-font",
        justifySelf: "start"
    },
    TextCell: {
		justifySelf: "start"
    },
    NumberCell: {
        justifySelf: "end"
    }
}

const Composites = {
    CommodityGrid: {
        tag: "xt-grid",
        styles: GridStyles.grid,
        options: {
            styles: {
                header: GridStyles.Header,
                body: GridStyles.Body
            },
            columns: [
                {name: "name",       width: "10fr", text: "commodity", styles: {body: GridStyles.NameCell}},
                {name: "price",      width: "4fr", text: "price",      styles: {header: GridStyles.NumberCell, body: GridStyles.NumberCell}},
                {name: "spacer1",    width: "6fr"},
                {name: "available",  width: "4fr", text: "for sale",   styles: {header: GridStyles.UnitsHeader, body: GridStyles.NumberCell}},
                {name: "availUnits", width: "1fr",                     styles: {body: GridStyles.UnitsCell}},
                {name: "spacer2",    width: "4fr"},
                {name: "buttons",    width: "3fr"},
                {name: "spacer3",    width: "1fr"},
                {name: "held",       width: "4fr", text: "in hold",    styles: {header: GridStyles.UnitsHeader, body: GridStyles.NumberCell}},
                {name: "heldUnits",  width: "1fr",                     styles: {body: GridStyles.UnitsCell}},
                {name: "spacer4",    width: "7fr"},
                {name: "legal",      width: "auto", text: "legal",     styles: {body: GridStyles.TextCell}},             
            ]
        }
    }
};
