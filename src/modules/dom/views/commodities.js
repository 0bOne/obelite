import CommodityLoader from "../../data/commodity-loader.js";
import PlanetLoader from "../../gl/planet-loader.js";
import CommodityAmounts from "../../logic/rules/commodity-amounts.js";
import DomHelper from "../utilities/dom-helper.js";
import ViewBase from "./_view-base.js";
import {BUY, SELL} from "./icons/svg-icons.js";

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
        const url = this.gameCtx.dataPath + "/trade/commodities.yaml";
        this.commodities = await CommodityLoader.LoadCommodities(url);
        const planetLoader = new PlanetLoader(this.gameCtx);
        const planetInfo = await planetLoader.LoadInfo(this.currentGalaxy, this.currentPlanet);
        CommodityAmounts.Calculate(this.commodities, planetInfo, this.itemsHeld);
    }

    populateGrid()
    {
        this.commodities.forEach(commodity => {
            const units = UnitLabels[commodity.unit] || "??";
            //debugger;
            const available = commodity.quantity || "-";
            const held = this.itemsHeld[commodity.name] || "-";
            const legality = (commodity.legality[0] === 0 && commodity.legality[1] === 0) ? "-": "lm";
            
            const row = this.grid.NewRow();
            this.grid.SetCell(row.name, commodity.name);
            this.grid.SetCell(row.price, commodity.price);
            this.grid.SetCell(row.available, available, units);
            this.grid.SetCell(row.held, held, units);
            this.grid.SetCell(row.legal, legality);

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
        const available = commodity.quantity || 0;
        const held = this.itemsHeld[commodity.name] || 0;
        if (available > 0)
        {
            this.performTransaction(commodity, available - 1, held + 1, -commodity.price);
        }    
    }

    onSellClicked(commodity, evt)
    {
        const available = commodity.quantity || 0;
        const held = this.itemsHeld[commodity.name] || 0;
        if (held > 0)
        {
            this.performTransaction(commodity, available + 1, held - 1, commodity.price);
        }
    }

    performTransaction(commodity, available, held, moneyChange)
    {
        this.itemsHeld[commodity.name] = held;
        commodity.quantity = available;
        this.gameCtx.playerCtx.credits += moneyChange;
        this.updateButtons(commodity);
        this.updateCredits();
    }


    updateButtons(commodity)
    {
        const available = commodity.quantity || 0;
        const held = this.itemsHeld[commodity.name] || 0;
        commodity.buyButton.disabled = (available === 0)
        commodity.sellButton.disabled = (held === 0);

        const units = UnitLabels[commodity.unit] || "??";
        this.grid.SetCell(commodity.row.available, available, units);
        this.grid.SetCell(commodity.row.held, held, units);
}

    updateCredits()
    {
        //debugger; TODO: update credit display
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
    CommodityName: {
        textTransform: "capitalize",
        fontFamily: "--bold-font",
    },
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
          opacity: 0.6,
          cursor: "not-allowed"
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

const Composites = {
    CommodityGrid: {
        tag: "xt-grid",
        styles: {
            marginTop: "1em",
            marginBottom: "1em",
            lineHeight: "1.2em"
        },
        options: {
            headerStyles: {
                textTransform: "capitalize",
                color: "--headcell-text-color",
                fontFamily: "--bold-font",
                fontSize: "1em"
            },
            bodyStyles: {
                color: "--first-text-color",
                fontFamily: "--bold-font"
            },
            unitsStyles: {
                paddingLeft: "1em"
            },
            columns: [
                {name: "name", align: "left", width: "13fr", text: "commodity", bodyStyles: Styles.CommodityName},
                {name: "price", align: "right", width: "4fr", text: "price"},
                {align: "spacer", width: "7fr"},
                {name: "available", align: "right", width: "4fr", text: "for sale"},
                {name: "buttons", align: "left", width: "3fr"},
                {align: "spacer", width: "3fr"},
                {name: "held", align: "right", width: "4fr", text: "in hold"},
                {align: "spacer", width: "7fr"},
                {name: "legal", align: "left", width: "auto", text: "legal"}              
            ]
        }
    }
};
