import Styles from "./styles.js";
import LessEl from "./less-el.js";
export default class El {

    el;
    styles;
    svg;
    kids;
    named;

    constructor(el) {
        this.el = el;
        this.el.$$ = this;
        this.styles = new Styles(this.el);
        this.svg = new Svg(this.el);
        this.kids = [];
        this.named = {};
    }

    async Set(definition) {
        await this.styles.ApplyRules(definition.styles);
        await this.svg.Set(definition.svg);
        await this.AddKids(definition.kids);

        if (definition.classes) {
            this.el.classList.add(definition.classes);
        }

        if (definition.text) {
            this.el.textContent = definition.text;
        }
    }

    async AddKids(definitions = []) {
        for (let i = 0; i < definitions.length; i++) {
            await this.AddKid(definitions[i]);
        }
    }

    async AddKid(definition) {
        const kid = await LessEl.Create(this.el, definition);
        if (kid.el.name) {
            this.named[kid.el.name] = kid;
        }
        this.kids.push(kid);
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