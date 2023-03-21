import DomHelper from "../../dom/utilities/dom-helper.js";
import Vector from "../../math/vector.js";
import Texture from "../texture.js";

export default class PlanetTextureGenerator
{
    gl;
    planetInfo;
    rotatingSeed;

    constructor(gl, planetInfo)
    {
        this.gl = gl;
        this.planetInfo = planetInfo;

        this.randomSeed = new RandomSeed(this.planetInfo.seed);
        this.rotatingSeed = new RotatingSeed(this.randomSeed);
    }

    async Create()
    {
        //const textureCanvas = new OffscreenCanvas(this.width, this.height); 
        const textureCanvas = DomHelper.AppendElement(document.body, Elements.TextureCanvas);
        textureCanvas.width = this.planetInfo.width;
        textureCanvas.height = textureCanvas.width;

        this.ctx = textureCanvas.getContext("2d");
        this.ctx.fillStyle = "#808080";
        this.ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);



        //this.addCheckerboard();
        await this.addDebugBoard();
        //this.generateTexture();
        const texture = new Texture(this.gl);
        texture.Create(textureCanvas);
        return texture;

    }

    async addDebugBoard()
    {
        const url = this.planetInfo.gameCtx.dataPath + "/grid512.png"
        const image = new Image();
        image.src = url;
        await image.decode();
        this.ctx.drawImage(image, 0, 0);

    }

    addCheckerboard()
    {
        const squareSize = 16;
        let colorA = "#FF0000";
        let colorB = "#FFFFFF";
        let rowColor = colorA;

        for (let x = 0; x < this.ctx.canvas.width; x += squareSize)
        {
            rowColor = (rowColor === colorA) ? colorB: colorA;
            let color = rowColor;
            for (let y = 0; y < this.ctx.canvas.height; y += squareSize)
            {
                this.ctx.fillStyle = color;
                this.ctx.fillRect(x, y, x + squareSize, y + squareSize)
                color = (color === colorA) ? colorB: colorA;
            }
        }
    }

    generateTexture()
    {
        const width = this.planetInfo.width;
        const height = width;
        const fbmBuffer = new FractalBrownianNoiseArray(this.rotatingSeed, width, height);        
        
        const cloudFraction = this.planetInfo.cloud.ratio;
        const landFraction = this.planetInfo.land.ratio
        const seaColor = new Vector(this.planetInfo.sea.color);
        const landColor = new Vector(this.planetInfo.land.color);
        const polarSeaColor = new Vector(this.planetInfo.sea.polarColor);
        
        const paleClouds = (cloudFraction * fbmBuffer[0] < (1.0 - cloudFraction)) ? 0.0 : 1.0;
        const poleValue = (cloudFraction > 0.5) ? 0.5 * cloudFraction : 0.0;
        const seaBias = landFraction - 1.0;
        
        //TODO: my blending might be backwards. check later
        const shallowSeaColor = seaColor.blend(landColor, 0.7);
        const paleSeaColor = seaColor.blend(shallowSeaColor, 0.35);
        const normalScale = 3.0;
        
        const blackColor = new Vector(0, 0, 0, 1);
        const deepSeaColor = seaColor.blend(blackColor, 0.85);

        let x = 0; 
        let y = 0;
        let color = new Vector();
        let normal = new Vector();
        let q = 0.0;
        let yN = 0.0;
        let yS = 0.0;
        let yW = 0.0;
        let yE = 0.0;
        let nearPole = 0.0;

        let shade = 0.0;
        let rHeight = 1.0 / height;
        let fy = 0.0
        let fHeight = height;
        //original notes:
        //The second parameter is the temperature fraction. 
        //Most favourable: 1.0f,  little ice. Most unfavourable: 0.0f, frozen planet. 
        //TODO: make it dependent on ranrot / planetinfo key...
        
        let temperatureFraction = 1.0;
        
        const mix = {};
        mix.hi = 0.66667 * landFraction,
        mix.oh = 1.0 * mix.hi;
        mix.ih = 1.0 * (1.0 - mix.hi);
        mix.polarCap = temperatureFraction * (0.28 + 0.24 * landFraction);
        
        //calculate q:
        const qBuffer = new Float32Array(width * height);
        
        for (y = height - 1, fy = y; y >= 0; y--, fy--)
        {
            nearPole = (2.0 * fy - fHeight) * rHeight;
            nearPole *= nearPole;
            
            for (x =_width - 1; x >=0; x--)
            {
                _info.qBuffer[y * _width + x] = QFactor(_info.fbmBuffer, x, y, _width, poleValue, seaBias, nearPole);
            }
        }

    }
}


const DEFAULT_BUFFER_SIZE = 128;
const WORD_NORM_FACTOR = 1.0 / 65536.0;

class RandomBuffer extends Float32Array
{

    //ported from CCore\Materials\OOPlanetTextureGenerator.m [FillRandomBuffer]
    constructor(rotatingSeed, size = DEFAULT_BUFFER_SIZE)
    {
        super(size * size);
        this.rotatingSeed = rotatingSeed;
        this.size = size;  //not the same as buffer length, as it is two dimensional
        this.addRandomValues();
    }

    addRandomValues()
    {
        for (let i = 0; i < this.length; i++)
        {
            let number = this.rotatingSeed.Rotate();
            this[i] = (number & 0xffff) * WORD_NORM_FACTOR;
        }
    }
}


class FractalBrownianNoiseArray extends RandomBuffer
{
    constructor(rotatingSeed, width, height)
    {
        super(rotatingSeed);  //use default size, NOT height * width
        this.width = width;
        this.height = height; 
        //TODO: consider flattening random buffer up into this if not used elsewhere
        this.addFBMNoise();
    }

    addFBMNoise()
    {
        const qxBuffer = new Float32Array(this.width);
        const ixBuffer = new Int32Array(this.width);

        //const octaveBits = 8 * 1; // was 8 * info->planetAspectRatio but always set to 1 at time of port
        let octaveBits = 7;
        let octave = octaveBits;
        let scale = 0.5;

        while ((octaveBits + 1) < this.height)
        {
            this.addOctave(octave, octaveBits, scale, qxBuffer, ixBuffer);
            octave *= 2.0;
            octaveBits = (octaveBits << 1) | 1;
            scale *= 0.5;
        }
    }

    addOctave(octaveNumber, octaveBits, scale, qxBuffer, ixBuffer)
    {
        let	x = 0;
        let y = 0;
        let ix = 0;
        let jx = 0;
        let iy = 0;
        let jy = 0;

        let fx = 0.0;
        let fy = 0.0;
        let qx = 0.0;
        let qy = 0.0;

        let rix = 0.0;
        let rjx = 0.0;
        let rfinal = 0.0;

        let rr = octaveNumber / this.width;
        let dest = 0;

        let bufferSize = this.size;
        let bufferSizeMinus = bufferSize - 1;
        
        for (fy = 0, y = 0; y < this.height; fy++, y++)
        {
            qy = fy * rr;
            iy = Math.floor(qy);
            jy = (iy + 1) & octaveBits;
            qy = Math.hermite(qy - iy);
            iy &= (bufferSizeMinus);
            jy &= (bufferSizeMinus);
		
            for (fx = 0, x = 0; x < this.width; fx++, x++)
            {
                if (y == 0)
                {
                    // first pass: initialise buffers.
                    qx = fx * rr;
                    ix = Math.floor(qx);
                    qx -= ix;
                    ix &= (bufferSizeMinus);
                    ixBuffer[x] = ix;
                    qxBuffer[x] = Math.hermite(qx);
                }
                else
                {
                    // later passes: grab the stored values.
                    ix = ixBuffer[x];
                    qx = qxBuffer[x];
                }
			
                jx = (ix + 1) & octaveBits;
                jx &= (bufferSizeMinus);
                
                rix = Math.lerp(this[iy * bufferSize + ix], this[iy * bufferSize + jx], qx);
                rjx = Math.lerp(this[jy * bufferSize + ix], this[jy * bufferSize + jx], qx);
                rfinal = Math.lerp(rix, rjx, qy);
                
                this[dest] += scale * rfinal;
                dest++;
            }
        }
    }

}



class RandomSeed extends Uint8Array
{
    //from: legacy_random.c [RNG_Seed]

    constructor(seedText)
    {
        super(6);
        const bytes = seedText.split(" "); //comes in as space delimited bytes (a b c d e f)
        this.set(bytes);
    }

    get a() //most significant byte
    {
        return this[0];
    }

    get b()
    {
        return this[1];
    }

    get c() 
    {
        return this[2];
    }

    get d()
    {
        return this[3];
    }

    get e()
    {
        return this[4];
    }

    get f() //least significant byte
    {
        return this[5];
    }

}

class RotatingSeed extends Uint32Array
{
    //from: src\Core\legacy_random.c [RANROTSeed]

    constructor(randomSeed)
    {
        super(2);
        this.low = randomSeed.a * 0x1000000 + randomSeed.b * 0x10000 + randomSeed.c * 0x100 + randomSeed.d;
        this.high = -this.low;

        this.Rotate();
        this.Rotate();
        this.Rotate();
    }

    get high()
    {
        return this[0];
    }

    set high(value)
    {
        this[0] = value;
    }

    get low()
    {
        return this[1];
    }

    set low(value)
    {
        this[1] = value;
    }

    Rotate()
    {
        // ioSeed->high = (ioSeed->high << 16) + (ioSeed->high >> 16);
        // ioSeed->high += ioSeed->low;
        // ioSeed->low += ioSeed->high;
        // return ioSeed->high & 0x7FFFFFFF;
        this.high = this.high << 16 + this.high >> 16;
        this.high += this.low;
        this.low += this.high;

        return this.high & 0x7FFFFFFF;
    }
}




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