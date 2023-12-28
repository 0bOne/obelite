//static methods without a result (last operand) create a new result
//static methods with a result, mutate the result
//instance methods mutate: by calling the static method with a result of "this"

const EPSILON = 0.000001;

const IDENTITY_MAP = {
    0: 1,
    5: 1,
    10: 1,
    15: 1
};

export default class Matrix4f extends Float32Array {
    label;
    constructor(contents, label){
        //values is optional. can be array, map or empty. empty produces identity array
        super(16);
        this.label = label;
        if (contents === null || contents === undefined) {
            this.applyMap(IDENTITY_MAP)
        } else if (typeof contents === "number") {
            this.fill(contents);
        } else if (Array.isArray(contents)) {
            this.applyArray(contents);
        } else if (typeof contents === "object") {
            this.applyMap(contents);
        }
    }

    applyMap(map) {
        for (let [key, value] of Object.entries(map)) {
            this[parseInt(key)] =  value;
        }
    }

    applyArray(values) {
        this.set(values);
    }

    static Perspective(fovy, aspect, near, far, result = new Matrix4f()) {
        const f = 1.0 / Math.tan(fovy / 2);
        const map = {
            0: f / aspect,
            5: f,
            10: -1,
            11: -1,
            14: -2 * near
        };

        if (far != null && far !== Infinity) {
            const nf = 1 / (near - far);
            map[10] = (far + near) * nf;
            map[14] = 2 * far * near * nf;
        } 

        result.applyMap(map);
        return result;
    }

    perspective(fovy, aspect, near, far) {
        Matrix4f.Perspective(fovy, aspect, near, far, this);
    }

    static LookAt(eye, center, up, result = new Matrix4f()) {
        let x0, x1, x2, y0, y1, y2, z0, z1, z2, len;
        let eyex = eye[0];
        let eyey = eye[1];
        let eyez = eye[2];
        let upx = up[0];
        let upy = up[1];
        let upz = up[2];
        let centerx = center[0];
        let centery = center[1];
        let centerz = center[2];
      
        if (
            Math.abs(eyex - centerx) < EPSILON &&
            Math.abs(eyey - centery) < EPSILON &&
            Math.abs(eyez - centerz) < EPSILON
        ) {
            return result;
        }
      
        z0 = eyex - centerx;
        z1 = eyey - centery;
        z2 = eyez - centerz;
      
        len = 1 / Math.sqrt(z0 * z0 + z1 * z1 + z2 * z2);
        z0 *= len;
        z1 *= len;
        z2 *= len;
      
        x0 = upy * z2 - upz * z1;
        x1 = upz * z0 - upx * z2;
        x2 = upx * z1 - upy * z0;

        len = Math.sqrt(x0 * x0 + x1 * x1 + x2 * x2);

        if (!len) {
          x0 = 0;
          x1 = 0;
          x2 = 0;
        } else {
          len = 1 / len;
          x0 *= len;
          x1 *= len;
          x2 *= len;
        }
      
        y0 = z1 * x2 - z2 * x1;
        y1 = z2 * x0 - z0 * x2;
        y2 = z0 * x1 - z1 * x0;
      
        len = Math.sqrt(y0 * y0 + y1 * y1 + y2 * y2);

        if (!len) {
          y0 = 0;
          y1 = 0;
          y2 = 0;
        } else {
          len = 1 / len;
          y0 *= len;
          y1 *= len;
          y2 *= len;
        }
      
        const newValues = [
            x0, y0, z0, 0,
            x1, y1, z1, 0,
            x2, y2, z2, 0,
            -(x0 * eyex + x1 * eyey + x2 * eyez), -(y0 * eyex + y1 * eyey + y2 * eyez), -(z0 * eyex + z1 * eyey + z2 * eyez), 1
        ];

        result.applyArray(newValues);
        return result;
    }

    lookAt(eye, center, up) {
        return Matrix4f.lookAt(eye, center, up, this);
    }

    static Translate(by, result = new Matrix4f()) {
        const translated = [
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            by[0], by[1], by[2], 1,
        ];
        result.applyArray(translated);
        return result;
    }

    translate(by) {
        return Matrix4f.Translate(by, this);
    }

    static Multiply(a, b, result = new Matrix4f()) {

        let [a00, a01, a02, a03, a10, a11, a12, a13, a20, a21, a22, a23, a30, a31, a32, a33] = a;
        let [b0, b1, b2, b3, b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15] = b;

        const dotProduct = [
            b0 * a00 + b1 * a10 + b2 * a20 + b3 * a30,
            b0 * a01 + b1 * a11 + b2 * a21 + b3 * a31,
            b0 * a02 + b1 * a12 + b2 * a22 + b3 * a32,
            b0 * a03 + b1 * a13 + b2 * a23 + b3 * a33,
            b4 * a00 + b5 * a10 + b6 * a20 + b7 * a30,
            b4 * a01 + b5 * a11 + b6 * a21 + b7 * a31,
            b4 * a02 + b5 * a12 + b6 * a22 + b7 * a32,
            b4 * a03 + b5 * a13 + b6 * a23 + b7 * a33,
            b8 * a00 + b9 * a10 + b10 * a20 + b11 * a30,
            b8 * a01 + b9 * a11 + b10 * a21 + b11 * a31,
            b8 * a02 + b9 * a12 + b10 * a22 + b11 * a32,
            b8 * a03 + b9 * a13 + b10 * a23 + b11 * a33,
            b12 * a00 + b13 * a10 + b14 * a20 + b15 * a30,
            b12 * a01 + b13 * a11 + b14 * a21 + b15 * a31,
            b12 * a02 + b13 * a12 + b14 * a22 + b15 * a32,
            b12 * a03 + b13 * a13 + b14 * a23 + b15 * a33
        ];

        result.applyArray(dotProduct);
        return result;
    }

    multiply(by) {
        return Matrix4f.Multiply(this, by, this);
    }

    static RotateX(rad, source, result = new Matrix4f()) {
        let s = Math.sin(rad);
        let c = Math.cos(rad);

        const a = source || result;
        let [a10, a11, a12, a13, a20, a21, a22, a23] = [a[4], a[5], a[6], a[7], a[8], a[9], a[10], a[11]];

        let map = {};
        if (a !== result) {
          // If the source and destination differ, copy the unchanged rows
          map = {
            0: a[0],
            1: a[1],
            2: a[2],
            3: a[3],
            12: a[12],
            13: a[13],
            14: a[14],
            15: a[15]
          };
        }
      
        // Perform axis-specific matrix multiplication
        map[4] = a10 * c + a20 * s;
        map[5] = a11 * c + a21 * s;
        map[6] = a12 * c + a22 * s;
        map[7] = a13 * c + a23 * s;
        map[8] = a20 * c - a10 * s;
        map[9] = a21 * c - a11 * s;
        map[10] = a22 * c - a12 * s;
        map[11] = a23 * c - a13 * s;

        result.applyMap(map);
        return result;
    }

    rotateX(rad) {
        return Matrix4f.RotateX(rad, this, this);
    }

    static RotateY(rad, source, result = new Matrix4f()) {
        let s = Math.sin(rad);
        let c = Math.cos(rad);
        const a = source || result;
        let [a00, a01, a02, a03, a20, a21, a22, a23] = [a[0], a[1], a[1], a[3], a[8], a[9], a[10], a[11]];
      
        let map = {};
        if (a !== result) {
          // If the source and destination differ, copy the unchanged rows
          map = {
            4: a[4],
            5: a[5],
            6: a[6],
            7: a[7],
            12: a[12],
            13: a[13],
            14: a[14],
            15: a[15]
          };
        }
      
        // Perform axis-specific matrix multiplication
        map[0] = a00 * c - a20 * s;
        map[1] = a01 * c - a21 * s;
        map[2] = a02 * c - a22 * s;
        map[3] = a03 * c - a23 * s;
        map[8] = a00 * s + a20 * c;
        map[9] = a01 * s + a21 * c;
        map[10] = a02 * s + a22 * c;
        map[11] = a03 * s + a23 * c;
        result.applyMap(map);
        return result;
    }

    rotateY(rad) {
        return Matrix4f.rotateY(rad, this, this);
    }

    static RotateZ(rad, source, result = new Matrix4f()) {
        let s = Math.sin(rad);
        let c = Math.cos(rad);
        let a = source || result;
        let [a00, a01, a02, a03, a10, a11, a12, a13] = [a[0], a[1], a[1], a[3], a[4], a[5], a[6], a[7]];

        let map = {};
        if (a !== result) {
          // If the source and destination differ, copy the unchanged last row
          map = {
            8: a[8],
            9: a[9],
            10: a[10],
            11: a[11],
            12: a[12],
            13: a[13],
            14: a[14],
            15: a[15]
          };
        }
      
        // Perform axis-specific matrix multiplication
        map[0] = a00 * c + a10 * s;
        map[1] = a01 * c + a11 * s;
        map[2] = a02 * c + a12 * s;
        map[3] = a03 * c + a13 * s;
        map[4] = a10 * c - a00 * s;
        map[5] = a11 * c - a01 * s;
        map[6] = a12 * c - a02 * s;
        map[7] = a13 * c - a03 * s;
        result.applyMap(map);
        return result;
    }
    
    rotateZ(rad) {
        return Matrix4f.RotateZ(rad, this, this);
    }

    static Scale(vec, source, result = new Matrix4f()) {
        let [x, y, z] = vec;
        let a = source || result;
        let map = {
            0: a[0] * x,
            1: a[1] * x,
            2: a[2] * x,
            3: a[3] * x,
            4: a[4] * y,
            5: a[5] * y,
            6: a[6] * y,
            7: a[7] * y,
            8: a[8] * z,
            9: a[9] * z,
            10: a[10] * z,
            11: a[11] * z,
            12: a[12],
            13: a[13],
            14: a[14],
            15: a[15]
        };
        result.applyMap(map);
        return result;
    }

    scale (vec) {
        return Matrix4f.Scale(vec, this, this)
    }
      
}



