const INPUT_EXPRESSION =   /(attribute|uniform)\s+[a-zA-Z0-9]+\s+[a-zA-Z]+/g;
const ALLOWED_NAMES = ["uniform", "attribute"];

export default class Loader
{
    static async LoadSources(name, options = {vertex: true, fragment: true})
    {
        const sources = {
            name: name,
            attributes: [],
            uniforms: []
        };

        const folderPath = $g.dataPath + "/shaders/" + name + "/";

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
    static async loadGLSL(url)
    {
        const response = await fetch(url);
        const values = {
            url: url,
            text: await response.text()
        };
        //console.log("loaded glsl source " + url);
        return values;
    }

    static setInputNames(sources, text)
    {
        //parse the input names, typically only in the vertex shader, for access from JS
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

    static CreateProgram(sources)
    {
        const program = $gl.createProgram();

        if (sources.vertex)
        {
            const shader = this.createShader($gl.VERTEX_SHADER, sources.vertex);
            $gl.attachShader(program, shader);
        }

        if (sources.fragment)
        {
            const shader = this.createShader($gl.FRAGMENT_SHADER, sources.fragment);
            $gl.attachShader(program, shader);          
        }
        $gl.linkProgram(program);
        //console.error($gl.getProgramInfoLog(program));                   
        return this.getProgramInfo(program, sources);
    }

    static getProgramInfo(program, sources)
    {
        const info = {
            id: sources.name,
            program: program,
            locations: {},
        };

        sources.attributes.forEach(name => {
            info.locations[name] = $gl.getAttribLocation(program, name);
        });

        sources.uniforms.forEach(name => {
            info.locations[name] = $gl.getUniformLocation(program, name);
        });

        return info;
    }

    static createShader(type, source)
    {
        const shader = $gl.createShader(type);
        $gl.shaderSource(shader, source.text);
        $gl.compileShader(shader);
    
        if (!$gl.getShaderParameter(shader, $gl.COMPILE_STATUS)) 
        {
            console.error('An error occurred compiling the shader');
            console.error('    from: ' + source.url);
            //console.error('    code:');
            //console.error(source.text);
            console.error('    compiler log:');                   
            console.error($gl.getShaderInfoLog(shader));                   
            $gl.deleteShader(shader);
            return null;
        }
        else
        {
            //console.info("Shader program compiled ok");                   
        }  
        return shader;
    }
};
