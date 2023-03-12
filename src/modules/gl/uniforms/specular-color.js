const DEFAULT_COLOR = [0.1, 1.0, 0.1, 1.0];

export default class SpecularColor
{
    gl;
    location;
    r;
    g;
    b;
    a;
    
    constructor(gl, parent, values = DEFAULT_COLOR)
    {
        this.gl = gl;
        this.parent = parent;
        this.r = values[0] || DEFAULT_COLOR[0];
        this.g = values[1] || DEFAULT_COLOR[1];
        this.b = values[2] || DEFAULT_COLOR[2];
        this.a = (values.length > 3) ? values[3] : 1.0;
 
        this.location = parent.shader.locations.uMaterialSpecularColor;
        if (!this.location)
        {
            throw "uMaterialSpecularColor uniform not found";
        }
    }

    set()
    {
        debugger;
        this.gl.uniform4f(this.location, r, g, b, a);
    }
}