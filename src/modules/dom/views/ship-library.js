import ShipLoader from "../../gl/loaders/ship-loader.js";
import StatisticsExpander from "../../logic/library/statistics-expander.js";
import DomHelper from "../utilities/dom-helper.js";
import ViewBase from "./_view-base.js";
import StationShowroom from "../../logic/animators/station-showroom.js";

export default class ShipLibrary extends ViewBase 
{
    statisticsExpander;
    statisticsFields;
    groupMenu;
    itemMenu;

    constructor(gameCtx, viewId) 
    {
        super(gameCtx, viewId);

        this.statisticsFields = [];
        this.statisticsExpander = new StatisticsExpander();

        this.AddPanel("Ship Library");

        this.area = DomHelper.AppendElement(this.panel, Elements.LibraryArea);

        this.leftSide = DomHelper.AppendElement(this.area, Elements.LeftSide);
        this.rightSide = DomHelper.AppendElement(this.area, Elements.RightSide);

        this.addLibraryMenus();

        this.use = DomHelper.AppendElement(this.rightSide, Elements.Purpose, "use here");
        //add an invisible opposite the purpose to even out the rows
        const invisibleItem = DomHelper.AppendElement(this.leftSide, Elements.Purpose, "&nbsp;");
        DomHelper.ApplyStyles(invisibleItem, {opacity: 0});

        this.blurb = DomHelper.AppendElement(this.panel, Elements.Blurb, "blurb here");

        this.populateGroupMenu();

        this.AddMenu(MenuMain);

        this.groupMenu.value = 0;
        this.populateItemMenu();
    }

    addLibraryMenus() 
    {
        this.groupMenu = DomHelper.AppendElement(this.leftSide, Elements.Combo);
        this.itemMenu = DomHelper.AppendElement(this.rightSide, Elements.Combo);
        this.groupMenu.addEventListener("change", this.onGroupChanged.bind(this));
        this.itemMenu.addEventListener("change", this.onItemChanged.bind(this));
     }

    populateGroupMenu() 
    {
        const options = {};

        for (let i = 0; i < Library.length; i++) {
            const groupData = Library[i];
            options[i] = groupData.name;
        }

        DomHelper.ExpandOptions(this.groupMenu, options);
    }

    onGroupChanged(event) 
    {
        this.populateItemMenu();
    }

    populateItemMenu() 
    {
        const groupIndex = this.groupMenu.value;
        const groupData = Library[groupIndex];

        const options = {};
        for (let i = 0; i < groupData.items.length; i++) 
        {
            const itemData = groupData.items[i];
            options[i] = itemData.title;
        }

        DomHelper.EraseChildren(this.itemMenu);
        DomHelper.ExpandOptions(this.itemMenu, options);
        this.itemMenu.value = 0;
        this.setItemInfo();
    }

    async onItemChanged(event) 
    {
        await this.setItemInfo();
    }

    async setItemInfo() 
    {
        const groupIndex = this.groupMenu.value;
        const groupData = Library[groupIndex];
        
        const itemIndex = this.itemMenu.value;
        const itemData = groupData.items[itemIndex];

        const existingModel = (this.gameCtx.demoModel) ? this.gameCtx.demoModel.name: "";

        if (existingModel !== itemData.model) 
        {
            await this.loadNewModel(itemData);
        }
    }

    async loadNewModel(itemData) 
    {    
        this.clearScene();
        this.clearShipInfo();
        const modelLoader = new ShipLoader(this.gameCtx);
        const modelData = await modelLoader.LoadData(itemData.model);

        if (modelData.limits && modelData.library)
        {
            this.statisticsExpander.Expand(modelData);
        }

        this.displayShipInfo(modelData.library);

        const newShip = await modelLoader.HydrateModel(modelData);

        if (modelData.library.offset) {
            newShip.worldPosition.x += modelData.library.offset[0] || 0;
            newShip.worldPosition.y += modelData.library.offset[1] || 0;
            newShip.worldPosition.z += modelData.library.offset[2] || 0;
        }

        if (itemData.animator)
        {
            debugger;
            newShip.animator = new itemData.animator(newShip);
        }
        this.SetDemoModel(newShip);

    }

    clearShipInfo()
    {
        this.use.textContent = "";
        this.blurb.textContent = "";
        this.statisticsFields.forEach(field => {
            field.remove();
        });
        this.statisticsFields = [];
    }

    displayShipInfo(libraryInfo)
    {
        this.use.textContent = libraryInfo.use;
        this.blurb.textContent = libraryInfo.blurb;

        const statistics = libraryInfo.statistics || [];
        //iterate through any statistics
        statistics.forEach(statistic => {
            const parent = (statistic.column % 2 === 0) ? this.leftSide: this.rightSide;
            const textValue = statistic.label + ": " + statistic.value;
            const field = DomHelper.AppendElement(parent, Elements.Statistic, textValue);
            this.statisticsFields.push(field);
        });
    }

};

const Styles = {
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
    RightSide: {
        flexGrow: 1,
        alignSelf: "stretch",
        alignItems: "flex-end"
    },
    Combo: {
        color: "green",
        backgroundColor: "transparent",
        textIndent: 0,
        textAlign: "start",
        borderRadius: "5px",
        margin: "5px",
        boxShadow: "0",
        minWidth: "220px"
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
        color: "yellow"
    }
};

const Elements = {
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
    RightSide: {
        tag: "div",
        classes: "flex-down",
        styles: Styles.RightSide
    },
    Combo: {
        tag: "select",
        classes: "bold",
        styles: Styles.Combo
    },
    Statistic: {
        tag: "p",
        classes: "bold",
        styles: [Styles.Info, Styles.Yellow]
    },
    Purpose: {
        tag: "p",
        classes: "bold",
        styles: [Styles.Info, Styles.Yellow]
    },
    Blurb: {
        tag: "p",
        classes: "italic",
        styles: Styles.Blurb
    }
}

const MenuMain = [
    {
        caption: "Go Back",
        event: "changeView",
        detail: { to: "Welcome" },
        help: "select a classification and item from the upper menus"
    }
];

const Library = [{
    name: "Ships",
    items: [{ title: "Adder", model: "ships/adder" },
    { title: "Anaconda", model: "ships/anaconda" },
    { title: "Asp Mark II", model: "ships/asp" },
    { title: "Boa", model: "ships/boa" },
    { title: "Boa Class Cruiser", model: "ships/boa-mk2" },
    { title: "Cobra Mark I", model: "ships/cobra-mk1" },
    { title: "Cobra Mark III", model: "ships/cobra-mk3" },
    { title: "Fer-de-Lance", model: "ships/ferdelance" },
    { title: "Galcop Viper", model: "ships/viper" },
    { title: "Galcop Viper Interceptor", model: "ships/viper-interceptor" },
    { title: "Gecko", model: "ships/gecko" },
    { title: "Krait", model: "ships/krait" },
    { title: "Mamba", model: "ships/mamba" },
    { title: "Moray Star Boat", model: "ships/moray" },
    { title: "Orbital Shuttle", model: "ships/shuttle" },
    { title: "Python", model: "ships/python" },
    { title: "Sidewinder Scout Ship", model: "ships/sidewinder" },
    { title: "Transporter", model: "ships/transporter" },
    { title: "Worm", model: "ships/worm" }]
}, {
    name: "Thargoid ships",
    items: [{ title: "Thargoid Robot Fighter", model: "thargoids/thargon" },
    { title: "Thargoid Warship", model: "thargoids/warship" }]
}, {
    name: "Weapons",
    items: [{ title: "ECM Hardened Missile", model: "weapons/missile-hardhead" },
    { title: "Missile", model: "weapons/missile" },
    { title: "Quirium Cascade Mine", model: "weapons/qbomb" }]
}, {
    name: "Installations",
    items: [{ title: "Coriolis Station", model: "stations/coriolis", animator: StationShowroom},
    { title: "Dodecahedron Station", model: "stations/dodecahedron", animator: StationShowroom },
    { title: "Icosahedron Station", model: "stations/icosahedron", animator: StationShowroom },
    { title: "Rock Hermit", model: "stations/rock-hermit", animator: StationShowroom }]
}, {
    name: "Miscellaneous",
    items: [{ title: "Asteroid", model: "misc/asteroid" },
    { title: "Cargo Container", model: "misc/barrel" },
    { title: "Escape Capsule", model: "misc/escape-capsule" },
    { title: "Navigation Buoy", model: "misc/buoy" }]
}];
