import SquareMatrix from "../../math/square-matrix.js";

export default class NormalsAttribute
{
    gl;
    glBuffer;
    dimensions;

    constructor(gl, elements)
    {
        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW);    

        this.count = elements.length;
    }

    Set(shader, modelViewMatrix)
    {
        if (shader.locations.aVertexNormal === null || shader.locations.aVertexNormal === undefined)
        {
            console.error("Shader " + shader.id + " does not have the attribute aVertexNormal" );
            return;
        }
    
        const numComponents = 3;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
        //console.log("setting normals");
        this.gl.vertexAttribPointer(
            shader.locations.aVertexNormal,
            numComponents,
            type,
            normalize,
            stride,
            offset
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
