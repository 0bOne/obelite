import ShaderLoader from "./shader-loader.js";

export default class ShaderCache
{
    shaders;

    constructor()
    {
        this.shaders = {};
    }

    async Get(name)
    {
        let programInfo = this.shaders[name];
        if (programInfo === undefined || programInfo === null)
        {
            const sources = await ShaderLoader.LoadSources(name); 
            programInfo = ShaderLoader.CreateProgram(sources);
            this.shaders[name] = programInfo;
        }
        return programInfo
    }
}