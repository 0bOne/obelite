
export default class VerticesAttribute
{
    gl;
    glBuffer;
    dimensions;

    offset;
    stride;
    normalize;
    

    constructor(gl, elements, dimensions = 3)
    {
        this.stride = 0;
        this.offset = 0;
        this.normalize = false;

        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW);    
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

        this.count = elements.length;
        this.dimensions = dimensions;
        this.vertices = elements.length / dimensions;

    }

    Position(modelViewMatrix)
    {
    }

    Set(shader)
    {
        if (shader.locations.aVertexPosition === null || shader.locations.aVertexPosition === undefined)
        {
            console.error("Shader " + shader.id + " does not have the attribute aVertexPosition" );
            return;
        }
    
        const normalize = false;        // don't normalize

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
        //console.log("setting positions");
        this.gl.vertexAttribPointer(
            shader.locations.aVertexPosition,
            this.dimensions,
            this.gl.FLOAT,
            this.normalize,
            this.stride,
            this.offset
        );
        this.gl.enableVertexAttribArray(shader.locations.aVertexPosition);
        
    }

    Dispose(shader)
    {   
        this.gl.disableVertexAttribArray(shader.locations.aVertexPosition);
        this.gl.deleteBuffer(this.glBuffer);
    }
}
