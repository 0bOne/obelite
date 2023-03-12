//vertex shader for Oolite ships. see ./license.txt for gpl

precision highp float;

attribute vec4 			aVertexPosition;
attribute vec3 			aVertexNormal;
attribute vec2 			aTextureCoord;

uniform mat3			uNormalMatrix;
uniform mat4			uModelViewMatrix;
uniform mat4			uProjectionMatrix;


varying vec3			vNormal;
varying vec3			vEyeVector;
varying vec2 		    vTexCoord;

void main(void)
{
	vNormal = normalize(uNormalMatrix * aVertexNormal);
	vEyeVector = -vec3(uModelViewMatrix * aVertexPosition);
	
	vTexCoord = aTextureCoord;
	gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;
}
