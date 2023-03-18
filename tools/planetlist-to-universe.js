const fs = require("fs");
const { delimiter } = require("path");
const path = require("path");

let source = path.resolve(__dirname, process.argv[2]);
let target = path.resolve(__dirname, "..", "src", "data", "universe");

let fileName = path.basename(source, ".dat") + ".json";

console.log("source", source);
console.log("target", target);

if (fs.existsSync(source) === false)
{
    console.error("source not found. unable to continue");
    process.exit(1);
}

const replacementTokens = [
    "sky_color_1",
    "sky_color_2",
    "nebula_color_1",
    "nebula_color_2",
    "sky_n_stars",
    "sky_n_blurs",
    "stations_require_docking_clearance",
    "air_color",
    "air_color_mix_ratio",
    "air_density",
    "ambient_level",
    "polar_cloud_color",
    "polar_land_color",
    "polar_sea_color",
    "sun_color",
    "sun_distance",
    "sun_radius",
    "sun_vector",
    "cloud_alpha",
    "cloud_color",
    "cloud_fraction",
    "coordinates",
    "corona_flare",
    "corona_hues",
    "corona_shimmer",
    "description",
    "economy",
    "government",
    "inhabitant",
    "inhabitants",
    "land_color",
    "land_fraction",
    "layer",
    "name",
    "planet_distance",
    "population",
    "productivity",
    "radius",
    "random_seed",
    "rotation_speed",
    "sea_color",
    "sky_n_blurs",
    "sky_n_stars",
    "station",
    "station_vector",
    "techlevel",
    "terminator_threshold_vector",
    "percent_cloud"
];


//replacements to make more json-friendly
let rawData = "" + fs.readFileSync(source);
rawData = rawData.replaceAll("\r", "\n")
    .replaceAll("\n\n", "\n")
    .replaceAll(";", ",")
    .replaceAll("=", ":")
    .replaceAll("(", "[")
    .replaceAll(")", "]")
    .replaceAll(",\n\t}", "\n\t}")
    .replaceAll(" no\n", "false")
    .replaceAll(",\n\n}", "\n}");

//add quotes to properties
replacementTokens.forEach(token => {
    rawData = rawData.replaceAll(token + " :", '"' + token + '":');
});

let jsonData = JSON.parse(rawData);
rawData = null;
//console.log(jsonData);

let universeFile = path.join(target, "index.yaml");
fs.writeFileSync(universeFile, "");

let galaxyFolders = [];
let galaxyIds = [];
let systems = [];
for (let g = 0; g < 8; g++)
{
    let galaxyId = "g" + g;
    galaxyIds.push(galaxyId);
    galaxyFolders[galaxyId] = path.join(target, galaxyId);
    ensureFolder(galaxyFolders[galaxyId] );
    let galaxyfile = path.join(galaxyFolders[galaxyId] , "index.yaml");
    systems[galaxyId] = {};
    fs.writeFileSync(galaxyfile, "");
}

//convert to systems 
for (let key in jsonData)
{
    const value = jsonData[key];
    if (key === "universal")
    {
        appendLine(universeFile, "universe:");
        appendLine(universeFile, "  color1: " + arrayToYaml(value.sky_color_1));
        appendLine(universeFile, "  color2: " + arrayToYaml(value.sky_color_1));
    }
    else if (key === "interstellar space")
    {   
        appendLine(universeFile, "interstellar:");
        appendLine(universeFile, "  color1: " + arrayToYaml(value.sky_color_1));
        appendLine(universeFile, "  color2: " + arrayToYaml(value.sky_color_2));
        appendLine(universeFile, "nebula:");
        appendLine(universeFile, "  color1: " + arrayToYaml(value.nebula_color_1));
        appendLine(universeFile, "  color2: " + arrayToYaml(value.nebula_color_2));
        appendLine(universeFile, "limits:");
        appendLine(universeFile, "  stars: " + value.sky_n_stars);
        appendLine(universeFile, "  blurs: " + value.sky_n_blurs);

    }
    else //star system
    {
        const parts = toNumberArray(key);
        const galaxyId = "g" + parts[0];
        const planetName = value.name;
        const systemName = planetName;
        systems[galaxyId] = systems[galaxyId] || {};
        const systemFile = path.join(galaxyFolders[galaxyId], systemName + ".yaml");
        fs.writeFileSync(systemFile, "");

        console.log("processing system " + systemName);

        const position = toNumberArray(value.coordinates);

        appendLine(systemFile, "name: " + systemName);
        appendLine(systemFile, "position: " + arrayToYaml(position));
        appendLine(systemFile, "seed: " + value.random_seed);
        appendLine(systemFile, "limits:");
        appendLine(systemFile, "  blurs: " + value.sky_n_blurs);
        appendLine(systemFile, "  stars: " + value.sky_n_stars);
        appendLine(systemFile, "ambientLightLevel: " + value.ambient_level);
        appendLine(systemFile, "bodies:");
        appendLine(systemFile, "- type: planet");
        appendLine(systemFile, "  class: habitable");
        appendLine(systemFile, "  name: " + planetName);
        appendLine(systemFile, "  radius: " + value.radius);
        appendLine(systemFile, "  rotationSpeed: " + value.rotation_speed);
        appendLine(systemFile, "  terminatorVector: " + arrayToYaml(toNumberArray(value.terminator_threshold_vector)));
        appendLine(systemFile, "  orbit:");
        appendLine(systemFile, "    type: static");
        appendLine(systemFile, "    parent: primary");
        appendLine(systemFile, "    distance: " + value.planet_distance);
        appendLine(systemFile, "  land:");
        appendLine(systemFile, "    ratio: " + value.land_fraction);
        appendLine(systemFile, "    color: " + arrayToYaml(toNumberArray(value.land_color)));
        appendLine(systemFile, "    polarColor: " + arrayToYaml(toNumberArray(value.polar_land_color)));
        appendLine(systemFile, "  sea:");
        appendLine(systemFile, "    color: " + arrayToYaml(toNumberArray(value.sea_color)));
        appendLine(systemFile, "    polarColor: " + arrayToYaml(toNumberArray(value.polar_sea_color)));
        appendLine(systemFile, "  air:");
        appendLine(systemFile, "    color: " + arrayToYaml(toNumberArray(value.air_color)));
        appendLine(systemFile, "    colorRatio: " + value.air_color_mix_ratio);
        appendLine(systemFile, "    density: " + value.air_density);
        appendLine(systemFile, "  cloud:");
        appendLine(systemFile, "    alpha: 1.0");
        appendLine(systemFile, "    color: " + arrayToYaml(toNumberArray(value.cloud_color)));
        appendLine(systemFile, "    ratio: " + value.cloud_fraction);
        appendLine(systemFile, "    polarColor: " + arrayToYaml(toNumberArray(value.polar_cloud_color)));
        appendLine(systemFile, "  demographics:");
        appendLine(systemFile, "    type: " + value.population);
        appendLine(systemFile, "    gdp: " + value.productivity);
        appendLine(systemFile, "    tech: " + value.techlevel);
        appendLine(systemFile, "    economy: " + value.economy);
        appendLine(systemFile, "    government: " + value.government);
        appendLine(systemFile, "    description: " + value.description);
        appendLine(systemFile, "    inhabitants: " + value.inhabitants);

        appendLine(systemFile, "- type: star");
        appendLine(systemFile, "  type: primary");
        const starColor = toNumberArray(value.sun_color);
        appendLine(systemFile, "  color: " + arrayToYaml(starColor));
        appendLine(systemFile, "  radius: " + value.sun_radius);
        appendLine(systemFile, "  orbit:");
        appendLine(systemFile, "    type: static");
        appendLine(systemFile, "    parent: ~");
        appendLine(systemFile, "    radius: " + Math.abs(value.sun_distance - value.planet_distance));
        appendLine(systemFile, "    vector: " + arrayToYaml(toNumberArray(value.sun_vector)));
        appendLine(systemFile, "  corona:");
        appendLine(systemFile, "    shimmer: " + value.corona_shimmer);
        appendLine(systemFile, "    hues: " + value.corona_hues);
        appendLine(systemFile, "    flare: " + value.corona_flare);

        appendLine(systemFile, "stations:");
        appendLine(systemFile, "- type: " + value.station);
        appendLine(systemFile, "  orbit:");
        appendLine(systemFile, "    parent: " + planetName);
        appendLine(systemFile, "    vector: " + value.vector);
        appendLine(systemFile, "    radius: " + value.radius * 2); //// planetary radius * 2 TODO: confirm this
        
        systems[galaxyId][systemName] = {
            location: position,
            color: starColor,
            size: value.sun_radius
        }
    }
} //end for (let key in jsonData)

//write out system indexes for each galaxy:
galaxyIds.forEach(galaxyId => {
    const galaxyIndexFile = path.join(target, galaxyId + ".yaml");
    fs.writeFileSync(galaxyIndexFile, "name: " + galaxyId + "\r\n");
    appendLine(galaxyIndexFile, "systems:");

    Object.keys(systems[galaxyId]).sort().forEach(systemId => {
        //console.log("galaxy", galaxyId, "system", systemId);
        const system = systems[galaxyId][systemId];
        appendLine(galaxyIndexFile, "  " + systemId + ":");
        appendLine(galaxyIndexFile, "    size: " + system.size);
        appendLine(galaxyIndexFile, "    color: " + arrayToYaml(system.color));
        appendLine(galaxyIndexFile, "    location: " + arrayToYaml(system.location));
    });
});

console.log(galaxyIds);
appendLine(universeFile, "galaxies: " + arrayToYaml(galaxyIds));

console.log("completed");

function ensureFolder(folderSpec)
{
    if (fs.existsSync(folderSpec) === false)
    {
        fs.mkdirSync(folderSpec, {recursive: true});
    }
}

function toNumberArray(source, delimiter = " ")
{
    //console.log("source", source);
    const numbers = [];
    const values = source.split(delimiter);
    values.forEach(value  => {
        const numberValue = Number.parseFloat(value);
        if (isNaN(numberValue))
        {
            console.error("array contains non-number: " + source);
            process.exit(1);
        }
        numbers.push(numberValue);
    });

    return numbers;
}

function arrayToYaml(elements = [])
{
    return "[" + elements.join(", ") + "]";
}

function appendLine(file, line)
{
    fs.appendFileSync(file, line + "\r\n");

}