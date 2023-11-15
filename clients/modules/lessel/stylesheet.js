import Styles from "./styles.js";

export default class StyleSheet {

    el;
    sheet;
    rules = {};
    styler;

    constructor(parent) {
        parent = parent || document.head;
	    this.el = document.createElement("style");
		this.el = parent.appendChild(this.el);
		this.sheet = this.el.sheet;
        this.styler = new Styles(this.el);
    }

    AddSheet(definition) {
        if (definition.fonts) {
            this.AddFonts(definition.fonts);
        }
        if (definition.variables) {
            this.AddVariables(definition.variables);
        }
        if (definition.styles) {
            this.AddStyleRules(definition.styles);
        }
    }

    AddStyleRules(rules, selector = "") {

        selector = selector.trim();
        let relationship = rules.$rel || " "; //relationship with parent. defaults to ' ' (any descendant of)
        let suffix = rules.$suffix || "";  //indicates this selector attributes, properties, pseodo style suffixes
        let styleBlock = {};

        for (let [key, value] of Object.entries(rules)) {
            if (key === "$suffix" || key === "$rel") {
                //these indicate selector information. do nothing
            } else if (key.startsWith("_")) {
                //a class name block
                this.AddStyleRules(value, selector + relationship + "." + key.substring(1) + suffix);
            } else if (key === key.toUpperCase()) {
                //an html tag block
                this.AddStyleRules(value, selector + relationship + key.toLowerCase() + suffix);
            }
            else if (selector === "") {
                throw "style key found but no selector defined " + key + ": " + value;
            } else {
                //insert into the style block for conversion to a rule
                styleBlock[key] = value;
             }
        }

        if (selector.length > 0 && Object.keys(styleBlock).length > 0) {
            const rule = this.ensureStyleRule(selector);
            this.styler.ApplyRulesTo(rule.style, styleBlock);
        }
    }

    AddFonts(fonts) {
        for (let [face, url] of Object.entries(fonts)) {
            const faceCss = `@font-face {
                font-family: ${face};
                src: url(${url});
            }`;
            this.sheet.insertRule(faceCss, this.sheet.cssRules.length);
        }
    }

    AddVariables(variables) {
        for (let [key, value] of Object.entries(variables)) {
            document.documentElement.style.setProperty('--' + key, value);
        }
    }

    ensureStyleRule(selector) {            
        let result;
        if (!this.rules[selector]) {
            const ruleNumber = this.sheet.insertRule(selector + " {}");
            this.rules[selector] = this.sheet.cssRules[ruleNumber];
        }
        return this.rules[selector];
    }
}