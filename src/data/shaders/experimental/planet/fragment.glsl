#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform vec2 u_mouse;
uniform float uTime;
out vec4 outColor;


vec3 projectToSphere(vec2 p) 
{
  return vec3(p.x, p.y, sqrt(-(p.x * p.x + p.y * p.y - 0.3)));   
}

float sunShading(vec3 sun, vec3 n)
{
    vec3 I = sun - n;
    I = normalize(I);
    float shading = dot(n, I);
    shading = clamp(shading*1.9, 0.0, 1.0);
    return shading; 
}

vec3 addPlanetShine(vec3 col, vec3 sun, float dist)
{
    float sun_str = sqrt(1.0-0.25 * length(vec3(0.0, 0.0, 2.0) - sun));
    sun_str = clamp(sun_str, 0.01, 1.0);
    col += vec3(4.0 * exp(-7.0 * dist)) * sun_str;
    return col;
}

vec3 rotate(vec3 pos, float tilt, float speed)
{
  //TODO: have the sun x-axis only; have the planet surface rotating
  //float tilt = 0.23; //ratio of x to y
  float t = uTime * -0.25;
  float xy = 2.0 * sin(t);
  float x = tilt * xy;
  float y = tilt * xy;
  float z = 2.0 * cos(t);

  return pos + vec3(x, y, z); 
}


float random (in vec2 st) 
{
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}

// Based on Morgan McGuire @morgan3: // https://www.shadertoy.com/view/4dS3Wd
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);

    // Four corners in 2D of a tile
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));

    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(a, b, u.x) +
            (c - a)* u.y * (1.0 - u.x) +
            (d - b) * u.x * u.y;
}

#define OCTAVES 10
float fbm (in vec2 st) 
{
    // Initial values
    float value = 0.0;
    float amplitude = .8;

    // Loop of octaves
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * noise(st);
        st *= 2.;
        amplitude *= .5;
    }
    return value;
}

vec4 generatePlanet(in vec2 fragCoord)
{
    vec4 fragColor;
    
	  vec2 uv = (-uResolution.xy + 2.0 * fragCoord.xy) / uResolution.y;
    float dist = length(uv);

    
    vec3 n = projectToSphere(uv);
    n = rotate(n, 0.1,  0.25);

    vec3 sunPos = rotate(vec3(0), 0.25, 0.25);
    sunPos = vec3(10.0, 10.0, 10.0);
    
    //background color
    vec3 col = vec3(0);

    //body
    //vec3 moon = vec3(0.0);    
    vec3 surface = vec3(0.0, 1.0, 0.0);
    surface += fbm(uv * 5.0);

    col = addPlanetShine(col, sunPos, dist);
    float shading = sunShading(sunPos, n);

    float alphaMix = smoothstep(0.4, 0.44, dist);
	  fragColor.rgb = mix(surface * shading, col, alphaMix);

    return fragColor;
}

void main()
{
  outColor = generatePlanet(gl_FragCoord.xy);
}


