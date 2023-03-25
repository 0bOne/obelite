
#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.14159265358979323

uniform float u_resolution;
uniform float u_sea_level;
uniform vec3 u_land_offset_1;
uniform vec3 u_land_offset_2;
uniform vec3 u_land_offset_3;
uniform vec3 u_land_offset_4;
uniform vec3 u_land_offset_5;

uniform vec4 u_color_sea;
uniform vec4 u_color_land;
uniform vec4 u_color_heights;
uniform vec4 u_color_peaks;

uniform float u_height_sea;
uniform float u_height_land;
uniform float u_height_heights;
uniform float u_height_peaks;

const vec4 blue = vec4(0.0, 0.0, 1.0, 1.0);
const vec4 green = vec4(0.0, 1.0, 0.0, 1.0);
const vec4 red = vec4(1.0, 0.0, 0.0, 1.0);
const vec4 white = vec4(1.0, 1.0, 1.0, 1.0);
const vec4 gray = vec4(0.5, 0.5, 0.5, 1.0);

float hypot(vec2 z) {
  float t;
  float x = abs(z.x);
  float y = abs(z.y);
  t = min(x, y);
  x = max(x, y);
  t = t / x;
  return (z.x == 0.0 && z.y == 0.0) ? 0.0 : x * sqrt(1.0 + t * t);
}

float random(in vec2 st, float seedExtra) {
  vec2 seedY = vec2(12.9898 + seedExtra, 78.233);
  return fract(sin(dot(st.xy, seedY)) * 43758.5453123);
}

// Based on Morgan McGuire @morgan3d
// https://www.shadertoy.com/view/4dS3Wd
float noise(in vec2 st, float seedExtra) {
  vec2 i = floor(st);
  vec2 f = fract(st);

    // Four corners in 2D of a tile
  float a = random(i, seedExtra);
  float b = random(i + vec2(1.0, 0.0), seedExtra);
  float c = random(i + vec2(0.0, 1.0), seedExtra);
  float d = random(i + vec2(1.0, 1.0), seedExtra);

  vec2 u = f * f * (3.0 - 2.0 * f);

  return mix(a, b, u.x) +
    (c - a) * u.y * (1.0 - u.x) +
    (d - b) * u.x * u.y;
}

#define OCTAVES 6
float fbm(in vec2 st, float seedExtra) {
    // Initial values
  float value = 0.0;
  float amplitud = .5;
  float frequency = 0.;
    //
    // Loop of octaves
  for(int i = 0; i < OCTAVES; i++) {
    value += amplitud * noise(st, seedExtra);
    st *= 2.;
    amplitud *= .5;
  }
  return value;
}

float wrap(float value) {
  if(value < 0.0) {
    value += 1.0;
  } else if(value > 1.0) {
    value -= 1.0;
  }
  return value;
}

vec2 offset_st(vec2 st, vec2 amount) {
  vec2 result = st + amount;
  result.x = wrap(result.x);
  result.y = wrap(result.y);
  return result;
}

float generate_height(float last_height, vec2 org_st, vec3 land_offset) {
  float height = last_height;
  if(land_offset.z > 0.0) //z must be nonzero to generate a height
  {
    vec2 st = offset_st(org_st, land_offset.xy);
    st -= 0.5; //center
    float distance_from_center = hypot(st);
    const float gradient_start = 0.2;   //r when amplitude starts to move to zero
    const float gradient_end = 0.4;     //r when amplitude reaches zero

    float gradient_range = 1.0;                           //dy always 1 
    float radius_range = gradient_end - gradient_start;   //dx
    float amplitude = (distance_from_center <= gradient_start) ? 1.0 : 1.0 - (gradient_range / radius_range) * (distance_from_center - gradient_start);

    height = fbm(st * 10.0, land_offset.z);
    height *= amplitude;

  }
  return max(height, last_height);
}

float lerp(float lo, float hi, float fraction) {
  return lo + fraction * (hi - lo);
}

vec4 blend_color(float height, float height_lo, vec4 color_lo, float height_hi, vec4 color_hi) {
  float heightRange = height_hi - height_lo;
  float heightAmount = height - height_lo;
  float fraction = (heightAmount / heightRange);
  vec4 blendedColor = vec4(0.0);
  blendedColor.r = lerp(color_lo.r, color_hi.r, fraction);
  blendedColor.g = lerp(color_lo.g, color_hi.g, fraction);
  blendedColor.b = lerp(color_lo.b, color_hi.b, fraction);
  blendedColor.a = 1.0;
  return blendedColor;
}

vec4 compute_color(float height) 
{
  vec4 color = vec4(1.0);

  if(height <= u_height_sea) 
  {
    vec4 deep_sea_color = vec4(u_color_sea.rgb * 0.3, 1.0);
    color = blend_color(height, 0.0, deep_sea_color, u_height_sea, u_color_sea);
  } 
  else if (height >= u_height_peaks)
  {
    color = u_color_peaks;
  }
  else if (height >= u_height_heights)
  {
    color = u_color_heights;
  }
  else
  {
    color = u_color_land;
  }

  return color;
}

void main(void) {
  vec2 st = gl_FragCoord.xy / u_resolution; //normalize

  float height;

  height = generate_height(0.0, st, u_land_offset_1);
  height = generate_height(height, st, u_land_offset_2);
  height = generate_height(height, st, u_land_offset_3);
  height = generate_height(height, st, u_land_offset_4);
  height = generate_height(height, st, u_land_offset_5);

  gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
  gl_FragColor = max(gl_FragColor, vec4(vec3(height), 1.0));

    // debug helpers:
    // if (u_sea_level > 0.0 && height > u_sea_level) //above sea level, show as red for debugging
    // {
    //   gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); 
    // }

  gl_FragColor = compute_color(height);

    // if (distance_from_center > 0.4 && distance_from_center < 0.405)
    // {
    //  gl_FragColor = vec4(0.0, 0.0, 1.0, 1.0); 
    // }

}
