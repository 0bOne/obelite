import GameOptions from "./game-options.js";
import LoadCommander from "./load-commander.js";
import NewCommander from "./new-commander.js";
import ShipLibrary from "./ship-library.js";
import Welcome from "./welcome.js";
import GalacticChart from "./galactic-chart.js";
import System from "./system-summary.js";

const VIEW_CLASS_MAP = {
	Welcome: Welcome,
	NewCommander: NewCommander,
	LoadCommander: LoadCommander,
	ShipLibrary: ShipLibrary,
	GameOptions: GameOptions,
	GalacticChart: GalacticChart,
	System: System
};

export default VIEW_CLASS_MAP;