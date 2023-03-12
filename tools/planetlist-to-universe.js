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

let universal;
let interstellar;

const starSystems = [];

//convert to systems 
for (let key in jsonData)
{
    const value = jsonData[key];
    if (key === "universal")
    {
        universal = {
            id: key,
            background: {
                color_1: value.sky_color_1,
                color_2: value.sky_color_2,
                docking_clearance: value.stations_require_docking_clearance
            }
        }
    }
    else if (key === "interstellar space")
    {   
        interstellar = {
            id: key,
            background: {
                color_1: value.sky_color_1,
                color_2: value.sky_color_2,
            },
            nebula: {
                color_1: value.nebula_color_1,
                color_2: value.nebula_color_2,
            },
            counts: {
                stars: value.sky_n_stars,
                blurs: value.sky_n_blurs
            }
        }
    }
    else //star system
    {
        const parts = toNumberArray(key);
        const starSystem = {
            galaxyId: "galaxy" + parts[0],
            systemId: "system" + parts[1],
            position: toNumberArray(value.coordinates), // "2 90";
            space: {
                blurs: value.sky_n_blurs,               // 46
                stars: value.sky_n_stars,               // 5808
                ambient_level: value.ambient_level      // 0.1
            },
            bodies: [{
                type: "planet",
                class: "habitable",
                id: value.name,
                name: value.name,
                seed: value.random_seed,                             // "74 90 72 2 83 183";
                body: {
                    radius: value.radius,
                    rotation_v: value.rotation_speed,                                               //  0.002623
                    terminator_threshold_vector: toNumberArray(value.terminator_threshold_vector)   //"0.105 0.18 0.28"
                },
                orbit: {
                    type: "static",
                    parent: "primary",
                    radius: value.planet_distance                // planet_distance = 507100.000000;
                },
                land: {
                    fraction: value.land_faction,                           // 0.650000;
                    color: toNumberArray(value.land_color),                 // "0.077525 0.0438281 0.66 1";
                    polar_color: toNumberArray(value.polar_land_color)      // "0.727927 0.716006 0.934 1";
                },
                sea: {
                    color: toNumberArray(value.sea_color),                  // "0.547074 0.673828 0.532745 1";
                    polar: toNumberArray(value.polar_sea_color)             // "0.888758 0.932617 0.883801 1";
                },
                atmosphere: {
                    color: toNumberArray(value.air_color),      // "0.735411 0.597965 0.878678 1";
                    color_ratio: value.air_color_mix_ratio,     // 0.5
                    density: value.air_density                  // 0.75
                },
                cloud: {
                    alpha: 1.000000,                                // 1.000000;
                    color: toNumberArray(value.cloud_color),        // "0.638672 0.409149 0.527497 1";
                    fraction: value.cloud_fraction,                  // 0.300000;
                    polar_color: toNumberArray(value.polar_cloud_color)
                },
                demographics: {
                    type: value.population,   //36 TODO: verify what '36' means
                    productivity: value.productivity,                //11520;
                    techLevel: value.techlevel,                      //8
                    economy:  value.economy,                         //2
                    government: value.government ,                   //1
                    description: value.description,                  //  "This planet is most notable for...                                     
                    inhabitants: value.inhabitants,                  // "Human Colonials";
                },
            }, {
                type: "star",
                id: "primary",
                name: "primary",
                color: toNumberArray(value.sun_color),              //"0.781 0.520397 0.402831 1";
                radius: value.sun_radius,                           //150815.429688;
                orbit: {
                    type: "static",
                    parent: null,                                   //null = system barycenter (0, 0, 0)
                    //relative positions are as yet unefined, so I'm taking the diff of the plan/sun distance as the offset from barycenter
                    radius: Math.abs(value.sun_distance - value.planet_distance),   //sun_distance = 783700;
                    vector: toNumberArray(value.sun_vector),                        // "0.484 -0.815 0.319";
                },
                corona: {
                    shimmer: value.corona_shimmer,                 // 0.349376;
                    hues: value.corona_hues,                       // 0.658028   
                    flare: value.corona_flare,                      // 0.009911
                }
            }],
            stations: [{
                type: value.station,                    // "coriolis"
                orbit: {
                    type: "static",
                    parent: value.name,                 // first planet
                    vector: value.vector,               // initial vector
                    radius: value.radius * 2            // planetary radius * 2 TODO: confirm this
                }
            }]
        };
                    
        starSystems.push(starSystem);
    }
} //end for (let key in jsonData)

//save systems:
const galaxies = {};

starSystems.forEach(starSystem => {
    //write the system
    const folderSpec = path.join(target, starSystem.galaxyId);
    ensureFolder(folderSpec);
    const fileSpec = path.join(folderSpec, starSystem.systemId + ".json");
    fs.writeFileSync(fileSpec, JSON.stringify(starSystem, null, "\t"));

    //add to list of galaxies
    if (galaxies[starSystem.galaxyId] === undefined)
    {
        galaxies[starSystem.galaxyId] = {
            id: starSystem.galaxyId,
           systems: []          
        };
    }
    galaxies[starSystem.galaxyId].systems.push(starSystem.systemId);
});

let galaxyIndex = [];
//save galaxies:
for (let galaxyId in galaxies)
{
    let galaxy = galaxies[galaxyId];
    let fileSpec = path.join(target, galaxyId + ".json");
    fs.writeFileSync(fileSpec, JSON.stringify(galaxy, null, "\t"));
    galaxyIndex.push(galaxyId);
}

//save universe:
{
    const universe = {
        universal:  universal,
        interstellar: interstellar,
        galaxies: galaxyIndex
    };
    let fileSpec = path.join(target, "_UNIVERSE.json");
    fs.writeFileSync(fileSpec, JSON.stringify(universe, null, "\t"));
}







//console.log("universal", universal);
//console.log("interstellar", interstellar);

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
