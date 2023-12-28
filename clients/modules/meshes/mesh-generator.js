export class Surface {

    parentEdge;

    lod;
    lodExclusive;
    name;
    edges;
    cursor;
    material;
    fold;     //if set must fold to this angle when buttoning up
    closed;

    constructor(parentEdge, name) { 
        this.closed = false;
        this.name = name;
        this.edges = [];
        this.parentEdge = parentEdge;
    }

    guardAgainstClosed(){
        if (this.closed === true) {
            debugger;
            throw "cannot modify closed path";
        }
    }

    guardAgainstNotClosed() {
        if (this.closed === false) {
            debugger;
            throw "path is not closed";
        }
    }

    guardAgainstNoEdges() {
        if (this.edges.length === 0) {
            debugger;
            throw "no edges defined";
        }
    }

    setCursor(x, y) {
        this.guardAgainstClosed();
        this.cursor = {x: x, y: y};
        return this;
    }

    setLod(lod, exclusive = false) { 
        //set level of detail at which this surface gets displayed
        //lod. level of detail value.  higher is more detailed. recommend no more than 3-6 LODs
        //exclusive = false. surface will be displayed at a specifed LOD or higher
        //exclusive = true. surface will ONLY be displayed at a specific LOD (will be replaced by something else at a higher LOD)
        this.lod = lod;
        this.lodExclusive = exclusive;
        return this;
    }

    setMaterials(material, lodMaterial) { 
        //set the materials
        //material: rqeuired. the default material used
        //lodMaterial: optional. if set, will be used when the LOD matches. 
        //      this allow for different coloring at lower LODs, where higher LODs have dominant color 
        this.material = material;
        this.lodMaterial = lodMaterial;

        return this;
    }

    edgeAbs(x, y) {   //create an edge between cursor and absolute position
        this.guardAgainstClosed();
        const pFrom = this.cursor;
        this.cursor = {x: x, y: y};
        const edge = new Edge(this, pFrom, this.cursor);
        
        this.edges.push(edge);
        return this;
    }

    edgePolar(r, deg) {
        //create an edge from current position to polar coordinate
        //r = radius
        //deg = degrees clockwise, starting at 12 o-clock;
        const rads = (deg - 90) * Math.PI/180;
        const y = r * -Math.sin(rads);
        const x = r * Math.cos(rads);   
        return this.edgeRel(x, y);
    }

    adjoinFace(edgeIndex, surfaceName, reverseDirection = true) {
        //creat a surface on a shared edge (aka "hinge")
        this.guardAgainstNotClosed();
        const newParentEdge = this.edges[edgeIndex];
        const newSurface = new Surface(newParentEdge, surfaceName);
        newParentEdge.adjoined = newSurface;
        if (reverseDirection === true) {
            newSurface.setCursor(newParentEdge.pTo.x,  newParentEdge.pTo.y);
            newSurface.edgeAbs(newParentEdge.pFrom.x, newParentEdge.pFrom.y);
        } else {
            newSurface.setCursor(newParentEdge.pFrom.x,  newParentEdge.pFrom.y);
            newSurface.edgeAbs(newParentEdge.pTo.x, newParentEdge.pTo.y);
        }
        return newSurface;
    }

    setFold(degrees) {
        this.fold = degrees;
        return this;
    }

    getRootFace() {
        //recurse until surface with no parent found
        if (this.parentEdge) {
            return this.parentEdge.surface.getRootFace();

        } else {
            return this;
        }
    }

    findFace(faceName) {
        let foundFace;
        if (this.name == faceName) {
            return this;
        } else {
            for (let i = 0; i < this.edges.length; i++) {
                const edge = this.edges[i];
                const adjoined = edge.adjoined;
                if (adjoined) {
                    foundFace = adjoined.findFace(faceName);
                }
                if (foundFace) break;
            }
        }
        return foundFace;
    }

    edgeRel(x, y) {  //create an edge between cursor and relative position
        this.guardAgainstClosed();
        const pFrom = this.cursor;
        this.cursor = {x: pFrom.x + x, y: pFrom.y + y};
        const edge = new Edge(this, pFrom, this.cursor);
        this.edges.push(edge);
        return this;
    }

    getEdge(i) {   //begin working on an edge
        return this.edges[i];
    }

    closePath(mirrorX, mirrorY) {   //close the path. If mirroring, close with the same number of points, mirred on specified axis
        this.guardAgainstClosed();
        this.guardAgainstNoEdges();

        if (mirrorX !== true && mirrorY !== true) {
            //no mirroring, close cursor to first edge only
            const eStart = this.edges[0].pFrom;
            this.edgeAbs(eStart.x, eStart.y);
            this.closed = true;
            return this;
        }

        //mirror existing edges until closed...

        let backIndex = this.edges.length - 1;
        if (mirrorY && this.cursor.y === 0 || mirrorX && this.cursor.x === 0) {
            //last point ended ON y axis, so skip
            backIndex--;
        }

        const xSign = (mirrorX) ? -1: 1;
        const ySign = (mirrorY) ? -1: 1;
        while (backIndex >= 0) {
            const sourceEdge = this.edges[backIndex];
             //the reflected edge's 'to' point becomes the reflection edge's "to" point
             const newX = sourceEdge.pTo.x * xSign;
             const newY = sourceEdge.pTo.y * ySign;
            this.edgeAbs(newX, newY);
            console.log(this.name, "closing edge count", this.edges.length, backIndex);
            backIndex --;
        }

        this.closed = true;
        return this;
    }

    mirrorClone(sourceNames, targetNames, targetEdgeIndex) {
        //cause the specified face to "mirror" (clone + flip) items on its edge to another edge
        //recursively including its attached faces and features
        //sourceNames: parent/child. sources
        //targetNames: parent/child. targets. child will be the new face created on parent
        //targetEdgeIndex: the index of the edge where the new child face will be created. must not already have one

        this.guardAgainstNotClosed();
        const sources = sourceNames.split("/");
        const sourceParentName = sources[0];
        const sourceChildName = sources[1];
        const targets = targetNames.split("/");
        const targetParentName = targets[0];
        const targetChildName = targets[1];

        const rootFace = this.getRootFace();
        const targetParent = rootFace.findFace(targetParentName);
        const sourceParent = rootFace.findFace(sourceParentName);
        
        if (!targetParent) throw `target parent ${targetParentName} could not be found`;
        if (!sourceParent) throw `source parent ${sourceParentName} could not be found`;

        const sourceChild = sourceParent.findFace(sourceChildName);
        let targetChild = targetParent.findFace(targetChildName);

        if (!sourceChild) throw `source child ${sourceChildName} could not be found`;
        if (targetChild) throw  `new child ${targetChildName} is already present on parent`;

        let sourceEdgeIndex = sourceChild.parentEdge.edgeIndex;
        //find source edge index
        const fromEdge = sourceParent.edges[sourceEdgeIndex];
        const toEdge = targetParent.edges[targetEdgeIndex];

        if (!fromEdge) {
            throw `on source face '${targetFaceName}', edge ${sourceEdgeIndex} could not be found`;
        }
        if (toEdge.adjoined) {
            throw `on target face '${targetFaceName}', edge ${targetEdgeIndex}, adjoined surface already exists`;
        }

        const newFace = new Surface(toEdge, targetChildName);
        newFace.setLod(sourceChild.lod);
        newFace.material = sourceChild.material;

        //hardwired to mirror on x=0
        //TODO: should be able to mirror based on centerline between edges, x or y 
        let {x,y} = sourceChild.edges[0].pFrom;
        newFace.setCursor(x , y);
        for (let i = 0; i < sourceChild.edges.length; i++) {
            const {x,y} = sourceChild.edges[i].pTo;
            newFace.edgeAbs(-x, y);
        }
        newFace.closed = true;
        toEdge.adjoined = newFace;

        //any adjoining faces on surfaces should also be adjoined
        for (let i = 0; i < sourceChild.edges.length; i++) {
            const adjoinedFace = sourceChild.edges[i].adjoined;
            if (adjoinedFace) {
                const orgAdjoinedFaceName = sourceChildName + "/" + adjoinedFace.name;
                const newAdjoinedFaceName = targetChildName + "/" + adjoinedFace.name;
                this.mirrorClone(orgAdjoinedFaceName, newAdjoinedFaceName, i);
            }
        }

        return newFace;
    }

    getTriangles() {
        //this.guardAgainstNotClosed();
        const triangles = [];

        for (let i = 1; i < this.edges.length; i ++) {
            const triangle = new Triangle(this.edges[i], this.edges[0]);
            triangles.push(triangle);

            if (this.edges[i].adjoined) {
                const adjoinedTriangles = this.edges[i].adjoined.getTriangles();
                triangles.push(...adjoinedTriangles);
            }
        }
        return triangles;
    }

    getGeometry() {
        const geometry = {
            vertices: [],
            colors: []
        };
        const z = 0;

        const triangles = this.getTriangles();
        triangles.forEach(triangle => {
            geometry.vertices.push(triangle.A.x, triangle.A.y, z);
            geometry.vertices.push(triangle.B.x, triangle.B.y, z);
            geometry.vertices.push(triangle.C.x, triangle.C.y, z);
            geometry.colors.push(...triangle.material.color);
            geometry.colors.push(...triangle.material.color);
            geometry.colors.push(...triangle.material.color);
        });

        geometry.vertices = new Float32Array(geometry.vertices);
        geometry.colors = new Float32Array(geometry.colors);
        return geometry;
    }
}

class Edge {  //represents a surface edge consisting of surfaces (parent, adjacent) sharing two points.

    surface;
    edgeIndex;
    adjoined;  //a surface adjoin-created on this edge, one-way relationship

    pFrom;
    pTo;

    constructor(surface, pFrom, pTo) {
        this.surface = surface;
        this.edgeIndex = surface.edges.length;
        this.pFrom = pFrom;
        this.pTo = pTo;
    }

    // mirrorClone(sourceEdge, targetEdge) {
    //     //created a reflected clone of THIS edge, positioned relative to "targetEdge"
    //     //based on its psition relative to "sourceEdge", but reflected in the x or y axis

    //     const dxFrom = sourceEdge.pFrom.x - targetEdge.pTo.x;
    //     const dxTo = sourceEdge.pTo.x - targetEdge.pFrom.x;
    //     const dyFrom = sourceEdge.pFrom.y - targetEdge.pTo.y;
    //     const dyTo = sourceEdge.pTo.y - targetEdge.pFrom.y;

    //     if (dxFrom !== dxTo && dyFrom !== dyTo) {
    //         debugger;
    //         throw "neither source and target edges from's or to's share an axis. plane of reflection can't be determined";
    //     }
        
    //     let signX = Math.sign(dxFrom);
    //     let signY = Math.sign(dyFrom);

    //     if (signX !== 0 && signY !== 0) {
    //         debugger;
    //         throw "can only reflect in x or y plane, not both";
    //         //TODO: (later) calculate plane of reflection from both edges and use that
    //     }

    //     if (signY === 0) {
    //         //same Y's so reflect about x axis
    //         const rxFrom = this.pFrom.x - sourceEdge.pFrom.x;
    //         const rxTo = this.pTo.x - sourceEdge.pTo.x;
    //         const newPFrom = {
    //             x: targetEdge.pFrom.x - rxFrom,
    //             y: targetEdge.pFrom.y
    //         };
    //         const newPTo = {
    //             x: targetEdge.pTo.x - rxTo,
    //             y: targetEdge.pTo.y
    //         };
    //         debugger;   
    //         const result = new Edge(this.surface, newPFrom, newPTo);
    //         return result;
    //     }

    //     //TODO: when same X's, reflect about y axis

    // }

    getFace() {
        return this.surface;
    }
}


class Triangle {
    A;
    B;
    C;
    normal;
    edge1;
    edge2;
    material; 
    lod;

    constructor(edge1, edge2) {

        if (edge1.surface !== edge2.surface) {
            throw "triangle edges must share common surface";
        }

        this.A = edge1.pFrom;
        this.B = edge1.pTo;
        this.C = edge2.pFrom;
        console.log("triangle", this.A, this.B, this.C);

        this.material = edge1.surface.material;
        this.lod = edge1.surface.lod;
        this.normal = [0,0,-1];
        //TODO: calculate normal
    }
}


export function FromCssColor(cssColor) {
    const result = [];
    if (cssColor.startsWith("#")) cssColor = cssColor.substring(1);
    while (cssColor.length > 0) {
        const tuple = cssColor.substring(0, 2);
        cssColor = cssColor.substring(2);
        const component = Number.parseInt(tuple, 16) / 255;
        result.push(component);
    }
    return result;
}