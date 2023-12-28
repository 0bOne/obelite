import BaseMesh from "./base-mesh.js";

const VERTICES = new Float32Array([
	// front
	-1, -1,  1,  
		1, -1,  1,  
		1,  1,  1,
		1,  1,  1,
	-1,  1,  1,
	-1, -1,  1,

	// right
		1, -1,  1,
		1, -1, -1,
		1,  1, -1,
		1,  1, -1,
		1,  1,  1,
		1, -1,  1,

	// back
	-1, -1, -1,
	-1,  1, -1,
	1,  1, -1,
	1,  1, -1,
	1, -1, -1,
	-1, -1, -1,

	// left
	-1, -1,  1,
	-1,  1,  1,
	-1,  1, -1,
	-1,  1, -1,
	-1, -1, -1,
	-1, -1,  1,

	// top
	-1,  1,  1,
	1,  1,  1,
	1,  1, -1,
	1,  1, -1,
	-1,  1, -1,
	-1,  1,  1,

	// bottom
	-1, -1,  1,
	-1, -1, -1,
	1, -1, -1,
	1, -1, -1,
	1, -1,  1,
	-1, -1,  1
]);

const COLORS = new Float32Array([
	// front - blue
	0, 0, 1,
	0, 0, 1,
	0, 0, 1,
	0, 0, 1,
	0, 0, 1,
	0, 0, 1,

	// right - red
	1, 0, 0,
	1, 0, 0,
	1, 0, 0,
	1, 0, 0,
	1, 0, 0,
	1, 0, 0,

	//back - yellow
	1, 1, 0,
	1, 1, 0,
	1, 1, 0,
	1, 1, 0,
	1, 1, 0,
	1, 1, 0,

	//left - aqua
	0, 1, 1,
	0, 1, 1,
	0, 1, 1,
	0, 1, 1,
	0, 1, 1,
	0, 1, 1,

	// top - green
	0, 1, 0,
	0, 1, 0,
	0, 1, 0,
	0, 1, 0,
	0, 1, 0,
	0, 1, 0,

	// bottom - fuchsia
	1, 0, 1,
	1, 0, 1,
	1, 0, 1,
	1, 0, 1,
	1, 0, 1,
	1, 0, 1
]);

const METADATA = {
	name: "cube",
	pipeline: "colored-mesh", 
	description: "cube geometry definition"
};

export default class CubeMesh extends BaseMesh {
    constructor() {
		super();
		this.metadata = METADATA;
		this.vertices = VERTICES;
		this.colors = COLORS;
	}
}