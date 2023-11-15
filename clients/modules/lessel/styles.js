export default class Styles {
    el;

    constructor(el) {
        this.el = el;
    }

    async ApplyRules(definition = {}) {
        this.ApplyRulesTo(this.el.style, definition);
    }

    ApplyRulesTo(target = {}, definition = {}) {
        if (Array.isArray(definition)) {
            definition.forEach(element => {
                this.ApplyRulesTo(target, element);
            })
            return;
        }
        if (definition.extends) { 
            this.ApplyRulesTo(target, definition.extends);
        }
        
        for (let [key, value] of Object.entries(definition)){
            //if (value.startsWith("-")) {
            if (key === "extends") {
                continue;
            } else if (value.toString().startsWith("-")) {
                value = "var(--" + value.substring(1) + ")";
            }
            target[key] = value;
        }
    }
}