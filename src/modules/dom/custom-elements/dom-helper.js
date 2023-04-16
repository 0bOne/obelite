const heightStyles = ["margin-top","margin-bottom","border-top","border-bottom","padding-top","padding-bottom","height"];	
const widthStyles = ["margin-left","margin-right", "border-left","border-right", "padding-left", "padding-right","width"];

export default class DomHelper 
{

	
	static AppendElement(target, definition, innerText)
	{
		let tagName = definition.tag ?? "div";
		let newElement = document.createElement(tagName);
		
		target.appendChild(newElement);
			
		this.AppendAttributes(newElement, definition);

		if (definition.elements)
		{
			this.AppendElements(newElement, definition.elements);
		}

		if (innerText)
		{
			newElement.innerText = innerText;
		}

		if (innerText === " ")
		{
            newElement.innerHTML = "&nbsp;";
		}
		
		return newElement;
	}
	
	static AppendAttributes(target, definition)
	{
		for (let attrib in definition)
		{
			switch(attrib)
			{
				case "debugger":
					//debugger;
					break;
				case "classes":
					target.setAttribute("class", definition[attrib]);
					break;
				case "styles":
					this.ApplyStyles(target, definition[attrib]);
					break;
				case "text":
					target.innerText = definition.text;
					break;
				case "options":
					this.ExpandOptions(target, definition[attrib]);
					break;
				case "tag":
				case "elements":
					//ignore
					break;
				default:
					target.setAttribute(attrib, definition[attrib]);
					break;
			}
		}	
	}

	static ExpandOptions(target, value)
	{
		const options = [];
		if (Array.isArray(value))
		{
			for (var item of value)
			{
				options.push({tag: "option", value: item, text: item});
			}
		}
		else
		{
			for (var key in value)
			{
				options.push({tag: "option", value: key, text: value[key]});
			}
		}
		this.AppendElements(target, options);
	}

	static SetGridColumnWidths(columnWidthDefinitions)
	{
		let firstSpan = "1 / ";
		while (columnWidthDefinitions.length > 0)
		{
			let target = columnWidthDefinitions.shift();
			let width = columnWidthDefinitions.shift();
			target.style.gridColumn = firstSpan + "span " + width;
			firstSpan = "";
		}
	}

	static ApplyStyles(target, definition)
	{
		if (Array.isArray(definition))
		{
			for (let style of definition)
			{
				this.ApplyStyles(target, style);
			}
		}
		else
		{
			for(let styleName in definition)
			{
				if (styleName === "debugger")
				{
					//debugger;
				}
				let styleValue = "" + definition[styleName];
				if (styleValue.startsWith("--"))
				{
					styleValue = `var(${styleValue})`;
				}
				target.style[styleName] = styleValue;
			}
		}
	}

	static EraseChildren(target)
	{
		var child = target.lastElementChild; 
		while (child) 
		{
			target.removeChild(child);
			child = target.lastElementChild;
		}
	}

	static FullHeight(target)
	{		
		return this.computeFromStyles(target, heightStyles);
	}

	static FullWidth(target)
	{		
		return this.computeFromStyles(target, widthStyles);
	}

	static SetVisible(target, isVisible)
	{
		target.style.visibility = (isVisible) ? "visible": "hidden";
	}

	static computeFromStyles(target, styleList)
	{
		const style = window.getComputedStyle(target);
		let retVal =  styleList.map(k => parseFloat(style.getPropertyValue(k), 10))
			.reduce((prev, cur) => prev + cur);
		
		return Math.ceil(retVal);
	}

	static AddStyleRules(target, definitions)
	{
		if (definitions.length > 0)
		{
			var styleElement = document.createElement("style");
			//although style rules are supposed to go in the document header, 
			//appending them inline means they get deleted whn the view changes, 
			//preventing them from behaving like a memory leak
			target.appendChild(styleElement);

			for (let r = 0; r < definitions.length; r++)
			{
				let definition = definitions[r];
				const styles = [];
				for (let styleName in definition)
				{
					if (styleName === "selector")
					{
						//do nothing
					}
					else if (styleName === "debugger")
					{
						//debugger;
					}
					else
					{
						let styleValue = definition[styleName];
						let importance = "";
						if (styleValue.endsWith && styleValue.endsWith("!"))
						{
							styleValue = styleValue.substr(0, styleValue.length - 1);
							importance = " !important;";
						}
						if (styleValue.startsWith && styleValue.startsWith("--"))
						{
							styleValue = `var(${styleValue})`;
						}

					}
				}

				if (styles.length > 0)
				{
					let css = definition.selector + "\r\n{\r\n\t" + styles.join("\r\n\t") + "\r\n}\r\n";  
					styleElement.sheet.insertRule(css, r);
				}
			}
		}
	}

	static AfterPageRedraw(callback)
	{
		//invokes callback after 2 animation frames, which means browser has re-rendered
		requestAnimationFrame(() => {
			requestAnimationFrame(callback);
		});
	}

}
