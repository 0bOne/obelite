import SquareMatrix from "../../math/square-matrix.js";

export default class NormalsAttribute
{
    gl;
    glBuffer;
    dimensions;

    dimensions;
    normalize;
    stride;
    offset;

    constructor(gl, elements)
    {
        this.dimensions = 3;
        this.normalize = false;
        this.stride = 0;
        this.offset = 0;

        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW);    
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.count = elements.length;
    }

    Set(shader, modelViewMatrix)
    {
        if (shader.locations.aVertexNormal === null || shader.locations.aVertexNormal === undefined)
        {
            console.error("Shader " + shader.id + " does not have the attribute aVertexNormal" );
            return;
        }
    
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
        //console.log("setting normals");
        this.gl.vertexAttribPointer(
            shader.locations.aVertexNormal,
            this.dimensions,
            this.gl.FLOAT,
            this.normalize,
            this.stride,
            this.offset
        );
        this.gl.enableVertexAttribArray(shader.locations.aVertexNormal);
       
    }

    Position(shader, modelViewMatrix)
    {
        const normalMatrix = new SquareMatrix(4);
        normalMatrix.setIdentity();
        normalMatrix.setInverted(modelViewMatrix);
        normalMatrix.setTransposed(normalMatrix);

        this.gl.uniformMatrix4fv(
            shader.locations.uNormalMatrix,
            false,
            normalMatrix
        ); 
    }

    static FromFaceNormals(gl, faceNormals)
    {
        let vertexNormals = [];

        for (var f = 0; f < faceNormals.length; ++f) 
        {
            const n = faceNormals[f];
            vertexNormals.push(n, n, n, n);
        }
        
        return new NormalsAttribute(gl, vertexNormals);
    }

    Dispose(shader)
    {   
        this.gl.disableVertexAttribArray(shader.locations.aVertexNormal);
        this.gl.deleteBuffer(this.glBuffer);
    }
}
