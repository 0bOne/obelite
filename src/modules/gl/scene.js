const DEFAULT_AMBIENT_LIGHT_COLOR = [0.2, 0.2, 0.2, 1.0];
const DEFAULT_MATERIAL_AMBIENT_COLOR = [0.0, 0.0, 0.4, 1.0];
const DEFAULT_MATERIAL_DIFFUSE_COLOR = [0.0, 0.0, 0.4, 1.0];
const DEFAULT_MATERIAL_EMISSION_COLOR = [0.4, 0.1, 0.1, 1.0];
const DEFAULT_MATERIAL_SPECULAR_COLOR = [0.1, 1.0, 0.1, 1.0];


export default class Scene {

    shapes;

    constructor(gameCtx)
    {
        this.gl = gameCtx.gl;
        this.gameCtx = gameCtx;
        this.shapes = [];
    }
    
    Draw()
    {
        const shape = this.shapes[0];
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this.gl.clearDepth(1.0); // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
  
        // Clear the canvas before we start drawing on it.
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
  
        // Create a perspective matrix, a special matrix that is
        // used to simulate the distortion of perspective in a camera.
        // Our field of view is 45 degrees, with a width/height
        // ratio that matches the display size of the canvas
        // and we only want to see objects between 0.1 units
        // and 100 units away from the camera.  
        const fieldOfView = (45 * Math.PI) / 180; // in radians
        const aspect = this.gl.canvas.clientWidth / this.gl.canvas.clientHeight;
        const zNear = 0.1;
        const zFar = 100.0;

        const projectionMatrix = mat4.create();

        // note: glmatrix.js always has the first argument as the destination to receive the result.
        mat4.perspective(projectionMatrix, fieldOfView, aspect, zNear, zFar);
  
        // Set the drawing position to the "identity" point, which is the center of the scene.
        const modelViewMatrix = mat4.create();
  
        //Move the drawing position slightly.
        mat4.translate(
            modelViewMatrix,    // destination matrix
            modelViewMatrix,    // matrix to translate
            [-0.0, 0.0, -2.0]   // amount to translate
        ); 

        if (isFinite(shape.Rotation))
        {

            mat4.rotate(
                modelViewMatrix,    // destination matrix
                modelViewMatrix,    // matrix to rotate
                shape.Rotation,     // amount to rotate in radians
                [0, 0, 1]           // // axis to rotate around
            );

            if (shape.Dimensions === 3)
            {
                mat4.rotate(
                    modelViewMatrix,        // destination matrix
                    modelViewMatrix,        // matrix to rotate
                    shape.Rotation * 0.7,   // amount to rotate in radians
                    [0, 1, 0]               // axis to rotate around (Y)
                  ); 
                  mat4.rotate(
                    modelViewMatrix,        // destination matrix
                    modelViewMatrix,        // matrix to rotate
                    shape.Rotation * 0.3,   // amount to rotate in radians
                    [1, 0, 0]               // axis to rotate around (X)
                  ); 
            }
        }

        shape.attributes.forEach(attribute => {
            attribute.Set(shape.Shader);
        });
        
        ///////////////////////////////////
        this.gl.useProgram(shape.Shader.program);
        ///////////////////////////////////
  
        this.setUniforms(shape.Shader.locations, projectionMatrix, modelViewMatrix)

        shape.attributes.forEach(attribute => {
            attribute.Position(shape.Shader, modelViewMatrix);
        });

        let tNumber = 0;
        shape.textures.forEach(texture => {
            shape.hasTextures = true;
            texture.SetSampler(shape.Shader, tNumber);
            tNumber++;
        });

        const offset = 0;
        if (shape.hasIndices === true)
        {
            //shape has indices (therefore faces) so draw as triangles
            this.gl.drawElements(this.gl.TRIANGLES, shape.vertices, this.gl.UNSIGNED_SHORT, offset);
        }
        else if (shape.hasTextures === true)
        {
            this.gl.drawArrays(this.gl.TRIANGLES, offset, shape.vertices);
        }
        else 
        {
            //no indices, so draw triangle strip
            this.gl.drawArrays(this.gl.TRIANGLE_STRIP, offset, shape.vertices);
        }
    }

    setUniforms(locations, projectionMatrix, modelViewMatrix)
    {
        //always set these two:
        this.gl.uniformMatrix4fv(locations.uProjectionMatrix, false,projectionMatrix);   
        this.gl.uniformMatrix4fv(locations.uModelViewMatrix, false, modelViewMatrix);

                // "no-textures-material" =
        // {
        //     emission_color = (0.4, 0.1, 0.1);
        //     specular_color = (0.1, 1.0, 0.1);
        //     shininess = 4;
        // };

        this.conditionalSetUniform(locations.uGlobalAmbientLightColor, DEFAULT_AMBIENT_LIGHT_COLOR);
        this.conditionalSetUniform(locations.uLightSourceDiffuseColor, [1.0, 1.0, 1.0, 1.0]);
        this.conditionalSetUniform(locations.uLightSourceSpecularColor, [1.0, 1.0, 1.0, 1.0]);
        this.conditionalSetUniform(locations.uLightVector, [0.85, 0.8, 0.75]);
                
        this.conditionalSetUniform(locations.uMaterialAmbientColor, DEFAULT_MATERIAL_AMBIENT_COLOR);
        this.conditionalSetUniform(locations.uMaterialDiffuseColor, DEFAULT_MATERIAL_DIFFUSE_COLOR);
        
        this.conditionalSetUniform(locations.uMaterialEmissionColor, DEFAULT_MATERIAL_EMISSION_COLOR);
        this.conditionalSetUniform(locations.uMaterialSpecularColor, DEFAULT_MATERIAL_SPECULAR_COLOR);
        
        // "Hull" =  (cobra 3)
        //TODO: pull these from texture yaml
        // { 
        //     diffuse_map = "oolite_cobra3_diffuse.png"; 
        //     specular_color = ( 0.25, 0.25, 0.25 );
        //     gloss = 0.622;
        //     shininess = 42; 
        //     emission_map = { name = "oolite_cobra3_diffuse.png"; extract_channel = "a"; }; 
        //     emission_modulate_color = (0.9926, 0.9686, 0.7325, 1.0);
        // };
        
        this.conditionalSetUniform(locations.uMaterialSpecularColor, [0.25, 0.25, 0.25, 1.0]);
    }

    conditionalSetUniform(location, values)
    {
        //TODO: convert to attributes of the scene, camera, ship, etc.

        if (location)
        {
            switch(values.length)
            {
                case 4:
                    this.gl.uniform4f(location, ...values);
                    break;
                case 3:
                    this.gl.uniform3f(location, ...values);
                    break;
                case 2: 
                    this.gl.uniform2f(location, ...values);      
                    break;
                default: 
                    console.error("unsupported number of uniform values");
            }
        }
    }
}