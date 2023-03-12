const fs = require("fs");
const { text } = require("node:stream/consumers");
const path = require("path");

let scaleFactor = 1;

let source = path.resolve(__dirname, process.argv[2]);
let target = path.resolve(__dirname, "..", "src", "data", "models", "ships");
let modelName = path.basename(source, ".dat.txt");
let description = modelName;
if (modelName.startsWith("oolite"))
{
    modelName = modelName.replace("oolite_", "");
    target = path.join(target, "detailed", modelName);
}


else if (modelName.endsWith("redux"))
{
    modelName = modelName.replace("_redux", "");
    target = path.join(target, "redux", modelName);
}

if (fs.existsSync(target) === false)
{
    fs.mkdirSync(target, {recursive: true});
}

target = path.join(target, "geometry.yaml");

console.log("source", source);
console.log("target", target);

//process.exit();

if (fs.existsSync(source) === false)
{
    console.error("source not found. unable to continue");
    process.exit(1);
}

let sourceObject = parseSource(source);
let targetObject = convertToTarget(sourceObject);

normalize(targetObject);
targetYaml = toYaml(targetObject, description);

console.log("saving to " + target);
fs.writeFileSync(target, targetYaml);
let sourceStat = fs.statSync(source);
let targetStat = fs.statSync(target);
console.log("conversion complete");
console.log("source data size: " + sourceStat.size.toLocaleString("en-us") + " bytes") ;
console.log("target yaml size: " + targetStat.size.toLocaleString("en-us") + " bytes") ;


function parseSource(sourcePath)
{
    let lines;
    {
        let sourceText = "" + fs.readFileSync(source);
        lines = sourceText.split("\n");
    }
    //console.log(lines);

    let parsedLines = {
        IGNORED: [],
        VERTEX: [],
        FACES: [],
        TEXTURES: [],
        NAMES: [],
        NORMALS: []
    }

    let currentLines = parsedLines.IGNORED;

    lines.forEach((line) => {
        let cleanLine = line.replace("\r", "").trim();
        //console.log("line:", cleanLine);
        if (cleanLine.startsWith("//") || cleanLine.startsWith("NVERTS") || cleanLine.startsWith("NFACES") || cleanLine === "")
        {
            parsedLines.IGNORED.push(cleanLine);
        }
        else if (cleanLine === "END")
        {
            currentLines = parsedLines.IGNORED;
        }
        else if (cleanLine.startsWith("NAMES "))
        {
            currentLines = parsedLines.NAMES;
        }
        else if (parsedLines[cleanLine])
        {
            currentLines = parsedLines[cleanLine]
        }
        else
        {       
            currentLines.push(cleanLine);
        }
    });
    
    return parsedLines;
}

function convertToTarget(sourceLines)
{
    const targetObject = {
        vertices: [],
        normals: [],
        names: [],
        textures: [],
        faces: [],
    };
    convertVertices(sourceLines, targetObject);
    convertNormals(sourceLines, targetObject);
    convertFaces(sourceLines, targetObject);
    convertNames(sourceLines, targetObject);
    convertTextures(sourceLines, targetObject);

    return targetObject;
}

function convertVertices(sourceLines, targetObject)
{
    ///console.log(sourceLines);

    sourceLines.VERTEX.forEach((line) => {
        //can be comma or space delimited
        let values = lineToArray(line);
        let types = elementTypes(values);
        //console.log("coords", coords);
        if (values.length !== 3)
        {
            console.error("vertex line not in correct format: " + line);
            process.exit(1);
        }
        else if (types !== "number")
        {
            console.error("vertex line should all be number, not " + types + ": " + line);
            process.exit(1);
        }
        else
        {
            targetObject.vertices.push(values);
        }
    });
}

function convertNormals(sourceLines, targetObject)
{
    sourceLines.NORMALS.forEach((line) => {
        let values = lineToArray(line);
        let types = elementTypes(values);

        if (values.length !== 3)
        {
            console.error("normals line not in correct format: " + line);
            process.exit(1);
        }
        else if (types !== "number")
        {
            console.error("normals line should all be number, not " + types + ": " + line);
            process.exit(1);
        }
        else
        {
            targetObject.normals.push(values);
        }
    });
}

function convertFaces(sourceLines, targetObject)
{
// # r g b			#norm x,y,z				#verts  #vert index  
//127,127,127,	0.86847,0.47531,0.14083,	3,	2,1,13

    sourceLines.FACES.forEach((line) => {
        let values = lineToArray(line);
        let types = elementTypes(values);

        if (values.length !== 10)
        {
            console.error("faces line not in correct format: " + line);
            process.exit(1);
        }
        else if (types !== "number")
        {
            console.error("faces line should all be number, not " + types + ": " + line);
            process.exit(1);
        }       
        else
        {
            const face = {
                color: [values[0], values[1], values[2]],
                normal: [values[3], values[4], values[5]],
                vertices: [values[7], values[8], values[9]]
            };
            targetObject.faces.push(face);
        }
    });
}

function convertNames(sourceLines, targetObject)
{
    sourceLines.NAMES.forEach(line =>{
        targetObject.names.push(line.trim());
    });
}

function convertTextures(sourceLines, targetObject)
{
// TEXTURES
//image/name idx  max(x,y) a(s,t)				b(s,t)				c(s,t)
//cobra3_redux.png	1.0 1.0	0.597272 0.403270	0.807101 0.501509	0.989045 0.235094


    sourceLines.TEXTURES.forEach(line =>{
        let values = lineToArray(line);
        if (values.length !== 9)
        {
            console.error("textures line not in correct format: " + line);
            process.exit(1);            
        }
        
        //add the texture to the index
        let textureIndex = values[0];
        let textureIndexType = typeof textureIndex;
        if (typeof textureIndex !== "number")
        {
            textureIndex = targetObject.names.indexOf(values[0]);
            if (textureIndex === -1)
            {
                textureIndex = targetObject.names.length;
                targetObject.names.push(values[0]);
            }
        }
        else
        {
            //else already numeric, so do nothing
            //TODO: verify it is in the names array
            if (targetObject.names[textureIndex] === undefined)
            {
                console.error("could not find texture index " + textureIndex + " in names array");
                console.info("names array", targetObject.names);
                process.exit(1);
            }
        }
        
        const texture = {
            index: textureIndex,
            XYmax: [values[1], values[2]],
            STs: [
                [values[3], values[4]],
                [values[5], values[6]],
                [values[7], values[8]]
            ]
        };
        targetObject.textures.push(texture);
    });
}

function lineToArray(line)
{
    const delimiters = "\t, ".split("");
    const chars = line.split("");
    const values = [];
    let token = "";    
    
    chars.forEach(c => {
        if (delimiters.indexOf(c) === -1)
        {
            //not a celimiter, so append to token
            token += c;
        }
        else if (token.length > 0)
        {
            //is a delimiter, and a token exists, so store it
            values.push(castToken(token));
            token = "";
        }
        //else is a delimiter but no token exists to process
    });

    if (token.length > 0)
    {
        //last token not yet stored, so store it
        values.push(castToken(token));
        token = "";
    }

    return values;
}

function castToken(token)
{
    const tokenNoUnderscores = token.split("_").join("");
    if (isFinite(tokenNoUnderscores))
    {
        token = Number.parseFloat(tokenNoUnderscores);
    }
    return token;
}

function elementTypes(sourceArray)
{
    let lastType;
    const typeMap = {}
    sourceArray.forEach(element =>{
        lastType = typeof element;
        typeMap[lastType] = element;
    });

    if (Object.keys(typeMap).length == 1)
    {
        return lastType;
    }
    else //multiple types
    {
        return "mixed";
    }
}

function normalize(sourceObject)
{
    //console.log(sourceObject);
    sourceObject.vertices = normalizePositions(sourceObject.vertices);

    if (sourceObject.colors)
    {
        sourceObject.colors = normalizeColors(sourceObject.colors);
    }

    if (sourceObject.textures)
    {
        sourceObject.textures = flattenTextures(sourceObject, sourceObject.names);
    }
}

function normalizePositions(positions)
{
    //shrink so it fits in a unit of +-1
    positions = positions.flat();
    let largest = 0;
    positions.forEach(position =>{
        largest = Math.max(largest, Math.abs(position));
    });

    let normalizedPositions = positions;
    if (largest > 1)
    {
        console.log("shrkinking vertex positions by ", largest);
        normalizedPositions = [];
        positions.forEach(position =>{
            normalizedPositions.push(position / largest);
        }); 
    }

    scaleFactor = largest;

    return normalizedPositions;
}

function normalizeColors(colors)
{
    const normalizedColors = [];
    //make them a fraction of 1
    colors.forEach(color =>{
        normalizedColors.push(color / 256);
    }); 

    return normalizedColors;
}

function flattenTextures(sourceObject, names)
{
    const flatTextures = [];

    //need all sts in a single array so the correspond to vertices
    sourceObject.sts = [];

    sourceObject.textures.forEach(texture => {
        //console.log("texture", texture);
        let flatTexture = flatTextures[texture.index];
        if (flatTexture === undefined)
        {
            flatTexture = {
                file: names[texture.index]
                //TODO:insert other texture info here
            };
            flatTextures[texture.index] = flatTexture;
        }
        let xMax = texture.XYmax[0];
        let yMax = texture.XYmax[1];
        
        sourceObject.sts.push(texture.STs[0][0] / xMax, texture.STs[0][1] / yMax);
        sourceObject.sts.push(texture.STs[1][0] / xMax, texture.STs[1][1] / yMax);
        sourceObject.sts.push(texture.STs[2][0] / xMax, texture.STs[2][1] / yMax);
    });

    //console.log("flat textures", flatTextures);

    return flatTextures;
}

function toYaml(sourceObject, description)
{
    console.log(sourceObject.textures);

    let yamlLines = [];
    yamlLines.push(
        "description: " + description,
        "dimensions: 3",
        "shader: game/ship",
        "scaleFactor: " + scaleFactor
    );

    
    addArrayYaml(yamlLines, "positions", sourceObject.vertices, 3);

    const faceColors = [];
    const indices = [];
    const faceNormals = [];

    if (sourceObject.faces)
    {
        sourceObject.faces.forEach((face) => {
            faceColors.push(...face.color);
            indices.push(...face.vertices);
            faceNormals.push(...face.normal);
        });

        addArrayYaml(yamlLines, "indices", indices, 3);
        addArrayYaml(yamlLines, "faceColors", normalizeColors(faceColors));
        addArrayYaml(yamlLines, "faceNormals", faceNormals, 3);

    }

    addArrayYaml(yamlLines, "normals", sourceObject.normals);

    if (sourceObject.textures);
    {
        yamlLines.push("textures:");
        sourceObject.textures = sourceObject.textures.reverse();
        sourceObject.textures.forEach(texture => {
            yamlLines.push("- file: " + texture.file);
        });
        addArrayYaml(yamlLines, "sts", sourceObject.sts, 6);
    }

    yamlLines.push("");
    return yamlLines.join("\r\n");
}


function addArrayYaml(lines, name, elements, numComponents)
{
    const space4 = "    ";
    const space8 = space4 + space4;

    if (elements.length > 0)
    {
        elements = elements.flat();
        lines.push(name + ":");
        lines.push(space4 + "[");

        let linesToAdd = [];
        let maxCharacters = 0;
        let elementGroup = [];
        let groupNumber = 0;
        for (let i = 0; i < elements.length; i++)
        {
            elementGroup.push(elements[i]);
            if (elementGroup.length === numComponents)
            {
                let line = space8 + elementGroup.join(", ");
                if (i < elements.length - 1)
                {
                    line += ",";
                }
                maxCharacters = Math.max(maxCharacters, line.length);
                linesToAdd.push(line);
                elementGroup = [];
                groupNumber++;
            }
        }

        maxCharacters += 4; //extra spaces

        //add comments after the max width
        for (let i = 0; i < linesToAdd.length; i++)
        {
            const spacesToadd = maxCharacters - linesToAdd[i].length;
            linesToAdd[i] = linesToAdd[i] + " ".repeat(spacesToadd) + "# #" + i;
        }

        lines.push(...linesToAdd);
        lines.push(space4 + "]");
    }
}

