
//TODO: this is a 'specular texture map' as opposed to other maps
export default class Texture
{
    gl;
    glTexture;
    uniforms;

    constructor(gl)
    {
        this.gl = gl;
        this.uniforms = [];
    }

    async Load(url)
    {
        const image = new Image();
        image.src = url;
        await image.decode();
        //console.log( `texture image loaded. width: ${ image.width }, height: ${ image.height }` );
        this.Create(image);
        //console.log( `texture image loaded. width: ${ image.width }, height: ${ image.height }` );
    }

    Create(imageOrCanvas)
    {
        this.glTexture = this.gl.createTexture();
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);

        const level = 0;
        const internalFormat = this.gl.RGBA;
        const srcFormat = this.gl.RGBA;
        const srcType = this.gl.UNSIGNED_BYTE;

    
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
 
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);

 
        const ext = this.gl.getExtension("EXT_texture_filter_anisotropic");
        this.gl.texParameterf(this.gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, 1);

        //this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);

        this.gl.texImage2D(this.gl.TEXTURE_2D, level, internalFormat, srcFormat, srcType, imageOrCanvas);
        this.gl.generateMipmap(this.gl.TEXTURE_2D);

        this.gl.bindTexture(this.gl.TEXTURE_2D, null);

    }

    SetSampler(shader, number)
    {
        if (shader.locations.uSampler === null || shader.locations.uSampler === undefined)
        {
            console.error("Shader " + shader.id + " requires the attribute uSampler" );
            return;
        }

        const textureName = "TEXTURE" + number;
        this.gl.activeTexture(this.gl[textureName]);
        this.gl.bindTexture(this.gl.TEXTURE_2D, this.glTexture);
        this.gl.uniform1i(shader.locations.uSampler, 0);
    }

    Dispose(shader, number)
    {
        this.gl.deleteTexture(this.glTexture);
    }
}
