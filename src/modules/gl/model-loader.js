
import jsYaml from "../utilities/js-yaml.js";
import VerticesAttribute from "./attributes/vertices-attribute.js";
import ColorsAttribute from "./attributes/colors-attribute.js";
import IndicesAttribute from "./attributes/indices-attribute.js";
import NormalsAttribute from "./attributes/normals-attribute.js";
import Texture from "./texture.js";
import STsAttribute from "./attributes/stsAttribute.js";

export default class ModelLoader
{
    constructor(gameCtx)
    {
        this.gameCtx = gameCtx;
        this.gl = this.gameCtx.gl;
    }

    async Load(name)
    {
        const modelFolder = this.gameCtx.dataPath + "/models/" + name;
        const modelData = await jsYaml.fetch(modelFolder + "/geometry.yaml");

        if (modelData.textures && modelData.textures.length > 0 
                && modelData.indices && modelData.indices.length > 0)
        {
            //textures need individual vertices for ST mappings, 
            //so shared (indexed) vertices must be expanded
            this.expandIndices(modelData);
        }
        const model = await this.hydrateModel(modelData, modelFolder);

        return model;
    }

    async hydrateModel(modelData, modelFolder)
    {
        const model = {
            Rotation: 0,
            Dimensions: modelData.dimensions || 3,
            Buffers: {},
            Shader: await this.gameCtx.shaderCache.Get(modelData.shader),
            attributes: [],
            textures: []
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
                    await texture.Load(modelFolder + "/" + textureData.file);
                    model.textures.push(texture);
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
        // console.log("\tst count: ", modelData.textures[0].sts.length);
        
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

        //console.log("verts:", newPositions.join(";"));
        //console.log("norms:", newNormals.join(";"));

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

