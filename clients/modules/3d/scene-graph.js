import Matrix4f from "../webgpu/math/matrix4f.js";

export default class SceneGraph {

    keyHandler;
    gpuContext;
    camera;
    node;

    constructor(gpuContext) {
        this.gpuContext = gpuContext;
        this.camera = new Camera();
    }

    async AddNode(geometryUrl) {
        const node = new SceneNode(this.gpuContext);
        await node.initialize(geometryUrl);
        this.keyHandler = new MoveRotateKeys(node);
        this.node = node;
    }

    Draw() {

        const r = this.gpuContext.canvasWrapper.containerRect;
        this.camera.Set(r.width/r.height);

        const encoder = this.gpuContext.device.createCommandEncoder();
        this.node.Draw(this.camera, encoder);
        const commandBuffer = encoder.finish();
        this.gpuContext.device.queue.submit([commandBuffer]);
    }

    onKeyUp(event) {
        let changed = false;
        if (this.keyHandler) {
            changed = this.keyHandler.onKeyUp(event);
        }
        return changed;
    }
}

class Camera  {

    aspectRatio;
    cameraPosition;
    lookDirection;
    upDirection;

    constructor() {
        this.Set();
    }

    Set (aspectRatio = 1.0, cameraPosition, lookDirection, upDirection) {
        this.aspectRatio = aspectRatio || 1.0;
        this.cameraPosition = cameraPosition || [0,-1,3];
        this.lookDirection = lookDirection || [0,-1,0];
        this.upDirection = upDirection || [0,1,0]

		this.projectionMatrix = Matrix4f.Perspective(2 * Math.PI/5, this.aspectRatio, 0.1, 100.0);   
		this.viewMatrix = Matrix4f.LookAt(this.cameraPosition, this.lookDirection, this.upDirection);
		this.viewProjectionMatrix = Matrix4f.Multiply(this.projectionMatrix, this.viewMatrix);

        return this;
	};
}

class SceneNode {

    static pipelines = {};

    gpuContext;
    geometry;
    pipeline;

    translation;
    scaling;
    rotation;
    modelMatrix;

    constructor(gpuContext) {

    
        this.gpuContext = gpuContext;
    }

    async initialize(meshUrl){
        const meshModule = await import(meshUrl);
        //const MeshClass = meshModule.default; 
        //this.geometry = new MeshClass();
        this.geometry = meshModule.default;
        this.modelMatrix = new Matrix4f(null, "model:" + this.geometry.metadata.name);

        this.translation = [0, 0, 0];
        this.scaling = [1, 1, 1];
        this.rotation = [0, 0, 0];
        //this.setModelMatrix();

        await this.loadPipeline(this.geometry.metadata.pipeline);
        this.pipeline.CreateBuffers(this);
    }

    setModelMatrix() {
		const rotateXMat = Matrix4f.RotateX(this.rotation[0]);
		const rotateYMat = Matrix4f.RotateY(this.rotation[1]);
		const rotateZMat = Matrix4f.RotateZ(this.rotation[2]);
		const translateMat = Matrix4f.Translate(this.translation);
		const scaleMat = Matrix4f.Scale(this.scaling);
	
		//combine all transformation matrices together to form a final transform matrix: modelMat
		Matrix4f.Multiply(rotateXMat, scaleMat, );

		Matrix4f.Multiply(rotateYMat, this.modelMatrix, this.modelMatrix);        
		Matrix4f.Multiply(rotateZMat, this.modelMatrix, this.modelMatrix);        
		this.modelMatrix.multiply(translateMat);
	};

    scale (change) {
        this.scaling += change; 
        const scaleMat = Matrix4f.Scale(this.scaling);
        this.modelMatrix.multiply(scaleMat);
    }

    rotate(changes) {
        if (changes[0]) {
            const rotateXMat = Matrix4f.RotateX(changes[0]);
            this.modelMatrix.multiply(rotateXMat);
        }
        if (changes[1]) {
            const rotateYMat = Matrix4f.RotateY(changes[1]);
            this.modelMatrix.multiply(rotateYMat);
        }
        if (changes[2]) {
            const rotateZMat = Matrix4f.RotateZ(changes[2]);
            this.modelMatrix.multiply(rotateZMat);
        }
    }

    move(translation) {
        const translateMat = Matrix4f.Translate(translation);
        this.modelMatrix.multiply(translateMat);
    }


    async loadPipeline(name) {
        if (!SceneNode.pipelines[name]) {
            //not cached so import...
            const pipelineCodeUrl = "../webgpu/pipelines/" + name + ".js";
            const pipelineModule = await import(pipelineCodeUrl);
            const pipelinClass = pipelineModule.default;
            SceneNode.pipelines[name] = new pipelinClass(this.gpuContext);
            await SceneNode.pipelines[name].Initialize();
        }
        this.pipeline = SceneNode.pipelines[name];
    }

    Draw(camera, encoder) {
        this.pipeline.WriteBuffers(camera, this);
        this.pipeline.EncodePass(encoder);
    }
}


class MoveRotateKeys {

    constructor(sceneNode) {
        this.sceneNode = sceneNode;
    }

    onKeyUp(event) {
        let changed = false;

        const turnAmount = 0.2;
        const moveAmount = 1;
        const defaultMap = {
            ArrowUp: {turn: [-turnAmount, 0, 0]},  //rotate up
            ArrowDown: {turn: [turnAmount, 0, 0]}, //rotate down 
            ArrowLeft: {turn: [0, -turnAmount, 0]}, //rotate leftwards
            ArrowRight: {turn: [0, turnAmount, 0]} //rotate rightwards
        };

        const shiftKeyMap = {
            ArrowUp: {move: [0, -moveAmount, 0]},   //move up
            ArrowDown: {move: [0, moveAmount, 0 ]}, //move down
            ArrowLeft: {move: [-moveAmount, 0, 0]}, //move left
            ArrowRight: {move: [moveAmount, 0, 0]}, //move right
        };

        const ctlKeyMap = {
            ArrowUp: {move: [0, 0, -moveAmount]},     //move forwards
            ArrowDown: {move: [0, 0, moveAmount]},  //move backwards
            ArrowLeft: {turn: [0, 0, -turnAmount]},  //rotate ccw
            ArrowRight: {turn: [0, 0, turnAmount]},  //roate cw
        }

        let deltaMap;

        if (event.altKey) {
            //nothing yet
        } else if (event.shiftKey) {
            deltaMap = shiftKeyMap;
        } else if (event.ctrlKey) {
            deltaMap = ctlKeyMap;
        } else  { //no additional key 
            deltaMap = defaultMap;
        }

        if (deltaMap) {
            const changes = deltaMap[event.code] || {};
            if (changes.move) {
                this.sceneNode.move(changes.move);
                //this.sceneNode.translation[0] += changes.move[0];
                //this.sceneNode.translation[1] += changes.move[1];
                //this.sceneNode.translation[2] += changes.move[2];
                changed = true;
            }
            if (changes.turn) {
                this.sceneNode.rotate(changes.turn);
                //this.sceneNode.rotation[0] += changes.turn[0];
                //this.sceneNode.rotation[1] += changes.turn[1];
                //this.sceneNode.rotation[2] += changes.turn[2];
                changed = true;
            }
        }


        return changed;
    }
}