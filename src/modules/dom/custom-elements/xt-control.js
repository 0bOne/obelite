
import ExtensibleElement from "./xt-element.js";

const OBSERVED_ATTRIBUTES = ["name", "definition", "disabled"];

export default class ExtensibleControlElement extends ExtensibleElement
{
    static get observedAttributes() 
    {
        return OBSERVED_ATTRIBUTES;
    }

    static get formAssociated() 
    {
        return true;
      }

    constructor() 
    {
        super();
        this.internals = this.attachInternals();
        //this.shadow = this.attachShadow({mode: 'open'});
    }

    
    connectedCallback() {
		this.tabIndex = 0;
    }


    get disabled()
     {
        return this.hasAttribute('disabled');
    }

    set disabled(value = true) 
    {
        if (value)
        {
            this.setAttribute("disabled", "");
        }
        else
        {
            this.removeAttribute("disabled");
        }
    }

    AddDefinition(definition = {})
    {
        super.AddDefinition(definition);
        this.addIcon(definition.icon)
    }

    addIcon(iconDefinition = {})
    {
        if (iconDefinition.svg)
        {
            this.iconElement = document.createElementNS("http://www.w3.org/2000/svg", "svg");
            //this.iconElement.setAttributeNS("http://www.w3.org/2000/xmlns/", "xmlns:xlink", "http://www.w3.org/1999/xlink");
            this.appendChild(this.iconElement);

            //debugger;
            this.AddStyles(iconDefinition.styles, this.iconElement.style);
            this.iconElement.setAttribute("fill", "currentColor");
            this.iconElement.setAttribute("viewBox", "0 0 16 16");
            iconDefinition.svg.paths.forEach(pathValues => {
                const pathElement = document.createElementNS("http://www.w3.org/2000/svg", 'path')
                pathElement.setAttribute("d", pathValues);
                pathElement.setAttribute("fill", "currentColor");
                this.iconElement.appendChild(pathElement);
            });
        }

    }


};