export default class STsAttribute
{
    gl;
    buffer;
    count;

    constructor(gl, elements)
    {
        this.gl = gl;
        this.count = elements.length;
        this.buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.buffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW); 
    }

    Set(shader)
    {
        if (shader.locations.aTextureCoord === null || shader.locations.aTextureCoord === undefined)
        {
            console.error("Shader " + shader.id + " requires the attribute aTextureCoord" );
            return;
        }

        const num = 2; // every coordinate composed of 2 values
        const type = this.gl.FLOAT; // the data in the buffer is 32-bit float
        const normalize = false; // don't normalize
        const stride = 0; // how many bytes to get from one set to the next
        const offset = 0; // how many bytes inside the buffer to start from
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.buffer);
        this.gl.vertexAttribPointer(
            shader.locations.aTextureCoord,
            num,
            type,
            normalize,
            stride,
            offset
        );
        this.gl.enableVertexAttribArray(shader.locations.aTextureCoord);
    }

    Position(modelViewMatrix)
    {
    }
    
}
