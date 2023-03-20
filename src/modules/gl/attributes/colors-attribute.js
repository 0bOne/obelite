
export default class ColorsAttribute
{
    gl;
    glBuffer;

    dimensions = 4;
    normalize = false;
    stride = 0;
    offset = 0;

    constructor(gl, elements)
    {

        elements = this.translateColorNames(elements);     
        this.count = elements.length;

        this.gl = gl;
        this.glBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.glBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(elements), gl.STATIC_DRAW);  
        gl.bindBuffer(gl.ARRAY_BUFFER, null);  

    }

    translateColorNames(elements)
    {
        //TODO: make this more robust, handle rgb, rgba, css '#' prefixes, 0x prefixes, etc.
        const translatedElements = [];
        elements.forEach(element => {
            if (typeof element === "string")
            {
                const fourColorArray = COLOR_NAMES_RGBA[element];
                translatedElements.push(...fourColorArray);
            }
            else
            {
                translatedElements.push(element);
            }
        });

        return translatedElements;
    }

    colorHexToComponent(hex)
    {
        const MAX_VALUE = 256;
        const intValue = parseInt(hex, 16) + 1;
        return intValue / MAX_VALUE;
    }

    Position(modelViewMatrix)
    {
    }

    Set(shader)
    {
        if (shader.locations.aVertexColor === null || shader.locations.aVertexColor === undefined)
        {
            console.error("Shader " + shader.id + " does not have the attribute aVertexColor" );
            return;
        }
    

        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.glBuffer);
        //console.log("setting colors");
        this.gl.vertexAttribPointer(
            shader.locations.aVertexColor,
            this.dimensions,
            this.gl.FLOAT,
            this.normalize,
            this.stride,
            this.offset
        );
        this.gl.enableVertexAttribArray(shader.locations.aVertexColor);
    }

    static FromFaceColors(gl, faceColors)
    {
        let vertexColors = [];

        for (var f = 0; f < faceColors.length; ++f) 
        {
            const c = faceColors[f];
            vertexColors.push(c, c, c, c);
        }
        
        return new ColorsAttribute(gl, vertexColors);
    }

    Dispose(shader)
    {   
        this.gl.disableVertexAttribArray(shader.locations.aVertexColor);
        this.gl.deleteBuffer(this.glBuffer);
    }
}

const COLOR_NAMES_RGBA = {
    white:  [1.0, 1.0, 1.0, 1.0],
    red:   [1.0, 0.0, 0.0, 1.0],
    green: [0.0, 1.0, 0.0, 1.0],
    blue:  [0.0, 0.0, 1.0, 1.0],
    yellow: [1.0, 1.0, 0.0, 1.0],
    purple: [1.0, 0.0, 1.0, 1.0]
    //TODO: add other named colors as they arise
}



