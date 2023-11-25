// vertex shader

struct Uniforms {
    mvpMatrix : mat4x4<f32>,
};
@binding(0) @group(0) var<uniform> uniforms : Uniforms;

struct Output {
    @builtin(position) Position : vec4<f32>,
    @location(0) vColor : vec4<f32>,
};

@vertex
fn vs_main(@location(0) pos: vec4<f32>, @location(1) color: vec4<f32>) -> Output {
    var output: Output;
    output.Position = uniforms.mvpMatrix * pos;
    output.vColor = color;
    return output;
}

// fragment shader

 @fragment
fn fs_main(@location(0) vColor: vec4<f32>) -> @location(0) vec4<f32> {
    return vColor;
}