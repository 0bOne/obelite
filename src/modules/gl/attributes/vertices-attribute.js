
export default class VerticesAttribute
{
    gl;
    glBuffer;
    dimensions;

    constructor(gl, elements, dimensions = 3)
    {
        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW);    

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
    
        const type = this.gl.FLOAT;     // the data in the buffer is 32bit floats
        const normalize = false;        // don't normalize
        const stride = 0;               // how many bytes to get from one set of values to the next
        const offset = 0;               // how many bytes inside the buffer to start from

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
        //console.log("setting positions");
        this.gl.vertexAttribPointer(
            shader.locations.aVertexPosition,
            this.dimensions,
            type,
            normalize,
            stride,
            offset
        );
        this.gl.enableVertexAttribArray(shader.locations.aVertexPosition);
        
    }
}
