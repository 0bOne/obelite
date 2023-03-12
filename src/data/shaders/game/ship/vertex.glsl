#version 300 es

#define attribute in
#define varying out

precision highp float;
precision highp int;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;
uniform mat4 uNormalMatrix;

attribute vec3 aVertexPosition;
attribute vec3 aVertexNormal;
attribute vec2 aTextureCoord;

varying vec2 vUv;
varying vec3 vNormal;
varying vec3 vLighting;


void main() {
	vUv = aTextureCoord.xy;
	vNormal = aVertexNormal;


	// Apply lighting effect
	vec3 ambientLight = vec3(0.9, 0.9, 0.9);
	vec3 directionalLightColor = vec3(1.0, 1.0, 1.0);
	vec3 directionalVector = normalize(vec3(0.5, 1.0, 0.75));
	vec4 transformedNormal = uNormalMatrix * vec4(aVertexNormal, 1.0);
	float directional = max(dot(transformedNormal.xyz, directionalVector), 0.0);
	vLighting = ambientLight + (directionalLightColor * directional);
	

	vec3 transformed = vec3( aVertexPosition );
	vec4 mvPosition = vec4( transformed, 1.0 );
	mvPosition = uModelViewMatrix * mvPosition;
	gl_Position = uProjectionMatrix * mvPosition;
}

