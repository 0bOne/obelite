//framgment shader for ships. see ./license.txt for gpl
precision highp float;

uniform vec4 uAmbientLightColor; //(0.2, 0.2, 0.2, 1.0)
uniform vec4 uLightSourceDiffuseColor; 
uniform vec4 uLightSourceSpecularColor;
uniform vec3 uLightVector;

uniform vec4 uMaterialAmbientColor;
uniform vec4 uMaterialDiffuseColor;
uniform vec4 uMaterialEmissionColor;
uniform vec4 uMaterialSpecularColor;

uniform float			uGloss;
uniform bool			uGammaCorrect;

//#define MULTIPLIER_LIGHTSRCRADIANCE	3.75  //TODO: modify uLightSourceDiffuseColor and uLightSourceSpecularColor outisde shader
#define MULITPLIER_PREEXPOSURE		2.484

//replaced: #define LIGHTSRC_RADIANCE_DIFFUSE	(gl_LightSource[1].diffuse * MULTIPLIER_LIGHTSRCRADIANCE)
//replaced: #define LIGHTSRC_RADIANCE_SPECULAR	(gl_LightSource[1].specular * MULTIPLIER_LIGHTSRCRADIANCE)
//replaced with uGlobalAmbientLightColor: #define LIGHTSRC_AMBIENT			(gl_LightModel.ambient)

#ifndef OOSTD_DIFFUSE_MAP
    #define OOSTD_DIFFUSE_MAP 0
#endif

#ifndef OOSTD_DIFFUSE_MAP_IS_CUBE_MAP
    #define OOSTD_DIFFUSE_MAP_IS_CUBE_MAP 0
#endif

#ifndef OOSTD_SPECULAR
    #define OOSTD_SPECULAR 1
    #undef OOSTD_SPECULAR_MAP
#endif

#ifndef OOSTD_SPECULAR_MAP
    #define OOSTD_SPECULAR_MAP 0
#endif

#ifndef OOSTD_NORMAL_MAP
    #define OOSTD_NORMAL_MAP 0
#endif

#ifndef OOSTD_NORMAL_AND_PARALLAX_MAP
    #define OOSTD_NORMAL_AND_PARALLAX_MAP 0
#endif

#ifndef OOSTD_EMISSION
    #define OOSTD_EMISSION 1
#endif

#ifndef OOSTD_EMISSION_MAP
    #define OOSTD_EMISSION_MAP 0
#endif

#ifndef OOSTD_ILLUMINATION_MAP
    #define OOSTD_ILLUMINATION_MAP 0
#endif

#ifndef OOSTD_EMISSION_AND_ILLUMINATION_MAP
    #define OOSTD_EMISSION_AND_ILLUMINATION_MAP 0
#endif

#if OOSTD_EMISSION_AND_ILLUMINATION_MAP && !OOSTD_EMISSION_MAP
    #undef OOSTD_EMISSION_MAP
    #define OOSTD_EMISSION_MAP 1
#endif

#if OOSTD_EMISSION_AND_ILLUMINATION_MAP && OOSTD_ILLUMINATION_MAP
    #undef OOSTD_EMISSION_AND_ILLUMINATION_MAP
    #define OOSTD_EMISSION_AND_ILLUMINATION_MAP 0
#endif

#if OOSTD_NORMAL_AND_PARALLAX_MAP && !OOSTD_NORMAL_MAP
    #undef OOSTD_NORMAL_AND_PARALLAX_MAP
    #define OOSTD_NORMAL_AND_PARALLAX_MAP 0
#endif

// Diffuse model selection - if 0, then Lambert is selected
#define OODIFFUSE_ORENNAYAR			1
//#define NEED_EYE_VECTOR (OOSTD_SPECULAR || OOSTD_NORMAL_AND_PARALLAX_MAP || OODIFFUSE_ORENNAYAR)
#define HAVE_ILLUMINATION (OOSTD_EMISSION_AND_ILLUMINATION_MAP || OOSTD_ILLUMINATION_MAP)


//#if NEED_EYE_VECTOR
    varying vec3		vEyeVector;
//#endif

varying vec2			vTexCoord;
//TODO: figure out the issue with this: varying vec3			vLight1Vector;

#if OOSTD_DIFFUSE_MAP
    #if !OOSTD_DIFFUSE_MAP_IS_CUBE_MAP
        // Standard 2D diffuse map
        uniform sampler2D		uDiffuseMap;
    #else
        // Cube diffuse map
        uniform samplerCube		uDiffuseMap;
        varying vec3			vCubeTexCoords;
    #endif
#endif

#if OOSTD_SPECULAR_MAP
    uniform sampler2D		uSpecularMap;
#endif

#if OOSTD_EMISSION_MAP
    uniform sampler2D		uEmissionMap;
#endif

#if OOSTD_ILLUMINATION_MAP
    uniform sampler2D		uIlluminationMap;
#endif

#if OOSTD_NORMAL_MAP
    uniform sampler2D		uNormalMap;
#endif

#if OOSTD_NORMAL_AND_PARALLAX_MAP
    uniform float			uParallaxScale;
    uniform float			uParallaxBias;
#endif


#ifndef OOSPECULAR_NEW_MODEL
    #define OOSPECULAR_NEW_MODEL		1
    #ifndef OOSPECULAR_NEW_MODEL_GGX
        #define OOSPECULAR_NEW_MODEL_GGX	1
    #endif
#endif

#ifndef OOSRGB_TO_LINEAR
    #define OOSRGB_TO_LINEAR			2.2
#endif

#ifndef OOLINEAR_TO_SRGB
    #define OOLINEAR_TO_SRGB			(1.0 / 2.2)
#endif

#if OODIFFUSE_ORENNAYAR
    // based on https://www.shadertoy.com/view/ltfyD8
    float diffuseOrenNayar(
            vec3 lightVector, 
            vec3 eyeVector, 
            vec3 normal, 
            float gloss, 
            float albedoFactor)
    {
        float NdotL = dot(lightVector, normal);
        float NdotV = dot(normal, eyeVector);
        float roughness = 1.0 - gloss;
        float sigma2 = roughness * roughness;
        float A = 1.0 - 0.5 * (sigma2 / (((sigma2 + 0.33) + 0.000001)));
        float B = 0.45 * sigma2 / ((sigma2 + 0.09) + 0.00001);
        float ga = dot(eyeVector - normal * NdotV, lightVector - normal * NdotL);
        
        return albedoFactor * max(0.0, NdotL) 
            * (A + B * max(0.0, ga) 
            * sqrt(max((1.0 - NdotV * NdotV) 
            * (1.0 - NdotL * NdotL), 0.0)) / max(NdotL, NdotV));
    }
#endif

vec3 CalcDiffuseLight(
        in vec3 lightVector, 
        in vec3 normal, 
        in vec3 lightColor)
{
    #if OOSTD_NORMAL_MAP
        float intensity = dot(normal, lightVector);
    #else
        // dot(v, (0,0,1)) is v.x*0 + v.y*0 + v.z*1 = v.z
        float intensity = lightVector.z;
    #endif
        intensity = max(intensity, 0.0);
        return lightColor * intensity;
}


vec4 CalcSpecularLight(
            in vec3 lightVector, 
            in vec3 eyeVector, 
            in float exponent, 
            in vec3 normal, 
            in vec4 lightColor)
{
    #if OOSTD_NORMAL_MAP
        vec3 reflection = -reflect(lightVector, normal);
    #else
        /*	reflect(I, N) is defined as I - 2 * dot(N, I) * N
            If N is (0,0,1), this becomes (I.x,I.y,-I.z).
            Note that we want it negated as per above. */
        vec3 reflection = vec3(-lightVector.x, -lightVector.y, lightVector.z);
    #endif
    
    float intensity = dot(reflection, eyeVector);
    intensity = pow(max(intensity, 0.0), exponent);
    return lightColor * intensity;
}


// More physically accurate specular lighting models
// This is based on the GLSL code from FS2 SCP ( https://github.com/scp-fs2open )
vec3 FresnelSchlick(vec3 specColor, 
                            vec3 light, 
                            vec3 halfVec)
{
	return specColor + (vec3(1.0) - specColor) * pow(1.0 - clamp(dot(light, halfVec), 0.0, 1.0), 5.0);
}

vec3 CalcSpecularBlinnPhong(
        vec3 light, 
        vec3 normal, 
        vec3 halfVec, 
        float specPower, 
        vec3 fresnel)
{
	float NdotL = clamp(dot(normal, light), 0.0, 1.0);
	return fresnel * ((specPower + 2.0) / 8.0 ) * pow(clamp(dot(normal, halfVec), 0.0, 1.0), specPower) * NdotL;
}

vec3 CalcSpecularGGX(
        vec3 light, 
        vec3 normal, 
        vec3 halfVec, 
        vec3 view, 
        float gloss, 
        vec3 fresnel)
{
	float NdotL = clamp(dot(normal, light), 0.0, 1.0);
	float roughness = clamp(1.0 - gloss, 0.0, 1.0);
	float alpha = roughness * roughness;

	float NdotH = clamp(dot(normal, halfVec), 0.0, 1.0);
	float NdotV = clamp(dot(normal, view), 0.0, 1.0);
 
	float alphaSqr = alpha * alpha;
	float pi = 3.14159;
	float denom = NdotH * NdotH * (alphaSqr - 1.0) + 1.0;
	float distribution = alphaSqr / (pi * denom * denom);

	// fresnel comes in pre-calculated
	float alphaPrime = roughness + 1.0;
	float k = alphaPrime * alphaPrime / 8.0;
	float g1vNL = NdotL / (NdotL * (1.0 - k) + k);
	float g1vNV = NdotV / (NdotV * (1.0 - k) + k);
	float visibility = g1vNL * g1vNV;

	return distribution * fresnel * visibility * NdotL / max(4.0 * NdotL * NdotV, 0.001);
}

uniform float			uHullHeatLevel;
uniform float			uTime;
uniform vec4			uFogColor;

// Irregular flickering function.
float Pulse(in float value, in float timeScale)
{
	float t = uTime * timeScale;   
	
	float s0 = t;
	s0 -= floor(s0);
	float sum = abs( s0 - 0.5);
	
	float s1 = t * 0.7 - 0.05;
	s1 -= floor(s1);
	sum += abs(s1 - 0.5) - 0.25;
	
	float s2 = t * 1.3 - 0.3;
	s2 -= floor(s2);
	sum += abs(s2 - 0.5) - 0.25;
	
	float s3 = t * 5.09 - 0.6;
	s3 -= floor(s3);
	sum += abs(s3 - 0.5) - 0.25;
	
	return (sum * 0.1 + 0.9) * value;
}

// Colour ramp from black through reddish brown/dark orange to yellow-white.
vec4 TemperatureGlow(in float level)
{
	vec4 result = vec4(0);
	
	result.r = level;
	result.g = level * level * level;
	result.b = max(level - 0.7, 0.0) * 2.0;
	result.a = 1.0;
	
	return result;	
}


void main(void)
{
	vec4 totalColor = vec4(0);
	
	// Get eye vector
    //#if NEED_EYE_VECTOR
        vec3 eyeVector = normalize(vEyeVector);
    //#endif
	
	// Get texture coords, using parallax mapping if appropriate
    #if OOSTD_NORMAL_AND_PARALLAX_MAP
        float parallax = texture2D(uNormalMap, vTexCoord).a;
        parallax = parallax * uParallaxScale + uParallaxBias;
        vec2 texCoord = vTexCoord - parallax * eyeVector.xy * vec2(-1.0, 1.0);
    #else
        #define texCoord vTexCoord
    #endif
	
	// Get normal
    #if OOSTD_NORMAL_MAP
        vec3 normal = normalize(texture2D(uNormalMap, texCoord).rgb - 0.5);
    #else
        const vec3 normal = vec3(0.0, 0.0, 1.0);
    #endif
	
	// Get light vectors
	//tODO: figure out why it fails linking vec3 lightVector = normalize(vLight1Vector);
	vec3 lightVector = normalize(uLightVector); 

    //#if NEED_EYE_VECTOR
        vec3 halfVector = normalize(lightVector + eyeVector);
    //#endif	
	// Get ambient colour
    vec4 ambientLight = uAmbientLightColor;
	
	// Get emission colour
    #if OOSTD_EMISSION || OOSTD_EMISSION_MAP
        vec4 emissionColor = vec4(1.0);
        #if OOSTD_EMISSION
            emissionColor *= uMaterialEmissionColor;
        #endif

        #if OOSTD_EMISSION_MAP
            vec4 emissionMapColor = texture2D(uEmissionMap, texCoord);
            if (uGammaCorrect)  emissionMapColor = pow(emissionMapColor, vec4(OOSRGB_TO_LINEAR));
            emissionColor *= emissionMapColor;
        #endif
        emissionColor.a = 1.0;
        totalColor += emissionColor;
    #endif

	
	// Get illumination colour
    #if OOSTD_EMISSION_AND_ILLUMINATION_MAP
        // Use alpha channel of emission map as white illumination - no sRGB to linear conversion here
        vec4 illuminationMapLight = vec4(emissionMapColor.aaa, 1.0);
    #elif OOSTD_ILLUMINATION_MAP
        // fully colored illumination map - convert to linear colorspace
        vec4 illuminationMapLight = texture2D(uIlluminationMap, texCoord);
        if (uGammaCorrect)  illuminationMapLight = pow(illuminationMapLight, vec4(OOSRGB_TO_LINEAR));
    #endif
    #ifdef OOSTD_ILLUMINATION_COLOR
        // OOSTD_ILLUMINATION_COLOR, if defined, is a vec4() declaration.
        illuminationMapLight *= OOSTD_ILLUMINATION_COLOR;
    #endif
        
	vec4 diffuseLight = vec4(0);
	
    #if HAVE_ILLUMINATION
        diffuseLight += illuminationMapLight;
    #endif
	
	// Get specular parameters
    #if OOSTD_SPECULAR_MAP
        vec4 specularMapColor = texture2D(uSpecularMap, texCoord);
        if (uGammaCorrect)  specularMapColor.rgb = pow(specularMapColor.rgb, vec3(OOSRGB_TO_LINEAR));
        #if !OOSPECULAR_NEW_MODEL_GGX
            float specularExponentLevel = pow(specularMapColor.a, 2.0) + 0.001;
            #define APPLY_MAPPED_EXPONENT exponent = (exponent - 1.0) * specularExponentLevel + 1.0
        #endif
    #else
        #define APPLY_MAPPED_EXPONENT exponent += 0.001
    #endif

    #if OOSTD_SPECULAR
        vec4 specularColor = uMaterialSpecularColor;
    #endif
    #if OOSTD_SPECULAR_MAP
        specularColor *= vec4(specularMapColor.rgb, 1.0);
    #endif
	
	vec3 fresnel = vec3(0.0);
	float gloss = uGloss;
	// Calculate specular light
    #if OOSTD_SPECULAR
        vec4 specularLight = vec4(0);
        #if !OOSPECULAR_NEW_MODEL || !OOSPECULAR_NEW_MODEL_GGX
            float exponent = gl_FrontMaterial.shininess;
            APPLY_MAPPED_EXPONENT;
        #endif
        #if !OOSPECULAR_NEW_MODEL
            specularLight += CalcSpecularLight(lightVector, eyeVector, exponent, normal, gl_LightSource[1].specular);
        #else
            fresnel = FresnelSchlick(specularColor.rgb, lightVector, halfVector);
            #if OOSPECULAR_NEW_MODEL_GGX
                #if OOSTD_SPECULAR_MAP
                    gloss *= specularMapColor.a;
                #endif
                specularLight = vec4(CalcSpecularGGX(lightVector, normal, halfVector, eyeVector, gloss, fresnel), 0.0);
            #else
                // New Blinn-Phong
                specularLight = vec4(CalcSpecularBlinnPhong(lightVector, normal, halfVector, exponent, fresnel), 0.0);
            #endif
        #endif
        specularLight.a = 1.0;
    #endif
	
    vec4 materialAmbientColor = uMaterialAmbientColor;
    vec4 materialDiffuseColor = uMaterialDiffuseColor;

    #if OOSTD_DIFFUSE_MAP
    #if !OOSTD_DIFFUSE_MAP_IS_CUBE_MAP
        vec4 diffuseMapColor = texture2D(uDiffuseMap, texCoord);
    #else
        vec4 diffuseMapColor = textureCube(uDiffuseMap, vCubeTexCoords);
    #endif
        if (uGammaCorrect)  diffuseMapColor = pow(diffuseMapColor, vec4(OOSRGB_TO_LINEAR));
        diffuseMapColor.a = 1.0;
        materialDiffuseColor *= diffuseMapColor;
        materialAmbientColor *= diffuseMapColor;
    #endif

    #if OODIFFUSE_ORENNAYAR
        diffuseLight.rgb += diffuseOrenNayar(lightVector, 
                                                eyeVector, 
                                                normal, 
                                                gloss, 1.0) 
                                            * uLightSourceDiffuseColor.rgb;
    #else
        diffuseLight.rgb += CalcDiffuseLight(lightVector, normal, uLightSourceDiffuseColor.rgb);
    #endif
	
	// light energy conservation here
	#if OOSPECULAR_NEW_MODEL
		vec4 kD = vec4(vec3(1.0) - fresnel, 1.0);
	#else
		vec4 kD = vec4(1.0);
	#endif
	totalColor += (materialDiffuseColor * diffuseLight * kD) + (materialAmbientColor * uAmbientLightColor);

    #if OOSTD_SPECULAR
        // do not multiply by specularColor here; already accounted for by Fresnel-Schlick term
        totalColor += specularLight * uLightSourceSpecularColor;
    #endif
        // apparently some drivers fail to clamp alpha properly, so let's do it for them
        totalColor.a = clamp(totalColor.a, 0.0, 1.0);
        
        // Heat glow
        float hullHeat = max(uHullHeatLevel - 0.5, 0.0) * 2.0;
        hullHeat = Pulse(hullHeat * hullHeat, 0.1);
        totalColor += TemperatureGlow(hullHeat);
        
        // exposure
        totalColor.rgb *= MULITPLIER_PREEXPOSURE;
        
        gl_FragColor = mix(totalColor, vec4(uFogColor.xyz, 1.0), uFogColor.w);
        gl_FragColor.a = clamp(gl_FragColor.a, 0.0, 1.0);
        
    }
