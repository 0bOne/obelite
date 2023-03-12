const INPUT_EXPRESSION =   /(attribute|uniform)\s+[a-zA-Z0-9]+\s+[a-zA-Z]+/g;
const ALLOWED_NAMES = ["uniform", "attribute"];

export default class Loader
{
    constructor(gameCtx)
    {
        this.gl = gameCtx.gl;
        this.shadersFolder = gameCtx.dataPath + "/shaders";
    }

    async LoadSources(name, options = {vertex: true, fragment: true})
    {
        const sources = {
            name: name,
            attributes: [],
            uniforms: []
        };

        const folderPath = this.shadersFolder + "/" + name + "/";

        if (options.vertex === true)
        {
            sources.vertex = await this.loadGLSL(folderPath + "vertex.glsl");
            this.setInputNames(sources, sources.vertex.text);
        }

        if (options.fragment === true)
        {
            sources.fragment = await this.loadGLSL(folderPath + "fragment.glsl");
            this.setInputNames(sources, sources.fragment.text);
        }   

        return sources;
    } 
    
    async loadGLSL(url)
    {
        const response = await fetch(url);
        const values = {
            url: url,
            text: await response.text()
        };
        //console.log("loaded glsl source " + url);
        return values;
    }

    setInputNames(sources, text)
    {
        //parse the input names (eg, uniforms and attributes) for access from JS
        const matches = text.match(INPUT_EXPRESSION) || [];
        matches.forEach(match => {
            const tokens = match.replace(";", "").trim().split("\t").join(" ").split(" ");
            let inputType = tokens[0];

            if (ALLOWED_NAMES.indexOf(inputType) > -1)
            {
                const inputName = tokens.pop();
                sources[inputType + "s"].push(inputName); 
                console.log("registering input " + inputName + "/" + inputType);
            }
        });
    }

    CreateProgram(sources)
    {
        const program = this.gl.createProgram();

        if (sources.vertex)
        {
            const shader = this.createShader(this.gl.VERTEX_SHADER, sources.vertex);
            this.gl.attachShader(program, shader);
        }

        if (sources.fragment)
        {
            const shader = this.createShader(this.gl.FRAGMENT_SHADER, sources.fragment);
            this.gl.attachShader(program, shader);          
        }
        this.gl.linkProgram(program);
        //console.error($gl.getProgramInfoLog(program));                   
        return this.getProgramInfo(program, sources);
    }

    getProgramInfo(program, sources)
    {
        const info = {
            id: sources.name,
            program: program,
            locations: {},
        };

        sources.attributes.forEach(name => {
            info.locations[name] = this.gl.getAttribLocation(program, name);
        });

        sources.uniforms.forEach(name => {
            info.locations[name] = this.gl.getUniformLocation(program, name);
        });

        return info;
    }

    createShader(type, source)
    {
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source.text);
        this.gl.compileShader(shader);
    
        if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) 
        {
            console.error('An error occurred compiling the shader');
            console.error('    from: ' + source.url);
            console.error('    compiler log:');                   
            console.error(this.gl.getShaderInfoLog(shader));                   
            this.gl.deleteShader(shader);
            return null;
        }
        return shader;
    }
};
