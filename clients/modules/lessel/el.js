
export default class El {

    el;

    constructor(el) {
        this.el = el;
        this.el.$$ = this;
        this.styles = new Styles(this.el);
        this.svg = new Svg(this.el);
    }

    async Set(definition) {
        await this.styles.Set(definition.styles);
        await this.svg.Set(definition.svg);
    }
}


 class Styles {
    el;

    constructor(el) {
        this.el = el;
    }

    async Set(definition = {}) {
        this.SetTarget(this.el.style, definition);
    }

    SetTarget(target = {}, definition = {}) {
        for (let [key, value] of Object.entries(definition)){
            target[key] = value;
        }
    }
}

class Svg {
    constructor(el) {
        this.el = el;
    }

    async Set(definition = {}) {
        if (definition.src) {
            const response = await fetch(definition.src);
            if (response.ok) {
                //these svgs are embedded so "currentColor" comes from the inherited element
                //(not possible with externally linked svgs
                const fetchedHtml = await response.text();
                this.el.innerHTML = fetchedHtml;
            }
        }
    }
}