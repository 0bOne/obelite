#version 300 es
#define varying in
#define gl_FragColor pc_fragColor
#define texture2D texture

precision highp float;
precision highp int;

layout(location = 0) out highp vec4 pc_fragColor;

uniform sampler2D uSampler;
varying vec3 vNormal;
varying vec2 vUv; 
varying vec3 vLighting;

const float opacity = 1.0;
const vec3 diffuse = vec3(1.0, 1.0, 1.0);

void main() 
{
	vec4 diffuseColor = vec4( diffuse, opacity );
	vec4 sampledDiffuseColor = texture2D( uSampler, vUv );

	diffuseColor *= sampledDiffuseColor;

	diffuseColor.a = 1.0;
	gl_FragColor = diffuseColor;

	gl_FragColor = vec4(gl_FragColor.rgb * vLighting, gl_FragColor.a);


}

