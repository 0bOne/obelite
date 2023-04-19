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
		const columns = [];
		columnDefinitions.forEach(columnDefinition => {
			const column = this.AddColumn(columnDefinition);
			columns.push(column);
		});
		return columns;
	}

	AddColumn(columnDefinition = {})
	{
		columnDefinition.styles = columnDefinition.styles || {};

		const width = columnDefinition.width || "auto";
		this.style.gridTemplateColumns += " " + width;

		const element = this.AddChild({});


		element.AddStyles([this.options.styles.header, columnDefinition.styles.header]);
		element.textContent = columnDefinition.text;
		this.columnDefinitions.push(columnDefinition);
		this.headerCells.push(element);
		return element;
	}

	AddBodyCell(columnDefinition)
	{
		const element = this.AddChild({});
		element.AddStyles([this.options.styles.body, columnDefinition.styles.body]);
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
}

const Styles = {
	Grid: {
        display: "grid",
        minWidth: "100%",
        justifyItems: "start"
	}
};