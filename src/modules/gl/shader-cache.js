import ShaderLoader from "./shader-loader.js";

export default class ShaderCache
{
    shaders;

    constructor(gameCtx)
    {
        this.gameCtx = gameCtx;
        this.gl = gameCtx.gl;
        this.shaders = {};
    }

    async Get(name, options)
    {
        const shaderLoader = new ShaderLoader(this.gameCtx);
        let programInfo = this.shaders[name];
        if (programInfo === undefined || programInfo === null)
        {
            const sources = await shaderLoader.LoadSources(name, options); 
            programInfo = shaderLoader.CreateProgram(sources);
            this.shaders[name] = programInfo;
        }
        return programInfo
    }
}