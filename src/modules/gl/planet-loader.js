import jsYaml from "../dom/utilities/js-yaml.js";
import Vector from "../math/vector.js";
import VerticesAttribute from "./attributes/vertices-attribute.js";
import ColorsAttribute from "./attributes/colors-attribute.js";
import IndicesAttribute from "./attributes/indices-attribute.js";
import NormalsAttribute from "./attributes/normals-attribute.js";
import Texture from "./texture.js";
import STsAttribute from "./attributes/sts-ttribute.js";
import PlanetTextureGenerator from "./generators/planet-texture.js";
import SphereMeshGenerator from "./generators/sphere-mesh.js";

export default class PlanetLoader
{
    constructor(gameCtx)
    {
        this.gameCtx = gameCtx;
        this.gl = this.gameCtx.gl;
    }

    async Load(galaxy, planetName)
    {   
        const galaxyFolder = this.gameCtx.dataPath + "/universe/g" + this.gameCtx.playerCtx.galaxy;
        const systemFile = galaxyFolder + "/" + this.gameCtx.playerCtx.selected + ".yaml";
        const systemData = await jsYaml.fetch(systemFile);

        const planetInfo = this.findBody(systemData.bodies, "planet", this.gameCtx.playerCtx.selected);
        planetInfo.seed = systemData.seed;
        
        const mesh = new SphereMeshGenerator(1.0, 36 * 2, 18 * 2, true);
        console.log("Triangle Count", mesh.getTriangleCount());
        console.log("Index Count", mesh.getIndexCount());
        console.log("Vertex Count", mesh.getVertexCount());
        console.log("Normals Count", mesh.getNormalCount());
        console.log("TexCoord Count", mesh.getTexCoordCount());

        const modelData = {
            indices: mesh.indices,
            positions: mesh.vertices,
            normals: mesh.normals,
            sts: mesh.texCoords
        };

        planetInfo.gameCtx = this.gameCtx;

        const model = await this.hydrateModel(modelData, planetInfo);
        return model;
    }

    findBody(bodies, type, name)
    {
        let found; 
        
        bodies.forEach(body => {
            if (body.type === type && (name === "" || body.name === name))
            {
                found = body;
                return;
            }
        });
        return found;
    }

    async hydrateModel(modelData, planetInfo)
    {
        const model = {
            name: planetInfo.name,
            info: planetInfo,
            limits: [],
            dimensions: 3,
            shader: await this.gameCtx.shaderCache.Get("game/planetmesh"),
            attributes: [],
            textures: [],
            uniforms: [],
            rotationRatio: {x: 0.2, y: 0.2, z: 0.2},
            hasIndices: false,
            hasSTs: false,
            worldPosition: {x: 0.0, y: 0.0, z: -3.5},
            rotation: 0
        };
        
        if (modelData.positions)
        {
            const attribute = new VerticesAttribute(this.gl, modelData.positions, modelData.dimensions)
            model.attributes.push(attribute);
            model.vertices = attribute.vertices;
        }

        if (modelData.indices)
        {
            const attribute = new IndicesAttribute(this.gl, modelData.indices);
            model.attributes.push(attribute);
            model.vertices = modelData.indices.length;
            model.hasIndices = true;
        }

        if (modelData.normals)
        {
            const attribute = new NormalsAttribute(this.gl, modelData.normals);
            model.attributes.push(attribute);
        }

        if (modelData.sts.length > 0)
        {
            const attribute = new STsAttribute(this.gl, modelData.sts);
            model.attributes.push(attribute);
            model.hasSTs = true;
        }

        planetInfo.width = 512;
        const ptg = new PlanetTextureGenerator(this.gameCtx, planetInfo);
        const textureA = await ptg.Create(planetInfo);

        const textureB = new Texture(this.gl);
        await textureB.Load(this.gameCtx.dataPath + "/grid512.png");
        
        model.textures.push(textureA);
        model.hasTextures = true;
        
        return model;
    }

}