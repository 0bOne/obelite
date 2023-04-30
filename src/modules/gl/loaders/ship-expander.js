
import jsYaml from "../../dom/utilities/js-yaml.js";
import VerticesAttribute from "../attributes/vertices-attribute.js";
import ColorsAttribute from "../attributes/colors-attribute.js";
import IndicesAttribute from "../attributes/indices-attribute.js";
import NormalsAttribute from "../attributes/normals-attribute.js";
import Texture from "../texture.js";
import STsAttribute from "../attributes/sts-ttribute.js";
import DomHelper from "../../dom/utilities/dom-helper.js";

const CANVAS_SIZE = 256;
const CANVAS_HALF = CANVAS_SIZE * 0.5;
const PI2 = Math.PI * 2;

export default class ShipExpander
{
    constructor(gameCtx)
    {
        this.gameCtx = gameCtx;
        this.gl = this.gameCtx.gl;
    }

    async Load(name)
    {   
        this.addFaceCanvas();
        const modelData = await this.LoadData(name);
        const model = await this.HydrateModel(modelData);
        return model;
    }

    addFaceCanvas()
    {
        const canvas = DomHelper.AppendElement(document.body, Elements.Canvas);
        canvas.width = CANVAS_SIZE;
        canvas.height = CANVAS_SIZE;
        this.faceCtx = canvas.getContext("2d");
        this.faceCtx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

        const scale = CANVAS_HALF;
        this.faceCtx.translate(CANVAS_HALF, CANVAS_HALF);
        this.faceCtx.scale(scale, scale);

        this.faceCtx.strokeStyle = "white";
        this.faceCtx.lineWidth = 1 / scale;
        this.faceCtx.beginPath();
        this.faceCtx.arc(0, 0, 1.0, 0, 2 * Math.PI);
        this.faceCtx.stroke();
    }

    async LoadData(name)
    {
        const modelFolder = this.gameCtx.dataPath + "/models/" + name;
        const modelData = await jsYaml.fetch(modelFolder + "/model.yaml");
        modelData.name = name;
        modelData.folder = modelFolder;

        return modelData;
    }

    async HydrateModel(modelData)
    {
        const metadata = modelData.metadata || {};
        const model = {
            name: modelData.name,
            description: modelData.description,
            limits: metadata.limits,
            dimensions: modelData.dimensions || 3,
            shader: await this.gameCtx.shaderCache.Get(modelData.shader),
            GL_DRAW_MODE: (modelData.wireframe === true) ? this.gl.LINES : this.gl.triangles,
            attributes: [],
            textures: [],
            uniforms: [],
            hasIndices: false,
            hasSTs: false,
            worldPosition: {x: 0.0, y: 0.0, z: -3.0},
            rotation: 0
        };

        let lastZ = 0;
        for (let s = 0; s < modelData.sections.length; s++)
        {
            lastZ = this.createVertices(modelData, s, lastZ);
        }

        const triangles = [];

        for (let s = 0; s < modelData.sections.length; s++)
        {
            this.createPolygons(modelData, s);
            this.addMaterialsToPolygons(modelData, s);
            this.gatherTriangles(triangles, modelData, s);
        }

        this.hydrateAttributes(model, triangles, modelData.materials);

        return model;
    }

    hydrateAttributes(model, triangles, materials)
    {
        const positions = [];
        const colors = [];
        const normals = [];

        triangles.forEach(triangle => {
            const c = materials[triangle.materialId].color;
            triangle.vertices.forEach(vertex => {
                positions.push(vertex.x, vertex.y, vertex.z);
                colors.push(c[0], c[1], c[2], 1.0);
                normals.push(vertex.nx, vertex.ny, vertex.nz);
            }); 
        });

        const posAttribute = new VerticesAttribute(this.gl, positions, 3)
        model.attributes.push(posAttribute);
        model.vertices = posAttribute.vertices;

        const colAttribute = new ColorsAttribute(this.gl, colors);
        model.attributes.push(colAttribute);
        
        const normAttribute = new NormalsAttribute(this.gl, normals);
        model.attributes.push(normAttribute);
        
    }

    gatherTriangles(triangles, modelData, sectionNumber)
    {
        const section = modelData.sections[sectionNumber];
        section.polygons.forEach(polygon => {
            for (let v = 0; v < polygon.vertices.length; v++)
            {
                const v2 = (v + 1) % polygon.vertices.length;
                const triangle = {
                    vertices: [
                        polygon.origin,
                        polygon.vertices[v],
                        polygon.vertices[v2]
                    ],
                    materialId: polygon.materialId
                };
                triangles.push(triangle);
            }
        });
    }

    createVertices(modelData, sectionNumber, lastZ)
    {
        debugger;
        const section = modelData.sections[sectionNumber];
        const numPoints = section.points || 6;
        const dz = (sectionNumber === 0) ? 0: section.dz || 0.2;
        section.z = lastZ + dz;

        const delta_a = PI2 / numPoints;
        const offset_a = Math.PI; //point zero, if not offset, starts at the top of the circle
        const xyScale = section.scale || [1, 1];
        const angleScale = section.angles || [1];

        section.vertices = [];
        for (let p = 0; p < numPoints; p++)
        {
            const vertex = {}
            const angleScaleIndex = p % angleScale.length;  //repeats the angle scale

            let angle = (delta_a) * p - offset_a;
            angle *= angleScale[angleScaleIndex];
            vertex.a = (angle/PI2) % 1.0; //angle is stored as fractions of the circumference
            const sinAngle = Math.sin(angle);
            const cosAngle = Math.cos(angle);
            vertex.x = sinAngle * xyScale[0];
            vertex.y = cosAngle * xyScale[1];
            vertex.z = section.z;
            vertex.nx = vertex.x;  
            vertex.ny = vertex.y; 
            vertex.nz = 0; //normal z is always zero unless z gets scaled
            vertex.s = sectionNumber;
            section.vertices.push(vertex);
        }

        //sort vertices by angle, so that angles >= 1.0 are in order
        section.vertices.sort((a, b) => {
            return a.a - b.a
        });

        if (section.preview === true)
        {
            this.drawSectionPreview(section.vertices);
        }

        return section.z;
    }

    addMaterialsToPolygons(modelData, sectionNumber)
    {
        const section = modelData.sections[sectionNumber];
        const materialIds = section.materials || ["default"];
        for (let p = 0; p < section.polygons.length; p++)
        {
            const polygon = section.polygons[p];
            const m = p % materialIds.length;  //wrap to get material id index
            polygon.materialId = materialIds[m]; //material id
        }
    }

    createPolygons(modelData, sectionNumber)
    {
        const section = modelData.sections[sectionNumber];
        section.polygons = [];
        if (sectionNumber === 0)
        {
            //first section has a special polygon made from origin and points
            //points' normals are -z only as the polygon is backward-facing
            const polygon = {
                origin: {a: 0, x: 0, y: 0, z: 0, s: 0, nx: 0, ny: 0, nz: -0.1},
                vertices: [...section.vertices]
            };
            polygon.vertices.forEach(vertex =>{
                vertex.nx = 0;
                vertex.ny = 0;
                vertex.nz = -0.1
            });
            section.polygons = [polygon];
        }

        if (sectionNumber < modelData.sections.length - 1)
        {
            //all but last sections have polygons from vertices with the subsequent section
            const nextSection = modelData.sections[sectionNumber + 1]
            const polys = this.createPolygonsFromSections(section, nextSection);
            section.polygons.push(...polys);
        }
        else //last section, needs a closing poly unless only one point
        {
            if (section.points > 1)
            {
                const polygon = {
                    origin: {a: 0, x: 0, y: 0, z: section.z, s: sectionNumber},
                    vertices: [...section.vertices].reverse() //shape needs to be counter clockwise
                }
            }
        }
    }

    createPolygonsFromSections(sectionA, sectionB)
    {
        let polygons = [];
        if (sectionA.edges)
        {
            //allow for custom edges that don't map 1:1
            polygons = this.createPolygonsFromEdges(sectionA, sectionB);
        }
        else if (sectionA.points != sectionB.points)
        {
            //differ, so may be 
            polygons = this.createPolygonByVertexDistance(sectionA, sectionB)
        }
        else 
        {
            //same number of polys - map quad base on vertex indices
            polygons = this.createPolygonBySectionIndex(sectionA.vertices, sectionB.vertices);
        }
        
        return polygons
    }

    createPolygonsFromEdges(sectionA, sectionB)
    {
        //edge definitions exist, 
        //TODO: figure this out
        debugger;
    }

    createPolygonBySectionIndex(verticesA, verticesB)
    {
        //debugger;

        //vertex count between sections matches, so 
        //assume polygons are quads and 
        //they will be matched by index number
        const polygons = [];
        for (let v = 0; v < verticesA.length; v++)
        {
            let v_next = (v + 1) % verticesA.length;
            //get clockwise vertices, no need to store first again because all polygons close out
            const p1 = verticesA[v];
            const p2 = verticesA[v_next];
            const p3 = verticesB[v_next];
            const p4 = verticesB[v];
            const polygon = {
                origin: p1,
                vertices: [p2, p3, p4]
            }
            polygons.push(polygon);
        }
        return polygons;
    }

    createPolygonByVertexDistance(verticesA, verticesB)
    {
        //for each vertex in A, find nearest vertex in B
        //for each pair of vertices in A, nearest pair in B will make up a polygon
        //vertices in B could be a single vertex, or many over a spread: a quad, penta, or higher
        const polygons = [];
        for (let v = 0; v < verticesA.length; v++)
        {
            let v2 = (v + 1) % verticesA.length;
            //get clockwise vertices, no need to store first again because all polygons close out
            const p1 = verticesA[v];
            const p2 = verticesA[v2];

            const v3 = findNearestVertexIndexXY(p2, verticesB);
            const v4 = findNearestVertexIndexXY(p2, verticesB);

            const polygon = {
                origin: p1,
                vertices: [p2]
            };
            if (v4 === v3) 
            {
                //when v4 = v3 its a triangle, just one point
                vertices.push(verticesB[v3]);
            }
            else //all section b vertices between the v3 and v4 take part. they might not be adjacent
            {
                const vHi = Math.max(v3, v4);
                const vLo = Math.min(v3, v4);
                //count backwards because the polygon edge is clockwise and this is the oppose side
                for(let i = vHi; i >= vLo; i--)
                {
                    vertices.push(verticesB[i]);
                }
            }

            polygons.push(polygon);
        }
        return polygons;
    }

    findNearestVertexIndexXY(vertexA, vertices)
    {
        const distances = [];
        for(let v = 0; v < vertices.length; v++)
        {
            const vertex = vertices[v];
            distances.push({
                //hypot's sqrt is expensive, so calculate hypot squared for relative distance
                rSQ: (vertexA.x - vertex.x) * (vertexA.x - vertex.x) 
                    + (vertexA.y - vertex.y) * (vertexA.y - vertex.y),
                index: v
            });
        }


        distances.sort((a, b) =>
        {
            return a.rSQ - b.rSQ;
        });

        const closest = distances[0].index;
        return closest;
    }

    drawSectionPreview(points2d)
    {
        this.faceCtx.strokeStyle = "blue";
        const w = 2 * this.faceCtx.lineWidth;
        const w2 = 2 * w;

        points2d.forEach(p => {
            this.faceCtx.strokeRect(p.x - w, p.y - w, w2, w2);
        });

        this.faceCtx.strokeStyle = "green";
        points2d.forEach(p => {
            this.faceCtx.strokeRect(p.x + p.nx - w, p.y + p.ny - w, w2, w2);
        });

    }
}


const Elements = {
    Canvas: {
        tag: "canvas",
        styles: {
            left: 0,
            top: 0,
            backgroundColor: "darkgrey",
            position: "absolute"
        }
    }
};
