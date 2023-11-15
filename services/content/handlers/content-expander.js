const path = require("node:path");
const fsp = require("node:fs").promises;
const yaml = require("yaml");

const NO_CLOSING_TAG = ["area", "base", "br", "col", "embed", "hr", "img", "input", "link", "meta", "param", "source", "track", "wbr"];

module.exports = class ContentExpander {
    constructor(config) {
        this.env = config.env;
        this.docRoot = config.docRoot;
    }

    async Handle(context) {
        switch(context.fileType.ext) {
            case "json":
                await this.serveYamlAsJson(context);
                break;
            case "html": 
                await this.serveYamlAsHtml(context);
                break;
            default:
                await this.loadFile(context);
        }
    }

    async loadFile(context) {
        context.buffer = await fsp.readFile(context.source, {encoding: context.fileType.encoding});
        context.responseHeaders["Content-Type"] = context.fileType.mime;
        context.responseHeaders["Content-Length"] = context.buffer.length;
    }

    async loadYaml(spec) {
        const rawYaml = "" + await fsp.readFile(spec, {encoding: "utf-8"});
        const result = yaml.parse(rawYaml);
        return result;
    }

    async serveYamlAsJson(context) {
        debugger;
        const obj = await this.loadYaml(context.source);
        const body = JSON.stringify(obj, null, "\t");
        context.buffer = Buffer.from(body, context.fileType.encoding);
        context.code = 200;
        context.responseHeaders["Content-Type"] = context.fileType.mime;
        context.responseHeaders["Content-Length"] = context.buffer.length;
    }

    async serveYamlAsHtml(context) {
        let page = await this.loadInheritedYaml(context.source);
        if (page.title) {
            page.head.push({title: {text: page.title}});
        }
        if (page.module) {
            page.head.push({script: {type: "module", src: page.module}});
        }

        const body = this.toHTMLPage(page);
        context.buffer = Buffer.from(body, context.fileType.encoding);
        context.stats.size = body.length;
    }

    toHTMLPage(page) {
        let result = "<!DOCTYPE html>\r\n";
        result += `<html lang="${page.lang}" >`;
        result += this.toHtmlTag("head", page.head, "\t");
        result += this.toHtmlTag("body", page.body, "\t");
        result += "\r\n</html>";
        return result;
    }

    toHtmlTag(tagName, definition, indent = "\t") {

        if (!definition) debugger;

        let text = "";
        let children = [];
        let attributes = {};

        const noClosingTag = NO_CLOSING_TAG.includes(tagName);
        let closingTag = "</" + tagName + ">";

        if (tagName === "style") {
            text = this.toStyleRules(definition);
        } else if (Array.isArray(definition)) {
            //its an array of child elements, rearrange
            children = definition;
        } else if (typeof definition === "string") {
            text = definition;
        } else if (typeof definition === "object") {
            //its a mix of text, elements, and attributes
            text = definition.text || "";
            delete definition.text;
            children = definition.children || [];
            delete definition.children;
            attributes = definition;
        } else {
            debugger; //unexpected. TODO: return error or ignore?
        }

        let attributeHTMLParts = "";
        for (let [key, value] of Object.entries(attributes)) {
            attributeHTMLParts += ` ${key}="${value}" `;
        }
        
        let childHtmlParts  = "";
        children.forEach(childDefinition => {
            const tagName = Object.keys(childDefinition)[0];
            childHtmlParts += this.toHtmlTag(tagName, childDefinition[tagName], indent + "\t");
        });

        let tagEndBrace = ">";
        if (childHtmlParts.length === 0 && text.length === 0 && tagName !== "script") {
            tagEndBrace = "/>";
            closingTag = "";
        }

        if (childHtmlParts.length > 0) {
            //if element has children, move closing tag down to newline
            closingTag = "\r\n" + indent + closingTag;
            text = ""; //can't have raw text and children
        }

        if (tagName === "style") {
            closingTag = indent + closingTag;
        }

        if (noClosingTag) {
            //void elements never have content and never have closing tags. see the array defined at the top of this module
            tagEndBrace = ">";
            closingTag = "";
        }

        const result = "\r\n" + indent + "<" + tagName + attributeHTMLParts + tagEndBrace + childHtmlParts + text + closingTag;
        return result;
    }

    toStyleRules(definition, indent = "\t") {
        let css = "\r\n";
        for(let [rule, styles] of Object.entries(definition)) {
            css += indent + "\t\t" + rule + " {\r\n";
            for (let[cssKey, cssValue] of Object.entries(styles)) {
                if (typeof cssValue !== "string") debugger; //unexpected
                css += indent + `\t\t\t${cssKey}: ${cssValue};\r\n`;
            }
            css += indent + "\t\t}\r\n";
        }
        return css;
    }

    async loadInheritedYaml(source) {
        let result = await this.loadYaml(source);
        if (result.extends) {
            const inheritedSource = path.join(path.dirname(source), result.extends);
            const inheritedResult = await this.loadInheritedYaml(inheritedSource);

            //head and body are arrays of elements, so they must be inherited differently from the main document
            //TODO: build an object deep clone to simplify + SRP this
            const inheritingHead = result.head || [];
            const inheritingBody = result.body || [];
            const inheritedHead = inheritedResult.head || [];
            const inheritedBody = inheritedResult.body || [];
            delete result.head;
            delete result.body;
            delete inheritedResult.head;
            delete inheritedResult.body;
            result = Object.assign({}, inheritedResult, result);
            result.head = [...inheritedHead, ...inheritingHead];
            result.body = [...inheritedBody, ...inheritingBody];
            result.title = result.title || inheritedResult.title;
            result.module = result.module || inheritedResult.module;
        }
        delete result.extends;
        return result;
    }
}