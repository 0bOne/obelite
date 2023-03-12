export default class GlInterceptor {

    static ObserveFunctions(gl) {
        const lookups = {};
        const exclusions = "createProgram;compileShader;createShader;shaderSource;attachShader;linkProgram;deleteShader".split(";");
        for (let name in gl) {
            const prop = gl[name];
            if (typeof prop === "function"
                && name.startsWith("get") === false
                && exclusions.indexOf(name) === -1) {
                const origProp = prop;
                gl[name] = (...args) => { // (C)
                    functionOberver(lookups, name, args); // (D)
                    return Reflect.apply(origProp, gl, args); // (E)
                }
            }
            else if (name === name.toUpperCase() && typeof prop === "number") {
                const value = gl[name];
                lookups[value] = lookups[value] || "";
                lookups[value] += " " + name;
            }
        }
    }
}

function functionOberver(lookups, name, args) {
    const funcsWithEnums = {
        activeTexture: [0],
        bindTexture: [0],
        disable: [0],
        enable: [0],
        bindBuffer: [0],
        vertexAttribPointer: [2],
        drawArrays: [0],
        texParameteri: [0, 1, 2],
        texParameterf: [0, 1, 2],
        pixelStorei: [0, 1],
        generateMipmap: [0],
        texStorage2D: [0, 2],
        texSubImage2D: [0, 4, 5]
    };

    let displayArgs = [...args];

    const enumPositions = funcsWithEnums[name];
    if (Array.isArray(enumPositions)) {
        enumPositions.forEach(enumPosition => {
            const label = lookups[displayArgs[enumPosition]] || "??";
            //if (label === "??") debugger;
            displayArgs[enumPosition] = displayArgs[enumPosition] + "(" + label.trim() + ")";
        });
    }

    console.log("gl::" + name, "with args", displayArgs);
    //debugger;
}