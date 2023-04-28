import Menu from "./components/menu.js";
import ShipShowroom from "../../logic/animators/ship-showroom.js";

export default class ViewBase
{
    gameCtx;
    menu;
    boundAnimateFunc;

    constructor(gameCtx, viewId)
    {
        this.gameCtx = gameCtx;
        this.gameCtx.content.ClearChildren();
        this.gameCtx.content.setAttribute("name", "view-" + viewId);
    }

    AddPanel(title)
    {
        this.panel = this.gameCtx.content.AddChild(Components.NarrowPane);
        this.panel.namedElements.title.textContent = title;
    }

    AddUnderline()
    {
        this.panel.AddChild(Elements.Underline);
    }

    AddMenu(menuItems, defaultHelp)
    {
        this.menu = new Menu(this.panel, menuItems, defaultHelp);
    }

    AddInfo(lines)
    {
        const info = this.panel.AddChild(Elements.Info);
        lines.forEach(line => {
            const element = info.AddChild({tag: "xt-div"});
            element.textContent = line;
        });
    }

    SetDemoModel(model)
    {
        this.clearScene();
        if (model)
        {        
            this.gameCtx.demoModel = model;
            this.gameCtx.demoModel.isVisible = true;
            model.animator = model.animator || new ShipShowroom(model);
            this.gameCtx.scene.models.push(this.gameCtx.demoModel);
        }
    }

    clearScene()
    {
        if (this.gameCtx.demoModel)
        {
            this.gameCtx.scene.remove(this.gameCtx.demoModel);
            this.gameCtx.demoModel = null;
        }
    }

    AddNotes(lines)
    {
        const notes = this.panel.AddChild(Elements.Notes);
        lines.forEach(line => {
            const element = notes.AddChild(Elements.Note);
            element.textContent = line;
        });
    }

    async Create()
    {
        if (this.menu)
        {
            this.menu.SetFocusButton(0);
        }
    }

    async onKey(event) {} //override to handle keystrokes
    async animate(gameCtx) {} //overrie to handle animation frames

    Destroy()
    {
        this.clearScene();
        this.gameCtx.content.ClearChildren();
    }
};

const Styles = {
    Info: {
        flexGrow: 1,
        justifyContent: "space-evenly",
        color: "lightgray",
        opacity: 0.7
    },
    Notes: {
        flexGrow: 1,
        color: "white",
        alignSelf: "stretch",
        opacity: 0.8,
    },
    Note: {
        display: "block",
        textAlign: "left",
        paddingLeft: "24px"
    }
};

const Elements = {
    Underline: {
        name: "underline",
        styles: {
            border: "2px solid gray",
            width: "100%"
        }
    },
    Info: {
        tag: "xt-flex", options: {across: false},
        classes: "info noflex-down",
        styles: Styles.Info
    },
    Notes: {
        classes: "notes",
        styles: Styles.Notes
    },
    Note: {
        styles: Styles.Note
    }
}

const Components = {
    NarrowPane: {
        name: "narrow-panel",
        tag: "xt-flex",
        styles: {
            backgroundColor: "transparent",
            minWidth: "800px",
            maxWidth: "800px",
            height: "100%"
        },
        options: {
            across: false
        },
        elements: [{
            name: "title",
            classes: "bold",
            aria: {role: "heading", level: 1},
            styles : {
                color: "--title-color"
            }
        },  
        Elements.Underline]
    }
};