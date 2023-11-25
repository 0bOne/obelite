import El from "../lessel/el.js";

const pipelines = {};


export default class WebGPUCanvas extends El { 

    device;
    canvasFormat;

    constructor(el) {
        super(el);
        if (!window.gpuContext?.device) {
            throw "gpu device not found or not initialized";
        }
        this.device = window.gpuContext.device;

        this.resizeObserver = new ResizeObserver(this.onResize.bind(this));
        this.resizeObserver.observe(this.el.parentElement);
        this.syncSize();
    }

    async onResize() {
        await this.syncSize();
        //await this.Draw();
    }

    async syncSize() {
        //console.log("resized");
        const containerRect = this.el.parentElement.getBoundingClientRect();
        this.el.setAttribute("width", containerRect.width);
        this.el.setAttribute("height", containerRect.height);
    }

    async Set(definition) {
        definition.tag = "canvas";
        await super.Set(definition);
        await this.SetGPU(definition.gpu);
    }

    async SetGPU(gpuDef = {}) {
        this.context = this.el.getContext("webgpu");
        this.canvasFormat = navigator.gpu.getPreferredCanvasFormat();

        this.context.configure({
            device: this.device,
            format: this.canvasFormat
        });
    }

    async getPipeline(name) {
        if (!pipelines[name]) {
            //not cached so import...
            const pipelineCodeUrl = "./pipelines/" + name + ".js";
            const pipelineClass = await import(pipelineCodeUrl);
            pipelines[name] = new pipelineClass.default(this.device, this.canvasFormat);
            await pipelines[name].Initialize(this.canvasFormat);
        }
        return pipelines[name];
    }

    async Prepare(arrays) {       
        this.renderPipeline = await this.getPipeline(arrays.metadata.pipeline);
        this.renderPipeline.CreateBuffers(arrays);
        this.renderPipeline.WriteBuffers(arrays);
    }

    async Draw(encoder) {
        const view = this.context.getCurrentTexture().createView();
        this.renderPipeline.EncodePass(encoder, view);
    }
};
