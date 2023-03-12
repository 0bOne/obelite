#version 300 es
#define varying in
#define gl_FragColor pc_fragColor
#define texture2D texture

precision highp float;
precision highp int;

layout(location = 0) out highp vec4 pc_fragColor;

struct ReflectedLight {
	vec3 directDiffuse;
	vec3 directSpecular;
	vec3 indirectDiffuse;
	vec3 indirectSpecular;
};

uniform vec3 diffuse;
uniform float opacity;
uniform sampler2D map;

varying vec3 vNormal;
varying vec3 vColor;
varying vec2 vUv; 

vec4 LinearToLinear( in vec4 value ) {
	return value;
}

vec4 linearToOutputTexel( vec4 value ) { 
	return LinearToLinear( value ); 
}

void main() {

	vec4 diffuseColor = vec4( diffuse, opacity );
	vec4 sampledDiffuseColor = texture2D( map, vUv );
	diffuseColor *= sampledDiffuseColor;
	diffuseColor.rgb *= vColor;

	ReflectedLight reflectedLight = ReflectedLight( vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ), vec3( 0.0 ) );
	reflectedLight.indirectDiffuse += vec3( 1.0 );

	// modulation
	reflectedLight.indirectDiffuse *= diffuseColor.rgb;
	vec3 outgoingLight = reflectedLight.indirectDiffuse;

	diffuseColor.a = 1.0;

	gl_FragColor = vec4( outgoingLight, diffuseColor.a );
	gl_FragColor = linearToOutputTexel( gl_FragColor );
}

