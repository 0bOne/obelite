import DomHelper from "../../../utilities/dom-helper.js";

export default class Menu
{
    _buttons;
    _container;
    _helpBox;

    constructor(container, menuItems)
    {
        this._container = container;
        this.addItems(menuItems);
        DomHelper.AppendElement(container, Elements.BottomSpacer);
        this._helpBox = DomHelper.AppendElement(this._container, Elements.HelpBox, " ");
        DomHelper.AppendElement(container, Elements.BottomSpacer);
    }   
    
    addItems(menuItems)
    {
        this._buttons = [];
        const menu = DomHelper.AppendElement(this._container, Elements.Menu);
        let firstButton;
        menuItems.forEach(item => {
            const button = DomHelper.AppendElement(menu, Elements.MenuItem, item.caption);
            firstButton = firstButton || button;
            button.addEventListener("click", this.onClicked.bind(this, item));
            button.addEventListener("keydown", this.onKeyPress.bind(this, item));
            button.addEventListener("focus", this.onFocus.bind(this, item));
            button.addEventListener("blur", this.onBlur.bind(this, item));
            this._buttons.push(button);
        });
    }

    SetFocusButton(index)
    {
        this._buttons[index].focus();
    }

    onFocus(menuItem, event)
    {
        //console.log("onfocus", menuItem);
        this.onBlur(menuItem, event);
        if (menuItem.help && this._helpBox)
        {
            //console.info("showing menu help", menuItem.help);
            this._helpBox.innerText = menuItem.help;
        }
    }

    onBlur(menuItem, event)
    {
        if (this._helpBox)
        {
            this._helpBox.innerText = " ";
        }
    }

    onKeyPress(menuItem, event)
    {
        event.preventDefault();
        let indexChange = 0;

        if (event.key === "ArrowDown")
        {
            indexChange = 1;
        }
        else if (event.key === "ArrowUp")
        {
            indexChange = -1;
        }
        else if (event.key === "Enter")
        {
            this.onClicked(menuItem, event);
        }

        if (indexChange !== 0)
        {
            this.changeButtonFocusBy(event.target, indexChange);
        }
    }

    changeButtonFocusBy(button, indexChange)
    {
        let buttonIndex = this._buttons.indexOf(button);
        let maxIndex = this._buttons.length - 1;
        if (buttonIndex > -1)
        {
            buttonIndex += indexChange;
            buttonIndex = (buttonIndex < 0) ? maxIndex: buttonIndex;
            buttonIndex = (buttonIndex > maxIndex) ? 0: buttonIndex;
            this.SetFocusButton(buttonIndex);
        }
    }

    onClicked(menuItem, event)
    {
        document.body.dispatchEvent(new CustomEvent(menuItem.event, { detail: menuItem.detail}));
    }
}

const Styles = {
    Menu: {
        width: "50%",
        alignItems: "stretch"
    },
    MenuItem: {
        fontFamily: "AlmaraiBold",
        color: "yellow",
        border: "none",
        padding: 0,
        margin: 0,
        fontSize: "inherit",
        backgroundColor: "transparent"
    },
    HelpBox: {
        color: "lightgray",
        fontStyle: "italic",
        minHeight: "1em"
    }
};

const Elements = {
    Menu: {
        tag: "div",
        classes: "menu flex-down",
        styles: Styles.Menu
    },
    MenuItem: {
        tag: "button",
        classes: "menu-item",
        styles: Styles.MenuItem
    },
    HelpBox: {
        tag: "div",
        classes: "light help-box invisible",
        styles: Styles.HelpBox
    },
    BottomSpacer: {
        tag: "div",
        styles: {height: "24px"}
    }
};