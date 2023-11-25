import El from "../lessel/el.js";
import LessEl from "../lessel/less-el.js";

export default class Menu extends El { 

    itemDefinition;
    itemWrappers = [];
    currentItem = 0;
    helpArea;

    constructor(el) {
        super(el);
    }

    async Set(definition) {
        await super.Set(definition);
        this.itemDefinition = definition.itemDefinition;
        this.helpDefinition = definition.helpItem;
        await this.SetItems(definition.menuItems);
    }

    async SetItems(menuItems = {}) {
        for (let i = 0; i < menuItems.length; i++) {
            await this.AddItem(menuItems[i]);
        }
        this.currentItem = 0;
        await this.changeFocus(0);
    }

    async AddItem(menuItem) {
        const definition = {
            tag: this.itemDefinition.tag,
            extends: this.itemDefinition,
            attributes: {
                title: menuItem.help
            },
            events: {
                sources: ["focus", "click", "mouseover", "keyup"],
                handler: this,
                data: menuItem
            },
            text: menuItem.text
        };
        this.itemWrappers.push(await LessEl.Create(this.el, definition));
    }

    async onEvent(eventName, menuItem, event) {
        switch(eventName) {
            case "mouseover":
            case "focus":
                this.currentItem = this.itemWrappers.indexOf(event.currentTarget.$$);
                await this.setHelp();
                break;
            case "keyup":
                await this.onKeyUp(menuItem, event);
                break;
            case "click":
                this.RaiseGameEvent(menuItem.event);
                break;
                //TODO: raise custom event
        }   
        //debugger;
    }

    async onKeyUp(menuItem, event) {
        switch (event.code){
            case "ArrowDown":
                await this.changeFocus(1);
                break;
            case "ArrowUp": 
                await this.changeFocus(-1);
                break;
            case "Enter":
                this.onEvent("click", menuItem, event);
                break;
        }
    }

    async changeFocus(indexDelta = 0) {
        this.currentItem += indexDelta;
        //console.log("current item #", this.currentItem);
        if (this.currentItem < 0) {
            this.currentItem = this.itemWrappers.length - 1;
        }
        if (this.currentItem >= this.itemWrappers.length) {
            this.currentItem = 0;
        }
        this.itemWrappers[this.currentItem].el.focus();
    }

    async setHelp() {
        if (!this.helpItem && this.helpDefinition) {
            //console.log("creating help element");
            this.helpItem = await LessEl.Create(this.el, this.helpDefinition);
        }

        if (this.helpItem) {
            this.helpItem.el.textContent = this.itemWrappers[this.currentItem].el.title;
        }
    }

};
