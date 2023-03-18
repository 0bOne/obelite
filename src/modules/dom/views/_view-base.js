import DomHelper from "../utilities/dom-helper.js";
import Menu from "./components/menu.js";

export default class ViewBase
{
    gameCtx;
    menu;
    boundAnimateFunc;

    constructor(gameCtx, viewId)
    {
        this.gameCtx = gameCtx;
        DomHelper.EraseChildren(this.gameCtx.content);
        this.gameCtx.content.id = "view-" + viewId;
    }

    AddPanel()
    {
        this.panel = DomHelper.AppendElement(this.gameCtx.content, Elements.NarrowPane);
    }

    AddTitle(titleText)
    {
        this.title = DomHelper.AppendElement(this.panel, Elements.Title, titleText);
        this.AddUnderline();
    }

    AddUnderline()
    {
        DomHelper.AppendElement(this.panel, Elements.TitleUnderline);
    }

    AddMenu(menuItems, defaultHelp)
    {
        this.menu = new Menu(this.panel, menuItems, defaultHelp);
    }

    AddInfo(lines)
    {
        const info = DomHelper.AppendElement(this.panel, Elements.Info);
        lines.forEach(line => {
            const element = DomHelper.AppendElement(info, {tag: "div"}, line);
        });
    }

    clearScene()
    {
        //TODO: remove this workaround 
        //make the ship load in the existing context
        window.$game.resetGLContext(); 
    }

    AddNotes(lines)
    {
        const notes = DomHelper.AppendElement(this.panel, Elements.Notes);
        lines.forEach(line => {
            const element = DomHelper.AppendElement(notes, Elements.Note, line);
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
        DomHelper.EraseChildren(this.gameCtx.content);
    }
}

const Styles = {
    NarrowPane: {
        backgroundColor: "transparent",
        minWidth: "800px",
        maxWidth: "800px",
        height: "100%"
    },
    Title: {
        //TODO: break colors out into variables so they can be theme-driven
        color: "red"
    },
    TitleUnderLine: {
        border: "2px solid gray",
        width: "100%"
    },
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
        textAlign: "left",
        paddingLeft: "24px"
    }
};

const Elements = {
    NarrowPane: {
        id: "narrow-panel",
        tag: "div",
        styles: Styles.NarrowPane,
        classes: "flex-down"
    },
    Title: {
        tag: "div",
        text: "",
        classes: "bold",
        styles: Styles.Title
    },
    TitleUnderline: {
        tag: "hr",
        styles: Styles.TitleUnderLine
    },
    Info: {
        tag: "div",
        classes: "info flex-down",
        styles: Styles.Info
    },
    Notes: {
        tag: "div",
        classes: "notes",
        styles: Styles.Notes
    },
    Note: {
        tag: "div",
        styles: Styles.Note
    }
};