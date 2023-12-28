//from: https://github.com/toji/gl-matrix/blob/master/src/common.js

// Configuration Constants
export const EPSILON = 0.000001;
export let ARRAY_TYPE = typeof Float32Array !== "undefined" ? Float32Array : Array;
export let RANDOM = Math.random;
export let ANGLE_ORDER = "zyx";

const degree = Math.PI / 180;

export function round(a) {
  if (a >= 0) return Math.round(a);
  return (a % 0.5 === 0) ? Math.floor(a) : Math.round(a);
}

export function setMatrixArrayType(type) {
  ARRAY_TYPE = type;
}

export function toRadian(a) {
  return a * degree;
}

export function equals(a, b) {
  return Math.abs(a - b) <= EPSILON * Math.max(1.0, Math.abs(a), Math.abs(b));
}