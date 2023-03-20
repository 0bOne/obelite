import Texture from "../texture.js";

export default class PlanetTextureGenerator
{

    constructor(gl, width)
    {
        this.gl = gl;
        this.width = width;
        this.height = this.width;
    }

    Create(planetInfo)
    {
        // const textureCanvas = new OffscreenCanvas(this.width, this.height); 
        // this.ctx = textureCanvas.getContext("2d");
        // this.ctx.fillStyle = "#FFFF00";
        // this.ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);
        // this.addCheckerboard();
        // const texture = new Texture(this.gl);
        // texture.Create(textureCanvas);
        // return texture;

        

    }

    addCheckerboard()
    {
        const squareSize = 16;
        let isBlack = false;
        for (let x = 0; x < this.width; x+= squareSize)
        {
            for (let y = 0; y < this.height; y+= squareSize)
            {
                isBlack = !isBlack;
                this.ctx.fillStyle = (isBlack) ? "#FF0000" : "#FFFFFF";
                this.ctx.fillRect(x, y, x + squareSize, y + squareSize)
            }
        }

    }


}