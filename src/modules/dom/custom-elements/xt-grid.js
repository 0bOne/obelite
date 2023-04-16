import ExtensibleElement from "./xt-element.js";

const OBSERVED_ATTRIBUTES = ["name"];

export default class ExtensibleGridElement extends ExtensibleElement 
{

	options;

	constructor()
  	{
    	super();
  	}

	ClearDefinition()
	{
		super.ClearDefinition();
		this.options = {};
		this.headerCells = [];
		this.columnDefinitions = [];
		this.style.gridTemplateColumns = "";
	}

	AddStyles(styles = [])
	{
		this.AddStyle(Styles.Grid);
		super.AddStyles(styles);
	}

	AddOptions(options = {})
	{
		this.options = Object.assign(this.options, options);
		this.AddColumns(this.options.columns);
	}

	AddColumns(columnDefinitions = [])
	{
		columnDefinitions.forEach(columnDefinition => {
			this.AddColumn(columnDefinition);
		});
	}

	AddColumn(columnDefinition = {})
	{
		const width = columnDefinition.width || "auto";
		this.style.gridTemplateColumns += " " + width;

		const element = this.AddChild(Elements.HeaderCell);
		element.AddStyles([AlignmentStyles[columnDefinition.align], 
							this.options.headerStyles, 
							columnDefinition.styles]);

		element.textContent = columnDefinition.text;
		this.columnDefinitions.push(columnDefinition);
		this.headerCells.push(element);
	}

	AddBodyCell(columnDefinition)
	{
		const element = this.AddChild(Composites.BodyCellWithUnits);
		element.AddStyles([AlignmentStyles[columnDefinition.align], 
			this.options.bodyStyles, 
			columnDefinition.bodyStyles]); //bodyStyles can exist on the options or on the column def
		return element;
	}

	NewRow()
	{
		const namedElements = {};

		this.columnDefinitions.forEach(columnDefinition => {
			const cellElement = this.AddBodyCell(columnDefinition);
			if (columnDefinition.name)
			{
				namedElements[columnDefinition.name] = cellElement;
			}
		});

		return namedElements;
	}

	SetCell(cell, text, units)
	{
		if (cell.namedElements.value)
		{
			cell.namedElements.value.textContent = text;
		}
		else
		{
			cell.textContent = text;
		}

		if (cell.namedElements.units)
		{
			cell.namedElements.units.textContent = units;
		}
	}
}

const Styles = {
	Grid: {
        display: "grid",
        minWidth: "100%",
        justifyItems: "start"
	},
	AlignLeft: {
		justifySelf: "start"
	},
	AlignRight: {
		justifySelf: "end"
	},
	Spacer: {
		visiblity: "hidden"
	}
}

const AlignmentStyles = {
	left: Styles.AlignLeft,
	right: Styles.AlignLeft,
	spacer: Styles.spacer
};

const Elements = {
	HeaderCell: {},
	BodyCell: {
		 name: "value",
	},
	Units: {
		name: "units",
		styles: {
			marginLeft: "1em"
		}
	}
};

const Composites = {
	BodyCellWithUnits: {
		elements: [
			Elements.BodyCell,
			Elements.Units
		]
	}
}



