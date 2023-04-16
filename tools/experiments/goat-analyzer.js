const path = require("path");
const fs = require("fs");
const yaml = require('js-yaml');

const dataPath = path.join(__dirname, "..", "..", "src", "data", "universe");

const planetInfo = readAllInfo();

planetInfo.forEach(planet =>{
    console.log(planet.name + "\t\t" + planet.description);
});
console.log(planetInfo.length, "planets");

function readAllInfo()
{
    const returnData = [];
    const indexPath = path.join(dataPath, "index.yaml");
    const indexData = loadYaml(indexPath);
    //console.log(indexData); 
    indexData.galaxies.forEach(galaxyName => {
        const galaxyData = loadYaml(path.join(dataPath, galaxyName + ".yaml"));  
        for(let planetName in galaxyData.systems)
        {
            const systemPath = path.join(dataPath, galaxyName, planetName + ".yaml");
            const systemData = loadYaml(systemPath);
            systemData.bodies.forEach(body => {
                if (body.type === "planet" && body.name === planetName)
                {
                    //console.log(body);
                    //console.log(body.name);
                    const planetInfo = {
                        galaxy: galaxyName,
                        name: planetName,
                        description: body.demographics.description
                    };     
                    returnData.push(planetInfo);         
                }
            });
        }  
    }); 

    return returnData;
}


function loadYaml(fileSpec)
{
    const rawYaml = fs.readFileSync(fileSpec);
    const obj = yaml.load(rawYaml);
    return obj;
}