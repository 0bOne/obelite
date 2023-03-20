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
        }

        if (options.fragment === true)
        {
            sources.fragment = await this.loadGLSL(folderPath + "fragment.glsl");
        }   

        //catch any inputs that are predefined in the options    
        const definedInputs = options.inputs || [];
        definedInputs.forEach(inputName => {
            if (inputName.startsWith("u"))
            {
                sources.uniforms.push(inputName);
            }
            else if (inputName.startsWith("a"))
            {
                sources.attributes.push(inputName);
            }
        });

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

        if (this.gl.getProgramParameter(program, this.gl.LINK_STATUS) === false) 
        {
            console.error('An error occurred linking the shader');
            console.error('    name: ' + sources.name);
            console.error('    link log:');                   
            console.error(this.gl.getProgramInfoLog(program));                   
        }

        return this.getProgramInfo(program, sources);
    }

    getProgramInfo(program, sources)
    {
        const info = {
            id: sources.name,
            program: program,
            locations: {},
        };

        // add attributes locations
        let count = this.gl.getProgramParameter(program, this.gl.ACTIVE_ATTRIBUTES);
        for(let i = 0; i < count; ++i)
        {
            let attr = this.gl.getActiveAttrib(program, i); // return WebGLActiveInfo
            info.locations[attr.name] = this.gl.getAttribLocation(program, attr.name);
            //log("ATTRIBUTE: " + info.name + " = " + program.attribute[info.name]);
        }

        count = this.gl.getProgramParameter(program, this.gl.ACTIVE_UNIFORMS);
        for(let i = 0; i < count; ++i)
        {
            let uniform = this.gl.getActiveUniform(program, i); // return WebGLActiveInfo
            if (uniform.name.indexOf(".") === -1)
            {
                info.locations[uniform.name] = this.gl.getUniformLocation(program, uniform.name);
            }
            else
            {
                debugger; //its a struct and needs special handling
                //see http://www.songho.ca/glsl/files/js/webglUtils.js
            }
            //log("ATTRIBUTE: " + info.name + " = " + program.attribute[info.name]);
        }

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
