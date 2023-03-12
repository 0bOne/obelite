#version 300 es

#define attribute in
#define varying out
#define texture2D texture

precision highp float;
precision highp int;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat3 uvTransform;

attribute vec3 position;
attribute vec3 normal;
attribute vec2 uv;

varying vec2 vUv;

void main() {
	vUv = ( uvTransform * vec3( uv, 1 ) ).xy;
	vec3 transformed = vec3( position );
	vec4 mvPosition = vec4( transformed, 1.0 );
	mvPosition = modelViewMatrix * mvPosition;
	gl_Position = projectionMatrix * mvPosition;
}

