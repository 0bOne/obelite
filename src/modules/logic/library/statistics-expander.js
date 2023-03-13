//Expands limits and other ship statistics into phrases to display in the ship library
export default class StatisticsExpander 
{
    Expand(modelData)
    {
        modelData.library.statistics = modelData.library.statistics || [];
        const overrides = modelData.library.overrides || {};  
        const statistics = modelData.library.statistics;

        let columnNumber = 1;

        //speed
        let speedPhrase =  overrides.speed || this.GetRangePhrase(SPEED_RANGES, modelData.limits.speed);
        this.AddIfPresent(statistics, columnNumber, "Speed", speedPhrase);

        //turn rate
        let turnRate =  (2 * modelData.limits.pitch) + modelData.limits.roll;
        let turnRatePhrase = overrides.turnRate || this.GetRangePhrase(TURN_RATE_RANGES, turnRate);
        this.AddIfPresent(statistics, columnNumber, "Turn Rate", turnRatePhrase);

        //shields
        let shieldPhrase = overrides.shields || this.GetRangePhrase(SHIELD_RANGES, modelData.limits.energy);
        this.AddIfPresent(statistics, columnNumber, "Shields", shieldPhrase);
        
        //generator
        let generatorPhrase = overrides.generator || this.GetRangePhrase(GENERATOR_RANGES, modelData.limits.recharge)
        this.AddIfPresent(statistics, columnNumber, "Generator", generatorPhrase);      

        columnNumber = 2;

        //cargo
        if (Number.isFinite(modelData.limits.cargo))
        {
            let cargoPhrase = (modelData.limits.cargo === 0) ? "None": modelData.limits.cargo + " TC";
            this.AddIfPresent(statistics, columnNumber, "Cargo", cargoPhrase);
        }

        //witch space drive
        if (Number.isFinite(modelData.limits.hyperfuel))
        {
            let witchSpacePhrase = (modelData.limits.hyperfuel === 0) ? "No": "Yes";
            this.AddIfPresent(statistics, columnNumber, "Witchspace", witchSpacePhrase);
        }

        const sizes = modelData.limits.size || [];
        if (sizes.length === 3)
        {
            let sizePhrase = sizes.join("m x ") + " m";
            this.AddIfPresent(statistics, columnNumber, "Size", sizePhrase);
            
        }

        //weapons
        let weaponsPhrase = overrides.weapons || this.GetWeaponsPhrase(modelData.limits);
        this.AddIfPresent(statistics, columnNumber, "Weapons", weaponsPhrase);
    }

    GetWeaponsPhrase(limits)
    {
        const gunMounts = limits.gunMounts || [];
        const pylons = limits.missiles || 0;
        return gunMounts.length + " Fixed, " + pylons + " Pylons";
    }

    GetRangePhrase(ranges, testValue)
    {
        let phrase = "";
        if (Number.isFinite(testValue))
        {
            ranges.forEach(range => {
                let lo = range[0];
                let hi = range[1];
                if (testValue >= lo && testValue <= hi)
                {
                    phrase = range[2];
                    return;
                }
            });
        }
        return phrase;
    }

    AddIfPresent(statistics, columnNumber, label, phrase)
    {
        if (phrase.length > 0)
        {
            statistics.push({
                label: label,
                value: phrase,
                column: columnNumber 
            });
        }
    }

    checkInRange
}

const MAX = Number.MAX_SAFE_INTEGER;

const SPEED_RANGES = [
    [0, 1, "Stationary"],
    [1, 150, "Very Slow"],
    [150, 250, "Slow"],
    [250, 325, "Average"],
    [325, 425, "Fast"],
    [425, MAX, "Very Fast"]
]

const TURN_RATE_RANGES = [
    [0, 2, "Very Slow"],
    [2, 2.75, "Slow"],
    [2.75, 4.5, "Average"],
    [4.5, 6.0, "Fast"],
    [6.0, MAX, "Very Fast"]
]

const SHIELD_RANGES = [
    [0, 128, "Very Weak"],
    [128, 192, "Weak"],
    [192, 256, "Average"],
    [256, 320, "Strong"],
    [320, MAX, "Very Strong"]
]

const GENERATOR_RANGES = [
    [0, 2.5, "Weak"],
    [2.5, 3.75, "Average"],
    [3.75, MAX, "Strong"]
];


