import ViewBase from "./_view-base.js";

export default class ShipLibrary extends ViewBase
{
    constructor(gameContext, viewId)
    {
        super(gameContext, viewId);
 
        this.AddPanel();
        this.AddTitle("Ship Library");
        this.AddInfo(["(ship library coming soon"]);
        this.AddMenu(MenuMain);
    }
}

const MenuShips = [
    //Adder, 
    //Anaconda, 
    //Asp Mark II, 
    //Boa, 
    //Boa Class Cruiser, 
    //Cobra Mk I, 
    //Cobra Mk III, 
    //Fer-de-Lance, 
    //GalCop Viper, 
    //GalCop Viper Interceptor
    //Gecko, 
    //Krait, 
    //Mamba, 
    //Moray Star Boat, 
    //Orbital Shuttle, 
    //Python,
    //Sidewinder Scout Ship, 
    //Transporter, 
    //Worm
    {
        caption: "Ships",
        event: "changeModel",
        //detail: {menu: MenuShips}
    },
];

const MenuThargoids = [
    //Thargoid Robot Fighter
    //Thargoid Warship
];

const MenuWeapons = [
    //ECM Hardened Missile,
    //Missle
    //Quirium Cascade Mine

];

const MenuInstallations = [
    //Coriolis Station
    //Dodecahedron Station
    //Icosahedron Station
    //Rock Hermit
];

const MenuMisc = [
    //Asteroid
    //Cargo Container
    //Escape Capsule
    //Navigation Buoy
];

const MenuMain = [
    {
        caption: "Back",
        event: "changeView",
        detail: {to: "Welcome"}
    },
    {
        caption: "Ships",
        event: "changeMenu",
        detail: {menu: MenuShips}
    },
    {
        caption: "Thargoid Ships",
        event: "changeMenu",
        detail: {menu: MenuThargoids}
    },
    {
        caption: "Weapons",
        event: "changeMenu",
        detail: {menu: MenuWeapons}
    },
    {
        caption: "Installations",
        event: "changeMenu",
        detail: {menu: MenuInstallations}
    },
    {
        caption: "Miscellaneous",
        event: "changeMenu",
        detail: {menu: MenuMisc}
    }
];
