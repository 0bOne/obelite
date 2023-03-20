// per-vertex lighting with a directional light source

// vertex attributes
attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

// uniforms
uniform mat4 uNormalMatrix;
uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

const vec4 lightPosition = vec4(0.0, 0.0, 1.0, 0);             // should be on the eye space
const vec4 lightColor = vec4(1.0, 1.0, 1.0, 1.0);
const bool lightEnabled = true;

const vec4 materialAmbient = vec4(0.2, 0.2, 0.2, 1.0);           // material ambient color
const vec4 materialDiffuse = vec4(0.7, 0.7, 0.7, 1);           // material diffuse color

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying float lightDistance;
varying vec2 texCoord0;

void main(void)
{
    // transform vertex position to clip space
	vec3 transformed = vec3( aVertexPosition );
	vec4 mvPosition = vec4( transformed, 1.0 );
	mvPosition = uModelViewMatrix * mvPosition;
	gl_Position = uProjectionMatrix * mvPosition;

    if(!lightEnabled)
    {
        diffuse = materialDiffuse;
        return;
    }

    ambient = materialAmbient;
    diffuse = materialDiffuse * lightColor;

    // directional
    if(lightPosition.w == 0.0)
    {
        lightVec = lightPosition.xyz;   // assume lightPosition is normalized
        lightDistance = -1.0;           // negative for directional
    }
    // positional
    else
    {
        // transform vertex pos to eye space
        vec4 eyeVertexVec = uModelViewMatrix * vec4(aVertexPosition, 1.0);

        // compute light vector and distance for positional
        lightVec = lightPosition.xyz - eyeVertexVec.xyz;
        lightDistance = sqrt(dot(lightVec, lightVec));
        lightVec = normalize(lightVec);
    }

    // transform the normal vector from object space to eye space
    // assume vertexNormal was already normalized.
    normalVec = uNormalMatrix * vec4(aVertexNormal, 1.0);

    // compute half vector
    halfVec = normalize(lightVec + vec3(0,0,1));

    // pass texture coord
    texCoord0 = aTextureCoord;
}