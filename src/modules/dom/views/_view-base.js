import DomHelper from "../../utilities/dom-helper.js";
import Menu from "./components/menu.js";

export default class ViewBase
{
    _gameContext;
    _menu;
    _boundAnimateFunc;

    constructor(gameContext, viewId)
    {
        this._gameContext = gameContext;
        DomHelper.EraseChildren(this._gameContext.ContentEl);
        this._gameContext.ContentEl.id = "view-" + viewId;
    }

    AddPanel()
    {
        this._panel = DomHelper.AppendElement(this._gameContext.ContentEl, Elements.NarrowPane);
    }

    AddTitle(titleText)
    {
        DomHelper.AppendElement(this._panel, Elements.Title, titleText);
        DomHelper.AppendElement(this._panel, Elements.TitleUnderline);
    }

    AddMenu(menuItems)
    {
        this._menu = new Menu(this._panel, menuItems);
    }

    AddInfo(lines)
    {
        const info = DomHelper.AppendElement(this._panel, Elements.Info);
        lines.forEach(element => {
            DomHelper.AppendElement(info, {tag: "div"}, element);
        });
    }

    async Create()
    {
        if (this._menu)
        {
            this._menu.SetFocusButton(0);
        }
    }

    Destroy()
    {
        DomHelper.EraseChildren(this._gameContext.ContentEl);
    }
}

const Styles = {
    NarrowPane: {
        backgroundColor: "transparent",
        minWidth: "800px",
        height: "100%"
    },
    Title: {
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
    }
};