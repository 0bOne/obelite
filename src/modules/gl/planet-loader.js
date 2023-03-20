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

const DEFAULT_SPHERE = {
    radius: 1, 
    widthSegments: 32, 
    heightSegments: 16, 
    phiStart: 0, 
    phiLength: Math.PI * 2, 
    thetaStart: 0, 
    thetaLength: Math.PI,
    fatness: 1.0 
};

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

        const planetData = this.findBody(systemData.bodies, "planet", this.gameCtx.playerCtx.selected);

        
        //const mesh = new SphereMeshGenerator(1.0);
        const mesh = new SphereMeshGenerator(1.0, 36, 18, false);
        console.log("Triangle Count", mesh.getTriangleCount());
        console.log("Index Count", mesh.getIndexCount());
        console.log("Vertex Count", mesh.getVertexCount());
        console.log("Normals Count", mesh.getNormalCount());
        console.log("TexCoord Count", mesh.getTexCoordCount());

        const modelData = {
            stride: mesh.stride,
            indices: mesh.indices,
            positions: mesh.vertices,
            normals: mesh.normals,
            sts: mesh.texCoords
        };

        const model = await this.hydrateModel(modelData, planetData);
        return model;
    }

    findBody(bodies, type, name)
    {
        let found; 
        +
        bodies.forEach(body => {
            if (body.type === type && (name === "" || body.name === name))
            {
                found = body;
                return;
            }
        });
        return found;
    }

    createSphereModelData(planetData)
    {
       const thetaStart = DEFAULT_SPHERE.thetaStart;
		const thetaLength = Math.min( DEFAULT_SPHERE.thetaStart + DEFAULT_SPHERE.thetaLength, Math.PI );
        const phiStart = DEFAULT_SPHERE.phiStart;
        const phiLength = DEFAULT_SPHERE.phiLength;
        const radius = DEFAULT_SPHERE.radius;

		const widthSegments = Math.max( 3, Math.floor( DEFAULT_SPHERE.widthSegments ) );
		const heightSegments = Math.max( 2, Math.floor( DEFAULT_SPHERE.heightSegments ) );
        const thetaEnd = Math.min( thetaStart + thetaLength, Math.PI );

		let index = 0;
		const grid = [];

		const vertex = new Vector([1, 1, 1]);
		const normal = new Vector([1, 1, 1]);

		// buffers
		const indices = [];
		const vertices = [];
		const normals = [];
		const uvs = [];

		// generate vertices, normals and uvs
		for ( let iy = 0; iy <= heightSegments; iy ++ ) {

			const verticesRow = [];
			const v = iy / heightSegments;

			// special case for the poles
			let uOffset = 0;
			if ( iy == 0 && thetaStart == 0 ) 
            {
				uOffset = 0.5 / widthSegments;
			} 
            else if ( iy == heightSegments && thetaEnd == Math.PI ) 
            {
				uOffset = - 0.5 / widthSegments;
			}

			for ( let ix = 0; ix <= widthSegments; ix ++ ) 
            {
				const u = ix / widthSegments;
				vertex[0] = - radius * Math.cos( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );
				vertex[1] = radius * Math.cos( thetaStart + v * thetaLength );
				vertex[2] = radius * Math.sin( phiStart + u * phiLength ) * Math.sin( thetaStart + v * thetaLength );

				vertices.push( vertex[0], vertex[1], vertex[2]);
				// normal
				normal.setFrom(vertex).normalize();
				normals.push( normal.x, normal.y, normal.z );

				// uv
				uvs.push( u + uOffset, 1 - v );
				verticesRow.push( index ++ );
			}
			grid.push( verticesRow );
		}

		// indices
		for ( let iy = 0; iy < heightSegments; iy ++ ) 
        {
			for ( let ix = 0; ix < widthSegments; ix ++ ) 
            {
				const a = grid[ iy ][ ix + 1 ];
				const b = grid[ iy ][ ix ];
				const c = grid[ iy + 1 ][ ix ];
				const d = grid[ iy + 1 ][ ix + 1 ];

				if ( iy !== 0 || thetaStart > 0 ) indices.push( a, b, d );
				if ( iy !== heightSegments - 1 || thetaEnd < Math.PI ) indices.push( b, c, d );
			}
		}

		const modelData = {
            indices: indices,
            positions: vertices,
            faceNormals: normals,
            sts: uvs
        }
        return modelData;
    }

    //TODO: shoudl not be necessary to generate face indices then expand them. do it all in one go.
    expandIndices(modelData)
    {
        //TODO: this is repeated between planet and ship loader. if it can't be made redundant here, move to shared class
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

        delete modelData.indices;
        delete modelData.colors;
        delete modelData.faceNormals;
        delete modelData.faceColors;
    }

    async hydrateModel(modelData, planetInfo)
    {
        const model = {
            name: planetInfo.name,
            limits: [],
            dimensions: 3,
            shader: await this.gameCtx.shaderCache.Get("game/planetmesh"),
            attributes: [],
            textures: [],
            uniforms: [],
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

        // const ptg = new PlanetTextureGenerator(this.gl, 512);
        // const texture = ptg.Create(planetInfo);
        // model.textures.push(texture);

        const texture = new Texture(this.gl);
        await texture.Load(this.gameCtx.dataPath + "/grid512.png");
        model.textures.push(texture);
        model.hasTextures = true;
        
        return model;
    }


}