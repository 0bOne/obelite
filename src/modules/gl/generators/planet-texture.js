import DomHelper from "../../dom/utilities/dom-helper.js";
import Vector from "../../math/vector.js";
import Texture from "../texture.js";
import ShaderCache from "../loaders/shader-cache.js";

export default class PlanetTextureGenerator {

    planetInfo;

    constructor(gameCtx, planetInfo) {
        this.gameCtx = gameCtx;
        this.planetInfo = planetInfo;

        this.seed = planetInfo.seed.split(" ");
        for (let s = 0; s < this.seed.length; s++) {
            this.seed[s] = parseInt(this.seed[s]);
        }

        let seed = this.seed[0] * 256 + this.seed[1];
        this.rng = new Math.seedrandom(seed);

    }

    async Create() {
        const textureCanvas = new OffscreenCanvas(10, 10); 
        //const textureCanvas = DomHelper.AppendElement(document.body, Elements.TextureCanvas);
        textureCanvas.width = this.planetInfo.width;
        textureCanvas.height = textureCanvas.width;

        //this.addCheckerboard();
        //await this.addDebugBoard();
        const gl = await this.setupWebGL(textureCanvas);
        const startTime = performance.now();
        this.generateTexture(gl, 1);
        
        const endTime = performance.now();
        console.log('mtexture gen time', endTime - startTime);

        const texture = new Texture(this.gameCtx.gl);
        texture.Create(textureCanvas);
        return texture;
    }

    async setupWebGL(textureCanvas)
    {
        const gl = textureCanvas.getContext('webgl');

        gl.viewport(0, 0, textureCanvas.width, textureCanvas.height);

        const shaderCache = new ShaderCache(gl, this.gameCtx.dataPath);

        this.stages = {
            1: await shaderCache.Get("generators/planets/stage1")
        };

        return gl;

    }

    generateTexture(gl, stageNumber)
    {
        const shader = this.stages[stageNumber];
        const program = shader.program;

        gl.useProgram(program);

        //this.feedbackTexture(gl, shader);

        gl.enableVertexAttribArray(shader.locations.aVertexPosition);

        gl.uniform1f(shader.locations.u_resolution, gl.canvas.width);  // offset it to the right half the screen
        this.addLandMassUniforms(gl, shader);
        this.addColorUniforms(gl, shader);

        var vBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);

        var vertices = new Float32Array(VERTICES_SQUARE);

        gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);

        gl.vertexAttribPointer(shader.locations.aVertexPosition, 3, gl.FLOAT, false, 0, 0);
 
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }

    addColorUniforms(gl, shader)
    {
        let seaLevel = this.planetInfo.land.ratio;
        seaLevel = Math.clamp(seaLevel, 0.15, 0.95);
        seaLevel = 0.5;

        //gl.uniform1f(shader.locations.u_sea_level, seaLevel); //causes land above MSL to be set red

        const white = new Vector([1.0, 1.0, 1.0, 1.0]);
        const black = new Vector([0.0, 0.0, 0.0, 1.0]);

        const sea = {
            height: seaLevel,
            color: new Vector(this.planetInfo.sea.color),
        };

        const land = {
            height: Math.lerp(seaLevel, 1.0, 0.33),
            color: new Vector(this.planetInfo.land.color)
        };

        const peaks = {
            height: Math.lerp(land.height, 1.0, 0.2),
            color: new Vector(this.planetInfo.land.polarColor)
        };

        const highland = {
            height: Math.lerp(land.height, peaks.height, 0.5),
            color: land.color.blend(peaks.color, 0.5)
        };

        this.addColorUniform(gl, shader, "sea", sea);
        this.addColorUniform(gl, shader, "land", land);
        this.addColorUniform(gl, shader, "heights", highland);
        this.addColorUniform(gl, shader, "peaks", peaks);
    }

    addColorUniform(gl, shader, uniformSuffix, value)
    {
        const color_unform_name = "u_color_" + uniformSuffix;
        const height_unform_name = "u_height_" + uniformSuffix;
        gl.uniform4fv(shader.locations[color_unform_name], value.color);  
        gl.uniform1f(shader.locations[height_unform_name], value.height); 
    }

    addLandMassUniforms(gl, shader)
    {

        //unform: x + y are the offset of the landmass
        //z is the seed (a z value of zero disables the land mass)

        let num_land_masses = 0;
        
        for (let n = 1; n <= 5; n++)
        {
            const uniformName = "u_land_offset_" + n;
            //generate a random offset. away from the poles
            //TODO: fix shader so that poles can be rendered
            let goodOffset = false;
            while(goodOffset === false)
            {
                let y = this.rng() - 0.5;
                let x = this.rng() - 0.5;
                let z = (this.rng() - 0.2);
                if (!(Math.abs(x) < 0.2 && Math.abs(y) < 0.2) )
                {
                    let value = [x, y, z];
                    gl.uniform3fv(shader.locations[uniformName], value);  
                    if (z > 0)
                    {
                        num_land_masses++;
                    }
                    goodOffset = true;
                }
            } //repeat until a good offset is found
        } //for each of the 5 uniforms

        console.log("num_land_masses", num_land_masses);
    }

    async addDebugBoard() {
        const url = this.planetInfo.gameCtx.dataPath + "/grid512.png"
        const image = new Image();
        image.src = url;
        await image.decode();
        this.ctx.drawImage(image, 0, 0);

    }

    addCheckerboard() {
        const squareSize = 16;
        let colorA = "#FF0000";
        let colorB = "#FFFFFF";
        let rowColor = colorA;

        for (let x = 0; x < this.ctx.canvas.width; x += squareSize) {
            rowColor = (rowColor === colorA) ? colorB : colorA;
            let color = rowColor;
            for (let y = 0; y < this.ctx.canvas.height; y += squareSize) {
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, x + squareSize, y + squareSize)
                color = (color === colorA) ? colorB : colorA;
            }
        }
    }

}

const VERTICES_SQUARE = [
     1.0,  1.0, 0.0, 
    -1.0,  1.0, 0.0, 
     1.0, -1.0, 0.0, 
    -1.0, -1.0, 0.0
];

const Styles = {
    TextureCanvas: {
        backgroundColor: "gray",
        cursor: "crosshair",
        position: "absolute",
        left: 0,
        top: 0
    }
};

const Elements = {
    TextureCanvas: {
        tag: "canvas",
        styles: Styles.TextureCanvas
    }
};