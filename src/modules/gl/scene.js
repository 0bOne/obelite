import SquareMatrix from "../math/square-matrix.js";

const DEFAULT_MATERIAL_AMBIENT_COLOR = [0.0, 0.0, 0.4, 1.0];
const DEFAULT_MATERIAL_DIFFUSE_COLOR = [0.0, 0.0, 0.4, 1.0];
const DEFAULT_MATERIAL_EMISSION_COLOR = [0.4, 0.1, 0.1, 1.0];

export default class Scene 
{

    gl;
    gameCtx;
    models;
    camera;

    constructor(gameCtx) 
    {
        this.sceneHeight = 0;
        this.sceneWidth = 0;
        this.frameNumber = 0;
        this.gl = gameCtx.gl;
        this.gameCtx = gameCtx;
        this.models = [];
        this.gl.clearColor(0.0, 0.0, 0.0, 1.0); // Clear to black, fully opaque
        this.gl.clearDepth(1.0); // Clear everything
        this.gl.enable(this.gl.DEPTH_TEST); // Enable depth testing
        this.gl.depthFunc(this.gl.LEQUAL); // Near things obscure far things
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);

    }

    checkCameraMatrix()
    {
        if (this.sceneWidth !== this.gl.canvas.clientWidth || this.sceneHeight !== this.gl.canvas.clientHeight)
        {
            this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
            this.sceneWidth = this.gl.canvas.clientWidth;
            this.sceneHeight = this.gl.canvas.clientHeight;
            const fieldOfView = (45 * Math.PI) / 180; // in radians
            const aspect = this.sceneWidth / this.sceneHeight;
            const zNear = 0.1;
            const zFar = 100.0;

            this.projectionMatrix = new SquareMatrix(4);
            this.projectionMatrix.setPerspective(fieldOfView, aspect, zNear, zFar);
            this.viewMatrix = new SquareMatrix(4);
        }
    }

    Draw() 
    {
        this.checkCameraMatrix();
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.frameNumber++;
        this.models.forEach(model => {
            this.drawModel(model);
            if (model.subentities)
            {
                model.subentities.forEach(subModel => {
                    subModel.wireframe = model.wireframe;
                    this.drawModel(subModel);
                });
            }
        })
    }

    drawModel(model)
    {
        this.viewMatrix.clear();
        this.viewMatrix.setIdentity();
   
        this.viewMatrix.setTranslation(model.worldPosition);

        this.viewMatrix.setRotation(model.rotation.x, {x: 1, y: 0, z: 0});
        this.viewMatrix.setRotation(model.rotation.y, {x: 0, y: 1, z: 0});
        this.viewMatrix.setRotation(model.rotation.z, {x: 0, y: 0, z: 1});

        ///////////////////////////////////
        this.gl.useProgram(model.shader.program);
        ///////////////////////////////////

        model.attributes.forEach(attribute => {
            attribute.Set(model.shader);
        });

        this.gl.uniformMatrix4fv(model.shader.locations.uProjectionMatrix, false, this.projectionMatrix);
        this.gl.uniformMatrix4fv(model.shader.locations.uModelViewMatrix, false, this.viewMatrix);

        if (model.shader.locations.uNormalMatrix)
        {
            const normalMatrix = this.viewMatrix.clone();
            normalMatrix.setInverted(normalMatrix);
            normalMatrix.setTransposed(normalMatrix);            
            this.gl.uniformMatrix4fv(model.shader.locations.uNormalMatrix, false, normalMatrix);
        }

        model.attributes.forEach(attribute => {
            attribute.Position(model.shader, this.viewMatrix);
        });

        let tNumber = 0;
        model.textures.forEach(texture => {
            model.hasTextures = true;
            texture.SetSampler(model.shader, tNumber);
            texture.uniforms.forEach(uniform =>{
                uniform.set();
            });
            tNumber++;
        });

        const offset = 0;
        let DRAW_MODE = model.GL_DRAW_MODE || this.gl.TRIANGLES;
        DRAW_MODE = (model.wireframe === true) ? this.gl.LINES: DRAW_MODE;


        if (model.hasIndices === true) 
        {
            //shape has indices (therefore faces) so draw as triangles
            this.gl.drawElements(DRAW_MODE, model.vertices, this.gl.UNSIGNED_SHORT, offset);
        }
        else if (model.hasSTs === true) 
        {
            this.gl.drawArrays(DRAW_MODE, offset, model.vertices);
        }
        else
        {
            //no indices, so draw triangle strip
            this.gl.drawArrays(DRAW_MODE, offset, model.vertices);
        }
    }

    remove(model)
    {
        const i = this.models.indexOf(model);
        if (i > -1)
        {
            this.gl.useProgram(model.shader.program);
            this.models.splice(i, 1);

            model.attributes.forEach(attribute => {
                attribute.Dispose(model.shader);
            });

            let tNumber = 0;
            model.textures.forEach(texture => {
                texture.Dispose(model.shader, tNumber);
                tNumber++;
            });

        }
    }

    // setUniforms(locations, projectionMatrix, modelViewMatrix) 
    // {
    //     //always set these two:
    //     this.gl.uniformMatrix4fv(locations.uProjectionMatrix, false, projectionMatrix);
    //     this.gl.uniformMatrix4fv(locations.uModelViewMatrix, false, modelViewMatrix);

    //     // "no-textures-material" =
    //     // {
    //     //     emission_color = (0.4, 0.1, 0.1);
    //     //     specular_color = (0.1, 1.0, 0.1);
    //     //     shininess = 4;
    //     // };

    //     //return;

    //     this.conditionalSetUniform(locations.uGlobalAmbientLightColor, DEFAULT_AMBIENT_LIGHT_COLOR);
    //     this.conditionalSetUniform(locations.uLightSourceDiffuseColor, [1.0, 1.0, 1.0, 1.0]);
    //     this.conditionalSetUniform(locations.uLightSourceSpecularColor, [1.0, 1.0, 1.0, 1.0]);
    //     this.conditionalSetUniform(locations.uLightVector, [0.85, 0.8, 0.75]);

    //     this.conditionalSetUniform(locations.uMaterialAmbientColor, DEFAULT_MATERIAL_AMBIENT_COLOR);
    //     this.conditionalSetUniform(locations.uMaterialDiffuseColor, DEFAULT_MATERIAL_DIFFUSE_COLOR);

    //     this.conditionalSetUniform(locations.uMaterialEmissionColor, DEFAULT_MATERIAL_EMISSION_COLOR);
    //     this.conditionalSetUniform(locations.uMaterialSpecularColor, DEFAULT_MATERIAL_SPECULAR_COLOR);

    //     // "Hull" =  (cobra 3)
    //     //TODO: pull these from texture yaml
    //     // { 
    //     //     diffuse_map = "oolite_cobra3_diffuse.png"; 
    //     //     specular_color = ( 0.25, 0.25, 0.25 );
    //     //     gloss = 0.622;
    //     //     shininess = 42; 
    //     //     emission_map = { name = "oolite_cobra3_diffuse.png"; extract_channel = "a"; }; 
    //     //     emission_modulate_color = (0.9926, 0.9686, 0.7325, 1.0);
    //     // };

    //     //this.conditionalSetUniform(locations.uMaterialSpecularColor, [0.25, 0.25, 0.25, 1.0]);
    // }

    // conditionalSetUniform(location, values) 
    // {
    //     //TODO: convert to attributes of the scene, camera, ship, etc.

    //     if (location) {
    //         switch (values.length) {
    //             case 4:
    //                 this.gl.uniform4f(location, ...values);
    //                 break;
    //             case 3:
    //                 this.gl.uniform3f(location, ...values);
    //                 break;
    //             case 2:
    //                 this.gl.uniform2f(location, ...values);
    //                 break;
    //             default:
    //                 console.error("unsupported number of uniform values");
    //         }
    //     }
    // }
}
