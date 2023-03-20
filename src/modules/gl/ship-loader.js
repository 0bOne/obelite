
import jsYaml from "../dom/utilities/js-yaml.js";
import VerticesAttribute from "./attributes/vertices-attribute.js";
import ColorsAttribute from "./attributes/colors-attribute.js";
import IndicesAttribute from "./attributes/indices-attribute.js";
import NormalsAttribute from "./attributes/normals-attribute.js";
import Texture from "./texture.js";
import STsAttribute from "./attributes/sts-ttribute.js";

export default class ShipLoader
{
    constructor(gameCtx)
    {
        this.gameCtx = gameCtx;
        this.gl = this.gameCtx.gl;
    }

    async Load(name)
    {   
        const modelData = await this.LoadData(name);
        const model = await this.HydrateModel(modelData);
        return model;
    }

    async LoadData(name)
    {
        const modelFolder = this.gameCtx.dataPath + "/models/" + name;
        const modelData = await jsYaml.fetch(modelFolder + "/model.yaml");
        modelData.name = name;
        modelData.folder = modelFolder;

        if (modelData.textures && modelData.textures.length > 0 
                && modelData.indices && modelData.indices.length > 0)
        {
            //textures need individual vertices for ST mappings, 
            //so shared (indexed) vertices must be expanded
            this.expandIndices(modelData);
        }
        return modelData;
    }

    async HydrateModel(modelData)
    {
        const model = {
            name: modelData.name,
            limits: modelData.limits,
            dimensions: modelData.dimensions || 3,
            shader: await this.gameCtx.shaderCache.Get(modelData.shader),
            attributes: [],
            textures: [],
            uniforms: [],
            hasIndices: false,
            hasSTs: false,
            worldPosition: {x: 0.0, y: 0.0, z: -3.0},
            rotation: 0
        };

        if (modelData.positions)
        {
            const attribute = new VerticesAttribute(this.gl, modelData.positions, modelData.dimensions)
            model.attributes.push(attribute);
            model.vertices = attribute.vertices;
        }

        if (modelData.colors)
        {
            const attribute = new ColorsAttribute(this.gl, modelData.colors);
            model.attributes.push(attribute);
        }
        else if (modelData.faceColors)
        {
            const attribute = ColorsAttribute.FromFaceColors(this.gl, modelData.faceColors);
            model.attributes.push(attribute);
        }

        if (modelData.indices)
        {
            const attribute = new IndicesAttribute(this.gl, modelData.indices);
            model.attributes.push(attribute);
            model.vertices = modelData.indices.length;
            model.hasIndices = true;
        }

        if (modelData.textures)
        {
            for (const t in modelData.textures)
            {
                const textureData = modelData.textures[t];
                if (textureData.file.endsWith(".png"))
                {
                    const texture = new Texture(this.gl, textureData);
                    await texture.Load(modelData.folder + "/" + textureData.file);
                    model.textures.push(texture);
                    model.hasTextures = true;
                }
                else
                {
                    console.warn("texture is not an image: " + textureData.file)
                }
            }

            if (modelData.textures.length > 0)
            {
                const attribute = new STsAttribute(this.gl, modelData.sts);
                model.attributes.push(attribute);
                model.hasSTs = true;
            }
            else
            {
                //no textures, so add a default specular color uniform
                // debugger;
                // const uniform = new SpecularColor(this.gl, model);
                // model.uniforms.push(uniform);
            }
        }

        if (modelData.faceNormals)
        {
            const attribute = NormalsAttribute.FromFaceNormals(this.gl, modelData.faceNormals);
            model.attributes.push(attribute);            
        }

        if (modelData.normals)
        {
            const attribute = new NormalsAttribute(this.gl, modelData.normals);
            model.attributes.push(attribute);
        }

        return model;
    }

    expandIndices(modelData)
    {
        //expand positions
        // console.log("before expansion: ");
        // console.log("\tindex  count: ", modelData.indices.length);
        // console.log("\tvertex count: ", modelData.positions.length);
        // console.log("\tst count: ", modelData.sts.length);
        
        const newPositions = [];
        const newNormals = [];
        
        const faceCount = modelData.indices.length /3;
        for (let faceNum = 0; faceNum < faceCount; faceNum++)
        {
            for (let vertNum = 0; vertNum < 3; vertNum++)
            {
                const oldPosIndex = modelData.indices[faceNum * 3 + vertNum];
                const newPosIndex = faceNum * 3 + vertNum;
                newPositions.push(modelData.positions[oldPosIndex * 3]);
                newPositions.push(modelData.positions[oldPosIndex * 3+ 1]);
                newPositions.push(modelData.positions[oldPosIndex * 3+ 2]);
                
                if (modelData.faceNormals && modelData.faceNormals.length > 0)
                {
                    newNormals.push(modelData.faceNormals[oldPosIndex * 3]);
                    newNormals.push(modelData.faceNormals[oldPosIndex * 3 + 1]);
                    newNormals.push(modelData.faceNormals[oldPosIndex * 3 + 2]);
                }
            }
        }

        if (newNormals.length > 0)
        {
            modelData.normals = newNormals;
        }
        modelData.positions = newPositions;

        //TODO: expand colors

        //delete indices
        delete modelData.indices;
        delete modelData.colors;
        delete modelData.faceNormals;
        delete modelData.faceColors;
    
        //console.log("after expansion: ");
        //console.log("\tvertex count: ", modelData.positions.length);
        //console.log("\tst count: ", modelData.textures[0].sts.length);
    }

}

