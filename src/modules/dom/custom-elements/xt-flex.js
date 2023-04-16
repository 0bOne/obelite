import ExtensibleElement from "./xt-element.js";

const OBSERVED_ATTRIBUTES = ["name"];

export default class ExtensibleFlexElement extends ExtensibleElement 
{
	constructor()
  	{
    	super();
  	}

	AddOptions(options = {})
	{
		super.AddOptions(options);
		options = Object.assign(DefaultOptions, options);
		const styleDefinitions = [
			Styles.Default,
			(options.across === true) ? Styles.Across : Styles.Down
		];
		this.AddStyles(styleDefinitions);
	}
}

const DefaultOptions = {
  across: true
};

const Styles = {
  Default: {
    display: "flex",
    flexWrap: "nowrap"
  },
  Across: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "stretch"
  },
  Down: {
    flexDirection: "column",
    justifyContent: "flex-start",
    alignItems: "center"
  }
};
