import ShaderLoader from "./shader-loader.js";

export default class ShaderCache
{
    shaders;

    constructor(gl, dataPath)
    {
        this.gl = gl;
        this.dataPath = dataPath;
        this.shaders = {};
        this.shaderLoader = new ShaderLoader(this.gl, this.dataPath);
    }

    async Get(name, options)
    {
        let programInfo = this.shaders[name];
        if (programInfo === undefined || programInfo === null)
        {
            const sources = await this.shaderLoader.LoadSources(name, options); 
            programInfo = this.shaderLoader.CreateProgram(sources);
            this.shaders[name] = programInfo;
        }
        return programInfo
    }
}