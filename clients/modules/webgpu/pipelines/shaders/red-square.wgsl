@vertex
fn vertexMain(@location(0) vertex_index: vec2f) -> @builtin(position) vec4f {
  return vec4f(vertex_index, 0, 1);
}

@fragment
fn fragmentMain() -> @location(0) vec4f {
  return vec4f(1, 0, 0, 1); // (Red, Green, Blue, Alpha)
}
