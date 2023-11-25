import BasePipeline from "./base-pipeline.js";

const shaderFileName = "red-square";
const dimensions = 2;

const  vertexBufferLayout = {
    arrayStride: dimensions * 4,
    attributes: [{
      format: "float32x" + dimensions,
      offset: 0,
      shaderLocation: 0, // Position in vertex shader
    }]
};

const vertices = new Float32Array([
    //   X,    Y,
      -0.8, -0.8, // Triangle 1 (Blue)
       0.8, -0.8,
       0.8,  0.8,
    
      -0.8, -0.8, // Triangle 2 (Red)
       0.8,  0.8,
      -0.8,  0.8,
]);

export default class RedSquare extends BasePipeline {
    constructor(device, canvasFormat) {
        super(device, dimensions, canvasFormat);
    }

    async Initialize(canvasFormat) {
        const shaderModule = await this.LoadShaderModule(shaderFileName);
        this.pipe = this.device.createRenderPipeline({
            label: shaderFileName,
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: [vertexBufferLayout]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [{
                    format: canvasFormat
                }]
            }
        });
    }

    CreateBuffers(arrays) {

        this.bufferOffset = 0;
        this.vertexCount = vertices.length / this.dimensions;

        this.vertexBuffer = this.device.createBuffer({
            label: arrays.metadata.name + " vertex buffer",
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

    }

    WriteBuffers(arrays) {
        this.device.queue.writeBuffer(this.vertexBuffer, this.bufferOffset, vertices);
    }

    EncodePass(encoder, viewTexture) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
               view: viewTexture,
               loadOp: "clear",
               clearValue: { r: 0.1, g: 0.1, b: 0.1, a: 1 },
               storeOp: "store",
            }]
        });
        pass.setPipeline(this.pipe);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertexCount);
        pass.end(); 
    }
}