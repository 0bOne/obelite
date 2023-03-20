export default class STsAttribute
{
    gl;
    buffer;
    count;

    dimensions;
    normalize;
    stride;
    offset;

    constructor(gl, elements)
    {
        this.dimensions = 2;
        this.normalize = false;
        this.stride = 0; 
        this.offset = 0; 

        this.gl = gl;
        this.count = elements.length;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW); 
        gl.bindBuffer(gl.ARRAY_BUFFER, null);

    }

    Set(shader)
    {
        if (shader.locations.aTextureCoord === null || shader.locations.aTextureCoord === undefined)
        {
            console.error("Shader " + shader.id + " requires the attribute aTextureCoord" );
            return;
        }

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.vertexAttribPointer(
            shader.locations.aTextureCoord,
            this.dimensions,
            this.gl.FLOAT,
            this.normalize,
            this.stride,
            this.offset
        );
        this.gl.enableVertexAttribArray(shader.locations.aTextureCoord);
    }

    Position(modelViewMatrix)
    {
    }

    Dispose(shader)
    {   
        this.gl.deleteBuffer(this.buffer);
        this.gl.disableVertexAttribArray(shader.locations.aTextureCoord);

    }
    
}
