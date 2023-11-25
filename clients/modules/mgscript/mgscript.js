import NanoYaml from "./nano-yaml.js";

export default class MgScript {

    metadata;
    templates;
    materials;
    faces;

    constructor() {
        this.metadata = {};
        this.materials = {};
        this.faces = {};
        this.templates = {};
    }

    async FromUrl(url) {
        let meshData = await NanoYaml.FromUrl(url) || [];
        if (meshData.length > 0) {
            this.toTree(meshData[0]);
        }
    }

    async ComputeTriangles(){
        const triangles = [];
        for (let [name, faceDef] of Object.entries(this.faces)) {
            const faceTriangles = TriangleCreator.Create(name, faceDef, this);
            triangles.push(...faceTriangles);
        }
        return triangles;
    }

    async CollectArrays(triangles, lod = 0) {

        const vertices = [];
        const normals = [];
        const materials = [];
        
        triangles.forEach(triangle => {
            if (triangle.lod <= lod) {
                //TODO: some triangles "disappear" for certain LODs. for example a decal of an engine might become a cutout for an extrusion"
                vertices.push(triangle.A.x, triangle.A.y, triangle.A.z);
                vertices.push(triangle.B.x, triangle.B.y, triangle.B.z);
                vertices.push(triangle.C.x, triangle.C.y, triangle.C.z);
                normals.push(triangle.normal.x, triangle.normal.y, triangle.normal.z);
                materials.push(...triangle.material.color);
            }
        });

        return {
            metadata: this.metadata,
            vertices: new Float32Array(vertices),
            normals: new Float32Array(normals),
            materials: new Uint8Array(materials)
        };
    }

    toTree(meshDefinition) {
        const tree = {};
        for (let [name, block] of Object.entries(meshDefinition)) {
            switch(name) {
                case "metadata":
                    this.metadata = block;
                    break;
                case "mesh":
                    this.setMeshData(block);
                    break;
                case "templates":
                    //TODO: iterate templates as faces
                    break;
                case "materials":
                    this.setMaterials(block);
                    break;
                default:
                    block.name = name;
                    this.faces[name] = new Face(block);
            }
        }
    }

    setMeshData(block) {
        const allowedKeys = ["includes", "transform", "origin", "normals"];
        const allowedNormals = ["clockwise"]; //TODO: anticlockwise, project-from
        for (let [key, value] of Object.entries(block)) {
            if (!allowedKeys.includes(key)) {
                throw `key ${key} not allowed in 'mesh'`;
            }
            switch (key) {
                case "includes":
                    //TODO: include the file (make call chain async/await)
                    break;
                case "origin":
                    this.origin = new Transform(value);
                    break;
                case "transform": 
                    this.transform = new Transform(value);
                    break;
                case "normals":
                    this.normals = value || "clockwise"
                    if (!allowedNormals.includes(this.normals)) {
                        throw `unrecognized value '${value}' in mesh.normals`;
                    }
            }
        }
    }

    setMaterials(block) {
        for (let [key, value] of Object.entries(block)) {
            value.name = key;
            this.materials[key] = new Material(value);
        }
    }
}

const TRANSFORM_OPERATORS = "* + - @ =".split(" ");

class Transform {
    
    source;
    x;
    y;
    z;

    constructor(definition) {

        this.x = [];
        this.y = [];
        this.z = [];

        if (!definition) return;

        const parts = definition.split("/");
        let transformExpression = "";
        if (parts.length === 1) {
            transformExpression = parts[0];
        }

        if (parts.length >= 2) {
            this.source = {
                face: parts[0]
            }
            if (parts[1].indexOf("p") > -1) {
                this.source.points = new PointsSpecifier(parts[1])
            } else {
                transformExpression = parts[1];
            }
        }

        if (parts.length === 3) {
            transformExpression = parts[2];
        }
    
        if (transformExpression?.length > 0) {
            const expanded = transformExpression.replace("**", ",m:*") //multiply(scale) any defined axes
                .replace("++", ",m:+")    //add (translate) any defined axes
                .replace("--", ",m:-")    //subtract (translate) any defined axes
                .replace("@@", ",m:@")    //rotate about origin any defined axes
                .replace("x", ",x:")
                .replace("y", ",y:")
                .replace("z", ",z:")
                .split(" ").join("");

            this.createAxes(expanded);
        }
    }

    createAxes(expression) {
        const parts = expression.split(",");

        let multiAxisOperations;

        parts.forEach(part => {
            const exp = expression;
            const sides = part.split(":");
            const identifier = sides[0];
            const operations = this.createOperations(sides[1]);
            switch (identifier) {
                case "":
                case "~":
                    //ignore
                    break;
                case "x":
                case "y":
                case "z":
                    this[identifier] = this[identifier] || [];
                    this[identifier].push(...operations);
                    break;
                case "m":
                    multiAxisOperations = operations;
                    break;
                default:
                    debugger;
                    throw `unrecognized identifier ${identifier} in transformation`; 
            }
        });

        this.addAxisExtras(this.x, multiAxisOperations);
        this.addAxisExtras(this.y, multiAxisOperations);
        this.addAxisExtras(this.z, multiAxisOperations);
    }

    addAxisExtras(axisOps, multiAxisOperations) {
        if(axisOps.length > 0) {
            //only add IF  multi axis operations exist 
            if (multiAxisOperations) {
                axisOps.push(...multiAxisOperations); 
            }
        }
    }

    createOperations(value = "") {
        let remainder = value;
        let operator;
        let operand;

        const operations = [];

        while (remainder.length > 0) {
            operator = remainder.charAt(0);
            remainder = remainder.substring(1);
            operand = null;
            const numberMatch = remainder.match(/^\-?\d?\.?\d+/);    
            if (numberMatch && numberMatch[0]) {
                remainder = remainder.substring(numberMatch[0].length);
                operand = parseFloat(numberMatch[0]);       
            }
            if (TRANSFORM_OPERATORS.includes(operator) === false) { 
                throw `unrecognized operator '${operator}' in transform at line ${this.currentLine}`;
            } else if (operand === null) {
                throw `unrecognized value '${operand}' in transform at line ${this.currentLine}`;
            } else {
                if (operator === '-') {
                    operator = '+';
                    operand = 0 - operand;
                }
                operations.push({operator: operator, value: operand});
            }
        }
    
        return operations;
    }
}

class Material {

    name;
    color;

    constructor(definition) {

        for (let [name, value] of Object.entries(definition)) {
            switch (name) {
                case "name":
                    this.name = value;
                    break;
                case "color":
                    this.color = new Color(value);
                    break;
                default: 
                    debugger;
                    //TODO: metalness, specularity, roughness, gloss (emissivity?, refractiveIndex?)
            }
        }

        if (!this.color) {
            throw "material must have a color";
        }
    }
}

class Color extends Array {

    constructor(value) {
        super();
        if (value.length !== 6 && value.length !== 8) {
            throw "color expression must be 6 or 8 characters";
        }
        this.addComponent("red", value, 0);
        this.addComponent("green", value, 2);
        this.addComponent("blue", value, 4);
        if (value.length === 8) {
            this.addComponent("alpha", value, 6);
        }
    }

    addComponent(name, expression, position) {
        const value = expression.substring(position, position + 2);
        const result = parseInt(value, 16);
        if (isNaN(result) || result < 0 || result > 255) {
            throw `invalid ${name} color component (${value}) . Must be 00 to FF`;
        }
        this.push(result);
    }
}

class Face {

    name;
    lod;
    material;
    points;
    values;

    constructor (definition) {
        this.points = {};
        this.values = {};
        this.name = definition.name;
        this.material = definition.material || "_";
        this.lod = definition.lod || 0;

        for (let [key, value] of Object.entries(definition)) {
            switch (key) {
                case "name":
                case "lod":
                case "material":
                    //already copied. ignore
                    break;
                default: 
                    if (key.startsWith("p")) {
                        this.setPoints(key, value);
                    } else {
                        debugger; //TODO: kid faces
                    }
            }
        }

        this.lod = this.lod || 0;
        this.material = this.material || "_";
    }

    setPoints(key, value) {
        const pointTargets = new PointsSpecifier(key);
        const transform = new Transform(value);
        for (let i = 0; i < pointTargets.length; i++) {
            const pointKey = pointTargets[i];
            this.points[pointKey] = {};
            this.mergeTransforms(pointKey, "x", transform);
            this.mergeTransforms(pointKey, "y", transform);
            this.mergeTransforms(pointKey, "z", transform);
            this.assignSourcePointId(pointTargets, pointKey, transform);
        }
    }

    assignSourcePointId(pointTargets, pointKey, transform) {
        if (transform.source) {
            const currentPoint = this.points[pointKey];
            const sourcePoints = transform.source.points;
            if (sourcePoints) {
                //round-robin assign source points to target points
                const targetIndex = pointTargets.indexOf(pointKey);
                const sourceIndex = targetIndex % sourcePoints.length;
                currentPoint.copy = {
                    face: transform.source.face,
                    point: sourcePoints[sourceIndex]
                };
            } else {
                currentPoint.copy = {
                    face: transform.source.face,
                    point: pointKey
                };
            }
        }
    }

    mergeTransforms(pointKey, axis, transform) {
        if (transform[axis]) {
            if (this.points[pointKey][axis]) {
                //already exists, so merge the extra transforms
                this.points[pointKey][axis].push(transform[axis]);
            }
            else {
                //does not exist - just assign
                this.points[pointKey][axis] = transform[axis];
            }
        }
    }
}

class PointsSpecifier extends Array{
    constructor(value) {
        super();
        let specifier = value;
        //convert these forms into a point array: p0,  p0-3, p0,1,4
        if (specifier.startsWith("p")) {
            specifier = specifier.substring(1).split(" ").join("");
            const commaParts = specifier.split(",");    
            commaParts.forEach(range => {
                const rangeParts = range.split("-");
                const first = parseInt(rangeParts.shift());
                const last = parseInt(rangeParts.pop() || first);
                if (isNaN(first) || isNaN(last)) {
                    throw "invalid point specifier expression: " + value;
                }

                if (first > last) {
                    for (let i = first; i >= last ; i--) {
                        this.push(i);
                    }
                } else {
                    for (let i = first; i <= last; i++) {
                        this.push(i);
                    }
                }
            });
        }
    }
}


class TriangleCreator {

    static Create(name, faceDef, scriptData) {
        let points = this.createPoints(faceDef, scriptData);
        const triangles = this.createTriangles(points);
        const material = scriptData.materials[faceDef.material];
        const normal = this.computeNormal(triangles, scriptData.normals);

        triangles.forEach(triangle => {
            triangle.face = name;
            triangle.lod = faceDef.lod || 0,
            triangle.normal = normal;
            triangle.material = material;
        });

        return triangles;
    }

    static computeNormal(triangles, normalRule) {
        let normal;
        //debugger;
        if (triangles.length > 0) {
            if ( normalRule === "clockwise" || normalRule === "anticlockwise") {
                const first = triangles[0];
                normal = VectorUtils.calculateNormal(first.A, first.B, first.C);
                if (normalRule === "anticlockwise") {
                    normal = VectorUtils.Negate(this.normal);
                }
            }
            //TODO: if project from origin based, can't do that per triangle, 
            //      has to be per vertex, not per face
        }
        return normal;
    }

    static createTriangles(points) {
        const triangles = [];
        for (let p = 1; p < points.length - 1; p++) {
            const triangle = {
                A: points[0],
                B: points[p],
                C: points[p + 1] || points[1],
            };
            triangles.push(triangle);
        }
        return triangles;
    }

    static createPoints(faceDef, scriptData) {
        let cursor = {x: 0, y: 0, z: 0};
        let origin = {x: 0, y: 0, z: 0};

        let points = [];

        for (let [index, pointOps] of Object.entries(faceDef.points)){
            this.doPointOps("x", origin, cursor, pointOps, scriptData);
            this.doPointOps("y", origin, cursor, pointOps, scriptData);
            this.doPointOps("z", origin, cursor, pointOps, scriptData);
            const cursorCopy = {...cursor};
            faceDef.values[index] = cursorCopy; //facedef needs computed values for other faces to be able to copy
            points.push(cursorCopy);
        }

        return points;
    }

    static doPointOps(axisName, origin, cursor, pointOps, scriptData) {

        if (pointOps.copy) {
            cursor[axisName] = this.findSourcePointValue(pointOps.copy, scriptData, axisName);
        }

        const ops = pointOps[axisName];
        
        for (let i = 0; i < ops.length; i++) {
            const op = ops[i];
            switch(op.operator) {
                case "+":
                    cursor[axisName] += op.value;
                    break;
                case "=":
                    cursor[axisName] = op.value;
                    break;
                case "@":
                    //TODO: rotate around origin (2 axes need to change, so
                    //need to figure out which is the unchanging plane)
                    break;
                case "|":
                    //TODO: reflect across origin in unchanging plane
                    break;
                default:
                    debugger;
                    break;
            }

            if (cursor[axisName] === 2 ) debugger;
        } 
    }

    static findSourcePointValue(sourceCopy, scriptData, axisName) {
        const sourceFace = scriptData.faces[sourceCopy.face] || scriptData.templates[sourceCopy.face];
        if (!sourceFace) {
            throw "source face not found: " + sourceCopy.face;
        }
        if (!sourceFace.values) {
            throw "source face has no computed values " + sourceCopy.face
        }
        const sourceValue = sourceFace.values[sourceCopy.point];
        if (!sourceValue) {
            throw "source value not found " + sourceCopy.face + " p" + sourceCopy.point;
        }
        return sourceValue[axisName];
    }
}

class VectorUtils {

    static subtractVectors(a, b) {
        return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    }
    
    static crossProduct(a, b) {
        return {
            x: a.y * b.z - a.z * b.y,
            y: a.z * b.x - a.x * b.z,
            z: a.x * b.y - a.y * b.x
        };
    }
    
    static normalizeVector(v) {
        const length = Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        return { x: v.x / length, y: v.y / length, z: v.z / length };
    }
    
    static calculateNormal(p1, p2, p3) {
        const vectorA = this.subtractVectors(p2, p1);
        const vectorB = this.subtractVectors(p3, p1);
        const normal = this.crossProduct(vectorA, vectorB);
        return this.normalizeVector(normal);
    }

    static Negate(v) {
        return {
            x: -v.x,
            y: -v.y,
            z: -v.z
        };
    }
    
    
}


