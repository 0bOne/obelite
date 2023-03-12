//compact square matrix based on https://github.com/toji/gl-matrix

export default class SquareMatrix extends Float32Array
{
    dimensions;

    constructor(dimensions)
    {
        super(dimensions * dimensions);
        this.dimensions = dimensions;
    }

    //NOTE: for speed, the SET functions presumes an otherwise clear matrix
    //either va this clear function or a new, untouched matrix
    clear()
    {
        this.set(new Uint32Array(this.dimensions * this.dimensions));
        return this;
    }

    //reset to identity matrix
    setIdentity()
    {
        //set the diagonals to 1
        let i = 0;
        while (i < this.length)
        {
            this[i] = 1.0;
            i += this.dimensions + 1;
        }
        return this;
    }

    toRows()
    {
        const rows = [];
        for (let r = 0; r < this.dimensions; r++)
        {
            const row = [];
            for (let c = 0; c < this.dimensions; c++)
            {
                row.push(this[r * this.dimensions + c]);
            }
            rows.push(row);
        }
        return rows;
    }

    setPerspective(fieldOfView, aspect, zNear, zFar) 
    {
        if (this.dimensions !== 4)
        {
            throw "function requires a 4x4 matrix"
        }

        let f = 1.0 / Math.tan(fieldOfView / 2);
        this[0] = f / aspect;
        this[5] = f;
        this[11] = -1;
      
        if (zFar != null && zFar !== Infinity) 
        {
          var nf = 1 / (zNear - zFar);
          this[10] = (zFar + zNear) * nf;
          this[14] = 2 * zFar * zNear * nf;
        } 
        else 
        {
            this[10] = -1;
            this[14] = -2 * zNear;
        }
        return this;
    }

    setTranslation(amount) 
    {
        if (this.dimensions !== 4)
        {
            //TODO: make this function dimension-independent, if possible
            throw "function requires a 4x4 matrix"
        }
        else
        {
            this[12] = this[0] * amount.x + this[4] * amount.y + this[8] * amount.z + this[12];
            this[13] = this[1] * amount.x + this[5] * amount.y + this[9] * amount.z + this[13];
            this[14] = this[2] * amount.x + this[6] * amount.y + this[10] * amount.z + this[14];
            this[15] = this[3] * amount.x + this[7] * amount.y + this[11] * amount.z + this[15];
        }
        return this;
    }

    setRotation(radians, axes) 
    {
        if (this.dimensions !== 4)
        {
            //TODO: make this function dimension-independent, if possible
            throw "function requires a 4x4 matrix"
        }

        let hypot = Math.hypot(axes.x, axes.y, axes.z);

        if (hypot >= Number.EPSILON) 
        {
            let invHypot = 1 / hypot;
            let nAxes = {
                x: axes.x *= invHypot,
                y: axes.y *= invHypot,
                z: axes.z *= invHypot
            }

            let s = Math.sin(radians);
            let c = Math.cos(radians);
            let t = 1 - c;

            let a00 = this[0];
            let a01 = this[1];
            let a02 = this[2];
            let a03 = this[3];
            let a10 = this[4];
            let a11 = this[5];
            let a12 = this[6];
            let a13 = this[7];
            let a20 = this[8];
            let a21 = this[9];
            let a22 = this[10];
            let a23 = this[11]; // Construct the elements of the rotation matrix
        
            let b00 = nAxes.x * nAxes.x * t + c;
            let b01 = nAxes.y * nAxes.x * t + nAxes.z * s;
            let b02 = nAxes.z * nAxes.x * t - nAxes.y * s;
            let b10 = nAxes.x * nAxes.y * t - nAxes.z * s;
            let b11 = nAxes.y * nAxes.y * t + c;
            let b12 = nAxes.z * nAxes.y * t + nAxes.x * s;
            let b20 = nAxes.x * nAxes.z * t + nAxes.y * s;
            let b21 = nAxes.y * nAxes.z * t - nAxes.x * s;
            let b22 = nAxes.z * nAxes.z * t + c; // Perform rotation-specific matrix multiplication
        
            this[0] = a00 * b00 + a10 * b01 + a20 * b02;
            this[1] = a01 * b00 + a11 * b01 + a21 * b02;
            this[2] = a02 * b00 + a12 * b01 + a22 * b02;
            this[3] = a03 * b00 + a13 * b01 + a23 * b02;
            this[4] = a00 * b10 + a10 * b11 + a20 * b12;
            this[5] = a01 * b10 + a11 * b11 + a21 * b12;
            this[6] = a02 * b10 + a12 * b11 + a22 * b12;
            this[7] = a03 * b10 + a13 * b11 + a23 * b12;
            this[8] = a00 * b20 + a10 * b21 + a20 * b22;
            this[9] = a01 * b20 + a11 * b21 + a21 * b22;
            this[10] = a02 * b20 + a12 * b21 + a22 * b22;
            this[11] = a03 * b20 + a13 * b21 + a23 * b22;
        
        } // if hyp >epsilon

        return this;
      
    }

    setInverted(source) 
    {
        if (this.dimensions !== 4)
        {
            //TODO: make this function dimension-independent, if possible
            throw "function requires a 4x4 matrix"
        }

        let a00 = source[0],
            a01 = source[1],
            a02 = source[2],
            a03 = source[3];
        let a10 = source[4],
            a11 = source[5],
            a12 = source[6],
            a13 = source[7];
        let a20 = source[8],
            a21 = source[9],
            a22 = source[10],
            a23 = source[11];
        let a30 = source[12],
            a31 = source[13],
            a32 = source[14],
            a33 = source[15];
        let  b00 = a00 * a11 - a01 * a10;
        let  b01 = a00 * a12 - a02 * a10;
        let  b02 = a00 * a13 - a03 * a10;
        let  b03 = a01 * a12 - a02 * a11;
        let  b04 = a01 * a13 - a03 * a11;
        let  b05 = a02 * a13 - a03 * a12;
        let  b06 = a20 * a31 - a21 * a30;
        let  b07 = a20 * a32 - a22 * a30;
        let  b08 = a20 * a33 - a23 * a30;
        let  b09 = a21 * a32 - a22 * a31;
        let  b10 = a21 * a33 - a23 * a31;
        let  b11 = a22 * a33 - a23 * a32; // Calculate the determinant
      
        let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06;
      
        if (det)
        {
            let invDet = 1.0 / det;
            this[0] = (a11 * b11 - a12 * b10 + a13 * b09) * invDet;
            this[1] = (a02 * b10 - a01 * b11 - a03 * b09) * invDet;
            this[2] = (a31 * b05 - a32 * b04 + a33 * b03) * invDet;
            this[3] = (a22 * b04 - a21 * b05 - a23 * b03) * invDet;
            this[4] = (a12 * b08 - a10 * b11 - a13 * b07) * invDet;
            this[5] = (a00 * b11 - a02 * b08 + a03 * b07) * invDet;
            this[6] = (a32 * b02 - a30 * b05 - a33 * b01) * invDet;
            this[7] = (a20 * b05 - a22 * b02 + a23 * b01) * invDet;
            this[8] = (a10 * b10 - a11 * b08 + a13 * b06) * invDet;
            this[9] = (a01 * b08 - a00 * b10 - a03 * b06) * invDet;
            this[10] = (a30 * b04 - a31 * b02 + a33 * b00) * invDet;
            this[11] = (a21 * b02 - a20 * b04 - a23 * b00) * invDet;
            this[12] = (a11 * b07 - a10 * b09 - a12 * b06) * invDet;
            this[13] = (a00 * b09 - a01 * b07 + a02 * b06) * invDet;
            this[14] = (a31 * b01 - a30 * b03 - a32 * b00) * invDet;
            this[15] = (a20 * b03 - a21 * b01 + a22 * b00) * invDet;
        }
        return this;
    }

    setTransposed(source) 
    {
        if (this.dimensions !== 4)
        {
            //TODO: make this function dimension-independent, if possible
            throw "function requires a 4x4 matrix"
        }
          
        let a01 = source[1],
            a02 = source[2],
            a03 = source[3];
        let a12 = source[6],
            a13 = source[7];
        let a23 = source[11];
          
        this[1] = source[4];
        this[2] = source[8];
        this[3] = source[12];
        this[4] = a01;
        this[6] = source[9];
        this[7] = source[13];
        this[8] = a02;
        this[9] = a12;
        this[11] = source[14];
        this[12] = a03;
        this[13] = a13;
        this[14] = a23;
        
        return this;
    }
};
