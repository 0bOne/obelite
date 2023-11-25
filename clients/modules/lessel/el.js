import Styles from "./styles.js";
import LessEl from "./less-el.js";
export default class El {

    el;
    name;
    styles;
    svg;
    kids;
    named;
    data;

    constructor(el) {
        this.el = el;
        this.el.$$ = this;
        this.styles = new Styles(this.el);
        this.kids = [];
        this.named = {};
    }

    async Set(definition) {

        if (definition.extends) {
            await this.Set(definition.extends);
        }

        await this.AddAttributes(definition.attributes);
        await this.styles.ApplyRules(definition.styles);
        await this.AddSVG(definition.svg);
        await this.AddEvents(definition.events);
        await this.AddKids(definition.kids);

        if (definition.classes) {
            this.el.classList.add(definition.classes);
        }

        if (definition.text) {
            this.el.textContent = definition.text;
        }

        if (definition.name) {
            this.name = definition.name;
            this.el.setAttribute("name", this.name);
        }

        if (definition.data) {
            this.data = definition.data;
        }
    }

    async AddKids(definitions = []) {
        for (let i = 0; i < definitions.length; i++) {
            await this.AddKid(definitions[i]);
        }
    }

    async AddKid(definition) {
        const kid = await LessEl.Create(this.el, definition);
        if (kid.name) {
            this.named[kid.name] = kid;
        }
        this.kids.push(kid);
    }

    async AddAttributes(attributesDef = {}) {
        for (let [key, value] of Object.entries(attributesDef)) {
            this.el.setAttribute(key, value);
        }
    }

    async AddSVG(svgDef = {}) {
        if (svgDef.src) {
            const response = await fetch(svgDef.src);
            if (response.ok) {
                //these svgs are embedded so "currentColor" comes from the inherited element
                //(not possible with externally linked svgs
                const fetchedHtml = await response.text();
                this.el.innerHTML = fetchedHtml;
            }
        }
    }

    async AddEvents(eventDef = {}) {
        if (eventDef.handler && eventDef.sources) {
            const wrapper = this;
            eventDef.sources.forEach(eventName => {
                this.el.addEventListener(eventName, eventDef.handler.onEvent.bind(eventDef.handler, eventName, eventDef.data));
            });
        }
    }

    RaiseGameEvent(detail) {
        document.body.dispatchEvent(new CustomEvent("GameEvent", {detail: detail}));
    }
}
