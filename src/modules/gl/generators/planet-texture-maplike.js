import DomHelper from "../../dom/utilities/dom-helper.js";
import Vector from "../../math/vector.js";
import Texture from "../texture.js";

export default class PlanetTextureGenerator {
    gl;
    planetInfo;
    rotatingSeed;

    constructor(gl, planetInfo) {
        this.gl = gl;
        this.planetInfo = planetInfo;

        this.seed = planetInfo.seed.split(" ");
        for (let s = 0; s < this.seed.length; s++) {
            this.seed[s] = parseInt(this.seed[s]);
        }

        let seed = this.seed[0] * 256 + this.seed[1];
        this.rng = new Math.seedrandom(seed);

    }

    async Create() {
        //const textureCanvas = new OffscreenCanvas(this.width, this.height); 
        const textureCanvas = DomHelper.AppendElement(document.body, Elements.TextureCanvas);
        textureCanvas.width = this.planetInfo.width;
        textureCanvas.height = textureCanvas.width;

        this.ctx = textureCanvas.getContext("2d");
        this.ctx.fillStyle = "#808080";
        this.ctx.fillRect(0, 0, textureCanvas.width, textureCanvas.height);

        //this.addCheckerboard();
        //await this.addDebugBoard();
        this.generateTexture();

        const texture = new Texture(this.gl);
        texture.Create(textureCanvas);
        return texture;
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


    generateTexture() {
        this.ctx.fillStyle = "#383838"; //dark but visible
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

        const width = this.ctx.canvas.width;
        const height = this.ctx.canvas.height;
        const area = width * height;

        this.seaLevel = this.rng() - 0.1;
        this.seaLevel = Math.clamp(this.seaLevel, 0.2, 0.9);
        //        this.seaLevel = this.planetInfo.land.ratio;

        const mapBuffer = new Float32Array(area);
        let vSeed = new Vec2(12.9898, 78.23);
        vSeed = new Vec2(this.seed[0], this.seed[1]);
        const meanDelta = this.fillMapBuffer(mapBuffer, width, height, vSeed);
        this.fixSeam(mapBuffer, 1, width, height, this.seaLevel);
        this.fixSeam(mapBuffer, width - 1, width, height, this.seaLevel);

        // cloud must be done as a separate texture so it can rotate independently

        this.buildColorTable(this.seaLevel);
        this.drawBuffer(mapBuffer, width, height, this.seaLevel);

    }

    buildColorTable(seaLevel) {
        //color table is a list of heights and colors
        //where anything less than the specified height becomes that color
        //unless superceded by the next height

        const white = new Vector([1.0, 1.0, 1.0, 1.0]);
        const black = new Vector([0.0, 0.0, 0.0, 1.0]);

        const sea = {
            height: Math.lerp(seaLevel, 0, 0.06),
            name: "sea",
            blend: true,
            color: new Vector(this.planetInfo.sea.color),
            polar: new Vector(this.planetInfo.sea.polarColor)
        };
        const land = {
            height: Math.lerp(seaLevel, 1.0, 0.33),
            name: "land",
            blend: false,
            color: new Vector(this.planetInfo.land.color),
            polar: new Vector(this.planetInfo.land.polarColor)
        };
        const deepSea = {
            height: Math.lerp(seaLevel, 0, 0.5),
            name: "deeps",
            blend: true,
            color: new Vector(sea.color).blend(black, 0.2),
            polar: sea.polar
        };
        const shallowSea = {
            height: seaLevel,
            blend: true,
            name: "shallows",
            //color: new Vector(sea.color).blend(land.color, 0.3),
            polar: sea.polar
        };
        
        shallowSea.color = sea.color.blend(white, 0.1);

        const highland = {
            height: Math.lerp(land.height, 1.0, 0.3),
            name: "high",
            blend: true,
            color: new Vector(0.9, 0.9, 0.9, 1.0).blend(land.color, 0.5),
            polar: land.polar
        };
        const peaks = {
            height: Math.lerp(highland.height, 1.0, 0.5),
            name: "peaks",
            blend: false,
            color: land.polar,
            polar: land.polar
        };
        const air = {
            height: 1.0,
            name: "air",
            blend: false,
            color: new Vector(this.planetInfo.air.color)
            //polar: the same, assigned below
        };

        //make the air very transparent
        air.color[3] = 0.1;
        air.polar = air.color;

        //assemble colors in order
        this.colorTable = [deepSea, sea, shallowSea, land, highland, peaks, air];

        this.colorTable.forEach(lookup => {
            if (lookup.name !== "air")
            {
                //blend with air color
                lookup.color = lookup.color.blend(air.color, 0.0);
            }
            lookup.colorCSS = lookup.color.AsCSSColor();
            lookup.polarCSS = lookup.polar.AsCSSColor();
        });

        //TODO:
        // rotation speed
        // city light color. lights??
        // amount of polar should depend on season + tilt

        debugger;
    }

    fixSeam(mapBuffer, x, width, height, seaLevel) {
        //if a land mass is found on a seam, sink the edges
        for (let y = 0; y < height; y++) {
            let pos = y * width + x;
            let noise = mapBuffer[pos];
            if (noise > seaLevel) {
                this.sink(mapBuffer, x, y, width, height, seaLevel, this.rng());
            }
        }
    }

    sink(mapBuffer, x, y, width, height, seaLevel, fraction) {
        if (fraction < 0.999) {
            //wrap if needed
            x = (x < 0) ? width + x : x;
            x = (x > width) ? x - width : x;
            y = (y < 0) ? height + y : y;
            y - (y > height) ? y - height : y;

            let pos = y * width + x;

            let level = mapBuffer[pos];
            if (level > seaLevel) //only sink if higher than sealevel
            {
                mapBuffer[pos] *= fraction;

                //adjacent nodes need to be sunk as well
                let newFraction = fraction + 0.02;
                this.sink(mapBuffer, x + 1, y - 1, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x + 1, y - 0, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x + 1, y + 1, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x + 0, y + 1, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x - 1, y + 1, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x - 1, y + 0, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x - 1, y - 1, width, height, seaLevel, newFraction);
                this.sink(mapBuffer, x + 0, y - 1, width, height, seaLevel, newFraction);
            }
        }
    }

    addClouds(mapBuffer, width, height, seed) {

    }

    fillMapBuffer(mapBuffer, width, height, vSeed) {
        const octaves = 8;

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let ns = x / width;
                let nt = y / height;
                let st = new Vec2(ns, nt).scale(5.0);

                let pos = y * width + x;
                let noise = this.fractalBrownian(st, octaves, vSeed);
                mapBuffer[pos] = noise;
            }
        }
    }


    drawBuffer(mapBuffer, width, height, seaLevel) {
        // this.ctx.fillStyle = "#FF0000";
        // this.ctx.lineStyle = "#FF0000";

        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                let pos = y * width + x;
                let landLevel = mapBuffer[pos];                
                this.ctx.fillStyle = this.lookupColor(landLevel);;
                this.ctx.fillRect(x, y, 1, 1)
            
            }
        }
    }

    lookupColor(landLevel, polarFraction = 0.0) 
    {
        let matchedC = 0;
        for (let c = 0; c < this.colorTable.length; c++)
        {
            let lookup = this.colorTable[c];
            if (landLevel < lookup.height)
            {
                matchedC = c;
                break;
            }
        }
        //console.log("found color", color.name);
        if (matchedC > 0)
        {
            //debugger;
            if (this.colorTable[matchedC].blend === true)
            {
                let lowerColor = this.colorTable[matchedC - 1].color;
                let higherColor = this.colorTable[matchedC].color;
                let lowerHeight = this.colorTable[matchedC - 1].height;
                let higherHeight = this.colorTable[matchedC].height;
                let diff = higherHeight - lowerHeight;
                let relativeLevel = landLevel - lowerHeight;
                let fraction = relativeLevel/diff;
                let blended = lowerColor.blend(higherColor, fraction);
                return blended.AsCSSColor();
            }
            else
            {
                return this.colorTable[matchedC].colorCSS;  //air if no match
            }

        }
        else
        {
            return this.colorTable[0].colorCSS;  //air if no match
        }
    }

    noise(st, vSeed) {
        let i = st.floor();
        let f = st.fract();

        // Four corners in 2D of a tile
        let a = i.random(vSeed);
        let b = i.plus(1.0, 0.0).random(vSeed);
        let c = i.plus(0.0, 1.0).random(vSeed);
        let d = i.plus(1.0, 1.0).random(vSeed);

        //    vec2 u = f * f * (3.0 - 2.0 * f); 
        let s = f.scale(2.0).negate().plus(3.0, 3.0);
        let u = f.multiply(f).multiply(s);

        let result = Math.lerp(a, b, u.x);
        result += (c - a) * u.y * (1.0 - u.x);
        result += (d - b) * u.x * u.y;

        return result;
    }

    fractalBrownian(st, octaves, vSeed) {
        let value = 0.0;
        let amplitude = .5;
        //
        // Loop of octaves
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise(st, vSeed);
            st = st.scale(2.0);
            amplitude *= .5;
        }
        return value;
    }
}

class Vec2 {

    constructor(x, y) {
        this.x = x;
        this.y = y;
    }

    clone() {
        return new Vec2(this.x, this.y);
    }

    add(other) {
        return new Vec2(this.x + other.x, this.y + other.y);
    }

    plus(x, y) {
        return new Vec2(this.x + x, this.y + y);
    }

    negate() {
        return new Vec2(-this.x, -this.y);
    }

    floor() {
        return new Vec2(Math.floor(this.x), Math.floor(this.y));
    }

    fract() {
        return new Vec2(Math.fract(this.x), Math.fract(this.y));
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    scale(scale) {
        return new Vec2(this.x * scale, this.y * scale);
    }

    sin() {
        return new Vec2(Math.sin(this.x), Math.sin(this.y));
    }

    multiply(other) {
        return new Vec2(this.x * other.x, this.y * other.y);
    }

    random(vSeed) {
        const dotted = this.dot(vSeed);
        const sinDotted = Math.sin(dotted);
        const result = Math.fract(sinDotted * 43758.5453123);
        return result;
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