import El from "../lessel/el.js";

const pipelines = {};

export default class WebGPUCanvas extends El { 

    gpuContext;
    textureView;

    constructor(el) {
        super(el);
        this.resizeObserver = new ResizeObserver(this.onResize.bind(this));
        this.resizeObserver.observe(this.el.parentElement);
        this.syncSize();
    }

    async onResize() {
        await this.syncSize();
    }

    async Set(definition) {
        definition.tag = "canvas";
        await super.Set(definition);
    }

    async Configure(gpuContext) {
        this.gpuContext = gpuContext;
        this.canvasContext = this.el.getContext("webgpu");
        gpuContext.canvasWrapper = this;

        this.canvasContext.configure({
            device: this.gpuContext.device,
            format: this.gpuContext.canvasFormat
        });


    }

    async syncSize() {
        //console.log("resized");
        this.containerRect = this.el.parentElement.getBoundingClientRect();
        this.el.setAttribute("width", this.containerRect.width);
        this.el.setAttribute("height", this.containerRect.height);
    }

};

