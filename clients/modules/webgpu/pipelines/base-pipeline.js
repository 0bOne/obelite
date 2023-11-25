
const shaderModules = {};

export default class BasePipeline {
    
    device;
    dimensions;
    canvasFormat
    pipe;

    constructor(device, dimensions, canvasFormat) {
        this.device = device;
        this.dimensions = dimensions;
        this.canvasFormat = canvasFormat;
    }

    async LoadShaderModule(shaderFileName) {
        if (!shaderModules[shaderFileName]) {
            const shaderResponse = await fetch(import.meta.url + "/../shaders/" + shaderFileName + ".wgsl");
            const shaderText = await shaderResponse.text();
            shaderModules[shaderFileName] = this.device.createShaderModule({code: shaderText, label: shaderFileName});
        }
        return shaderModules[shaderFileName];
    }

    async Initialize(canvasFormat) {
        throw "not implemented";
    }
    
}