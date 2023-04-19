// Create a class for the element

const OBSERVED_ATTRIBUTES = ["name", "definition"];
let LAST_ELEMENT_ID = 0;

export default class ExtensibleElement extends HTMLElement 
{
    namedElements;
	_pseudo_stylesheet;

    static get observedAttributes() 
    {
        return OBSERVED_ATTRIBUTES;
    }

    constructor() 
    {
        super();
        this.namedElements = {};
      	//this.shadow = this.attachShadow({mode: 'open'});
    }

    // connectedCallback() {
	// 	this.tabIndex = 0;
    // }
  
    // disconnectedCallback() {
    //   console.log(this.tagName + 'element removed from page.');
    // }
  
    // adoptedCallback() {
    //   console.log(this.tagName +  ' element moved to new page.');
    // }
  
    //attributeChangedCallback(name, oldValue, newValue) {
    //   console.log(this.tagName + 'element attributes changed.');
    //   if (name === "definition")
    //   {
    //     this.ChangeDefinition(newValue);
    //   }
    // }

    ChangeDefinition(definition = {})
    {
      	this.ClearDefinition();
    	this.AddDefinition(definition);
    }

    ClearDefinition()
    {
		this.ClearAttributes();
		this.ClearClasses();
		this.ClearChildren();
		this.ClearText();
		this.ClearOptions();
		this.ClearStyles();
    }

    ClearAttributes()
    {
		Object.values(this.attributes).forEach(attributeName => {
			this.removeAttribute(attributeName)
		});
    }

    ClearClasses()
    {
		while(this.classList.length > 0)
		{
			this.classList.remove(...this.classList);
		}
    }

    ClearStyles()
    {
    }

    ClearChildren()
    {
		this.namedElements = {};
		var child = this.lastElementChild; 
		while (child) 
		{
			this.removeChild(child);
			child = this.lastElementChild;
		}
		if (this._pseudo_stylesheet)
		{
			document.removeChild(this._pseudo_stylesheet);
		}
    }

	ClearText()
	{
		if (this.textContent && this.textContent.length > 0)
		{
			this.textContent = "";
		}
	}

    AddDefinition(definition = {})
    {
		if (definition.extends) {
			this.AddDefinition(definition.extends);
		}
		
		this.AddAttributes(definition.attributes);
		this.AddHoistedAttributes(definition);
		this.AddClasses(definition.classes);
		this.AddAria(definition.aria);
		this.AddChildren(definition.elements);
		this.AddText(definition.text);
		this.AddOptions(definition.options);
		this.AddStyles(definition.styles, this.styles);
    }

	AddHoistedAttributes(definition)
	{
		if (definition.name) this.setAttribute("name", definition.name);
		if (definition.role) this.setAttribute("role", definition.role);
	}

    AddAttributes(attributes = {})
    {
		for (const [key, value] of Object.entries(attributes)) {
			//console.log("updating attribute " + key + " " + value);
			this.setAttribute(key, value);
		};
    }

    AddStyles(styleDefinitions = [], target)
    {
		target = target || this.style;
		if (Array.isArray(styleDefinitions)) {
			styleDefinitions.forEach(styleDefinition => {
				this.AddStyle(styleDefinition, target);
			});
		}
		else
		{
			this.AddStyle(styleDefinitions, target);
		}
    }

    AddStyle(styleDefinition = {}, target)
    {
		target = target || this.style;
    	for (const [key, value] of Object.entries(styleDefinition)) 
	  	{
        	//console.log("updating style " + key + " " + value);
			if (key.startsWith("$"))
			{
				const pseudoStyle = this.AddPseudoStyleRule(key);
				this.AddStyle(value, pseudoStyle.style);
			}
			else if (key === "extends")
			{
				this.AddDefinition(styleDefinition.extends);
			}
        	else if (Array.isArray(value))
        	{
          		this.UpdateStyles(styleDefinition, target);
        	}
        	else if (typeof value === "string")
        	{
				target[key] = this.expandStyleShorthand(value);
        	}
			else if (typeof value === "number")
        	{
				target[key] = value;
        	}
        	else //assume nested style object
        	{
          		this.UpdateStyle(value, target);
        	}
      	};
    }

	expandStyleShorthand(value)
	{
        //expand var shorthand ("--")
		let expandedValue = value.startsWith("--") ? `var(${value})` : value;
		if (value.endsWith("!"))
		{
			//expand important shortand ("!")
			expandedValue = expandedValue.replace("!", " !important");	
		}
		return expandedValue;
	}

	getNewId()
	{
		const newId = "xt" + LAST_ELEMENT_ID.toString(16).padStart(8, "0");
		LAST_ELEMENT_ID++;
		return newId;
	}
	AddPseudoStyleRule(pseudonym)
	{
		this.id = this.id || this.getNewId();
		if (this._pseudo_stylesheet == null)
		{
			this._pseudo_stylesheet = document.createElement("style");
			this.appendChild(this._pseudo_stylesheet);
		}
		const selector = "#" + this.id  + pseudonym.replace("$", ":");
		let css = selector + "{}";  
		const ruleNumber = this._pseudo_stylesheet.sheet.insertRule(css);
		return this._pseudo_stylesheet.sheet.rules[ruleNumber];
	}

    AddChildren(childDefinitions = [])
    {
		const childElements = [];
		childDefinitions.forEach(childDefinition => {
			const childElement = this.AddChild(childDefinition);
			childElements.push(childElement);
		});

		return childElements;
    }

    AddChild(childDefinition = {}, text)
    {
		let tagName = childDefinition.tag || "xt-div";
		let childElement = document.createElement(tagName);
		this.appendChild(childElement);
		childElement.ChangeDefinition(childDefinition);

		const childName = childDefinition.name || "";
		if (childName.length > 0)
		{
			this.namedElements[childName] = childElement;
		}

		return childElement;
    }

    AddClasses(classes = [])
    {
		classes = (typeof classes === "string") ? classes.split(" ") : classes;
		classes.forEach(className =>{
			this.classList.add(className);
		})
    }

	AddText(text)
	{
		if (text)
		{
			this.textContent += text;
		}
	}

	AddAria(aria = {})
	{
		for (const [key, value] of Object.entries(aria)) {
			const name = (key === "role") ? key: "aria-" + key;
			this.setAttribute(name, value);
		};
	}

    ClearOptions() {} //abstract
    AddOptions(options = {}) {} //abstract
};