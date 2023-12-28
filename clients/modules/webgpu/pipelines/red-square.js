import BasePipeline from "./base-pipeline.js";

const SHADER_FILE_NAME = "red-square";
const DIMENSIONS = 2;

const  VERTEX_BUFFER_LAYOUT = {
    arrayStride: DIMENSIONS * 4,
    attributes: [{
      format: "float32x" + DIMENSIONS,
      offset: 0,
      shaderLocation: 0, // Position in vertex shader
    }]
};

const VERTICES = new Float32Array([
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
        super(device, DIMENSIONS, canvasFormat);
    }

    async Initialize() {
        const shaderModule = await this.LoadShaderModule(SHADER_FILE_NAME);
        this.pipe = this.device.createRenderPipeline({
            label: SHADER_FILE_NAME,
            layout: "auto",
            vertex: {
                module: shaderModule,
                entryPoint: "vertexMain",
                buffers: [VERTEX_BUFFER_LAYOUT]
            },
            fragment: {
                module: shaderModule,
                entryPoint: "fragmentMain",
                targets: [{
                    format: this.canvasFormat
                }]
            }
        });
    }

    CreateBuffers(arrays) {
        this.bufferOffset = 0;
        this.vertexCount = VERTICES.length / this.dimensionality;

        this.vertexBuffer = this.device.createBuffer({
            label: arrays.metadata.name + " vertex buffer",
            size: VERTICES.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });
    }

    WriteBuffers(arrays) {
        this.device.queue.writeBuffer(this.vertexBuffer, this.bufferOffset, VERTICES);
    }

    EncodePass(encoder, viewTexture) {
        const pass = encoder.beginRenderPass({
            colorAttachments: [{
               view: viewTexture,
               loadOp: "clear",
               clearValue: {r: 0.1, g: 0.1, b: 0.1, a: 1},
               storeOp: "store",
            }]
        });
        pass.setPipeline(this.pipe);
        pass.setVertexBuffer(0, this.vertexBuffer);
        pass.draw(this.vertexCount);
        pass.end(); 
    }
}