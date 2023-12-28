
const shaderModules = {};

export default class BasePipeline {
    
    gpuContext;
    pipe;

    constructor(gpuContext) {
        this.gpuContext = gpuContext;
    }

    async LoadShaderModule(shaderFileName) {
        if (!shaderModules[shaderFileName]) {
            const shaderResponse = await fetch(import.meta.url + "/../shaders/" + shaderFileName + ".wgsl");
            const shaderText = await shaderResponse.text();
            shaderModules[shaderFileName] = this.gpuContext.device.createShaderModule({code: shaderText, label: shaderFileName});
        }
        return shaderModules[shaderFileName];
    }

    async Initialize(canvasFormat) {
        throw "abstract method - no override";
    }

    createBuffer(data, usageFlag = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST) {
        const buffer = this.gpuContext.device.createBuffer({
            size: data.byteLength,
            usage: usageFlag,
            mappedAtCreation: true
        });
        new Float32Array(buffer.getMappedRange()).set(data);
        buffer.unmap();
        return buffer;
    };
    
}