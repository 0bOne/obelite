
export default class IndicesAttribute
{
    gl;
    glBuffer;

    constructor(gl, elements)
    {
        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(elements), gl.STATIC_DRAW);    

        this.count = elements.length;
    }

    Position(modelViewMatrix)
    {
    }

    Set(shader)
    {
        this.gl.bindBuffer(this.gl.ELEMENT_ARRAY_BUFFER, this.glBuffer);        
    }
}
