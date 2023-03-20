#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
#else
    precision mediump float;
#endif

uniform sampler2D uSampler;

//const vec4 lightPosition = vec4(0.0, 0.0, 1.0, 0);             // should be on the eye space
const vec4 lightColor = vec4(1.0, 1.0, 1.0, 1.0);
const bool lightEnabled = true;

const bool textureEnabled = false;
const vec4 materialSpecular = vec4(0.2, 0.2, 0.2, 1);          // material specular color
const float materialShininess = 128.0;        // material specular exponent

// varying variables
varying vec4 ambient;
varying vec4 diffuse;
varying vec4 normalVec;
varying vec3 lightVec;
varying vec3 halfVec;
varying vec2 texCoord0;


void main(void) 
{

	bool textureEnabled = true;

    if(!lightEnabled)
    {
        if(textureEnabled)
            gl_FragColor = texture2D(uSampler, texCoord0) * diffuse;
        else
            gl_FragColor = diffuse;
        return;
    }

    // re-normalize varying vars and store them as local vars
    vec3 normal = normalize(normalVec.xyz);
    vec3 halfv = normalize(halfVec);
    vec3 light = normalize(lightVec);

    // compute attenuations for positional light
    float dotNL = max(dot(normal, light), 0.0);
    float dotNH = max(dot(normal, halfv), 0.0);
    //float dotNH = dot(normal, halfv);

    // compute attenuation factor: 1 / (k0 + k1 * d + k2 * (d*d))
    /*
    float attFactor = 1.0;
    attFactor = 1.0 / (lightAttenuations[0] +
                       lightAttenuations[1] * lightDistance +
                       lightAttenuations[2] * lightDistance * lightDistance);
    */

    // start with ambient
    vec3 color = ambient.xyz;

    // add diffuse
    color += dotNL * diffuse.xyz;

    // apply texturing before specular
    if(textureEnabled)
    {
        vec4 texel = texture2D(uSampler, texCoord0);
        color *= texel.rgb;     // modulate
    }

    // add specular
    color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

    // add attenuation
    //color *= attFactor;

    //@@gl_FragColor = vec4(color.rgb, diffuse.a * texel.a);
    gl_FragColor = vec4(color, diffuse.a);  // keep alpha as original material has

    /*
    if(attFactor > 0.0)
    {
        // add diffuse
        color += dotNL * diffuse.xyz;

        // apply texturing before specular
        //@@vec4 texel = texture2D(map0, texCoord);
        //@@color *= texel.rgb;     // modulate

        // add specular
        if(dotNH > 0.0)
            color += pow(dotNH, materialShininess) * materialSpecular.xyz * lightColor.xyz;

        // add attenuation
        if(attFactor < 1.0)
            color *= attFactor;

        //@@gl_FragColor = vec4(color.rgb, diffuse.a * texel.a);
        gl_FragColor = vec4(color, diffuse.a);  // keep alpha as original material has
    }
    */
}