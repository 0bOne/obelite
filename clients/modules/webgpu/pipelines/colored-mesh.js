import BasePipeline from "./base-pipeline.js";
import Matrix4f from "../math/matrix4f.js";

const SHADER_FILE_NAME = "colored-mesh";
const DIMENSIONS = 3;

export default class ColoredMeshPipeline extends BasePipeline {

    constructor(gpuContext) {
        super(gpuContext);
    }

	async Initialize() {

        const shaderModule = await this.LoadShaderModule(SHADER_FILE_NAME);
		this.pipe = this.gpuContext.device.createRenderPipeline({
			layout:'auto',
			vertex: {
				module: shaderModule,
				entryPoint: "vs_main",
				buffers:[ {
						arrayStride: 12,
						attributes: [{
							shaderLocation: 0,
							format: "float32x3",
							offset: 0
						}]
					}, {
						arrayStride: 12,
						attributes: [{
							shaderLocation: 1,
							format: "float32x3",
							offset: 0
						}]
					}
				]
			},
			fragment: {
				module: shaderModule,
				entryPoint: "fs_main",
				targets: [{
						format: this.gpuContext.canvasFormat
				}]
			},
			primitive:{
				topology: "triangle-list",
				//cullMode: 'back'
			},
			depthStencil:{
				format: "depth24plus",
				depthWriteEnabled: true,
				depthCompare: "less"
			}
		});
    }

	CreateBuffers(sceneNode) {

		this.uniformBuffer = this.gpuContext.device.createBuffer({
			size: 64,
			usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
		});

		this.uniformBindGroup = this.gpuContext.device.createBindGroup({
			layout: this.pipe.getBindGroupLayout(0),
			entries: [
				{
					binding: 0,
					resource: {
						buffer: this.uniformBuffer,
						offset: 0,
						size: 64
					}
				}
			]
		});

		this.vertexCount = sceneNode.geometry.vertices.length / DIMENSIONS;
		this.vertexBuffer = this.createBuffer(sceneNode.geometry.vertices);
		this.colorBuffer = this.createBuffer(sceneNode.geometry.colors);
	}

	WriteBuffers(camera, sceneNode) {
		const r = this.gpuContext.canvasWrapper.containerRect;

		this.depthTexture = this.gpuContext.device.createTexture({
			size: [r.width, r.height, 1],
			format: "depth24plus",
			usage: GPUTextureUsage.RENDER_ATTACHMENT
		});

		const mvpMatrix = Matrix4f.Multiply(camera.viewProjectionMatrix, sceneNode.modelMatrix);
		this.gpuContext.device.queue.writeBuffer(this.uniformBuffer, 0, mvpMatrix);
	}

	EncodePass(encoder) {

		//const textureView = this.gpuContext.canvasWrapper.canvasContext.getCurrentTexture().createView({label: "canvas texture"});
        const ctx = this.gpuContext.canvasWrapper.canvasContext;
        const tex = ctx.getCurrentTexture();
        const textureView = tex.createView({label: "canvas texture"});


		const renderPassDescription = {
			colorAttachments: [{
				view: textureView,
				clearValue: { r: 0.58, g: 0.259, b: 0.76, a: 1.0  }, //background color 0.588, 0.592, 0.765
				//9697c3
				loadOp: 'clear',
				storeOp: 'store'
			}],
			depthStencilAttachment: {
				view: this.depthTexture.createView({label: "depth stencil"}),
				depthLoadValue: 1.0,
				depthClearValue: 1.0,
				depthLoadOp: 'clear',
				depthStoreOp: "store"
			}
		}
		const renderPass = encoder.beginRenderPass(renderPassDescription);
		renderPass.setPipeline(this.pipe);
		renderPass.setVertexBuffer(0, this.vertexBuffer);
		renderPass.setVertexBuffer(1, this.colorBuffer);
		renderPass.setBindGroup(0, this.uniformBindGroup);
		renderPass.draw(this.vertexCount);
		renderPass.end();
    }
}