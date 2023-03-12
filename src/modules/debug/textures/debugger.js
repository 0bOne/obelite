import DomHelper from "../../utilities/dom-helper.js";
import jsYaml from "../../utilities/js-yaml.js";


// how to use the texture debugger
// async BeginTextureDebug()
// {
//     const dataPath = document.location.pathname.split("index.html")[0] + "data";
//     const modelPath = dataPath + "/models/ships/redux/cobra3";
//     const d = new TextureDebugger();
//     await d.display(modelPath);
// }

//texture debugger. draws triangs and verties on a texture
export default class TextureDebugger
{
    constructor()
    {
        this.canvas = DomHelper.AppendElement(document.body, {tag: "canvas"}),

        this.canvas.width = 512;
        this.canvas.height = 512;

        this.ctx = this.canvas.getContext("2d");
        this.clear();

    }

    clear(clearColor = "darkgrey")
    {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.rect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = clearColor;
        this.ctx.fill();
    }

    async display(modelPath, textureIndex = 0)
    {
        const modelData = await jsYaml.fetch(modelPath + "/geometry.yaml");
        const texture = modelData.textures[textureIndex];

        if (texture)
        {
            const image = new Image();
            image.src = modelPath + "/" + texture.file;
            await image.decode();
            //console.log( `texture image loaded. width: ${ image.width }, height: ${ image.height }` );
            this.canvas.width = image.width;
            this.canvas.height = image.height;
            this.clear();
  
            this.ctx.save();
            this.ctx.drawImage(image, 0, 0);
            this.ctx.restore();
            this.plotSTs(modelData, texture.sts);
        }
    }

    plotSTs(modelData, sts)
    {
        let faceNumber = 0;
        while (modelData.indices.length > 0)
        {
            //face vertex indices
            const vi1 = modelData.indices.shift();
            const vi2 = modelData.indices.shift();
            const vi3 = modelData.indices.shift();

            const v1 = {
                x: modelData.positions[vi1 * 3 + 0],
                y: modelData.positions[vi1 * 3 + 1],
                z: modelData.positions[vi1 * 3 + 2],
                stx: sts.shift(),
                sty: sts.shift(),
                d: 0,
            };
            const v2 = {
                x: modelData.positions[vi2 * 3 + 0],
                y: modelData.positions[vi2 * 3 + 1],
                z: modelData.positions[vi2 * 3 + 2],
                stx: sts.shift(),
                sty: sts.shift()
            };
            v2.d = Math.sqrt(Math.pow(v1.x - v2.x,2) + Math.pow(v1.y - v2.y, 2) + Math.pow(v1.z - v2.z, 2));

            const v3 = {
                x: modelData.positions[vi3 * 3 + 0],
                y: modelData.positions[vi3 * 3 + 1],
                z: modelData.positions[vi3 * 3 + 2],
                stx: sts.shift(),
                sty: sts.shift()
             };
             v2.d = Math.sqrt(Math.pow(v1.x - v3.x,2) + Math.pow(v1.y - v3.y, 2) + Math.pow(v1.z - v3.z, 2));
             //console.log(v1, v2, v3);
             this.annotateFace(v1, v2, v3, faceNumber);
             faceNumber++;
        }
    }

    annotateFace(v1, v2, v3, faceNumber)
    {
        const v1x = v1.stx * this.canvas.width;
        const v1y = v1.sty * this.canvas.height;

        const v2x = v2.stx * this.canvas.width;
        const v2y = v2.sty * this.canvas.height;

        const v3x = v3.stx * this.canvas.width;
        const v3y = v3.sty * this.canvas.height;

        this.ctx.beginPath();
        this.ctx.moveTo(v1x, v1y);
        this.ctx.lineTo(v2x, v2y);
        this.ctx.lineTo(v3x, v3y);
        this.ctx.closePath();

        this.ctx.lineWidth = 0.5;
        this.ctx.strokeStyle = 'red';
        this.ctx.stroke();

        const meanX = (v1x + v2x + v3x) / 3;
        const meanY = (v1y + v2y + v3y) / 3;
        this.ctx.fillStyle = "red";
        this.ctx.textAlign = "center";
        this.ctx.font = "10px Arial";

        this.ctx.fillText(faceNumber, meanX, meanY);

        //st order
        this.drawSTOrder(meanX, v1x, meanY, v1y, "a");
        this.drawSTOrder(meanX, v2x, meanY, v2y, "b");
        this.drawSTOrder(meanX, v3x, meanY, v3y, "c");
    }

    drawSTOrder(x1, x2, y1, y2, label)
    {
        this.ctx.fillStyle = "orange";
        this.ctx.font = "9px Arial";

        const meanX = (x1 + x2) / 2;
        const meanY = (y1 + y2) / 2;
        
        this.ctx.fillText(label, meanX, meanY);
    }

};