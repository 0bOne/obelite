//compact vector, always 4
export default class Vector extends Float32Array
{
    constructor(values)
    {
        super(4);
        if (values)
        {
            this.set(values);
        }
    }

    setFrom(target)
    {
        this.set(target);
        return this;
    }

    multiplyScalar( scalar ) {

		this[0] *= scalar;
		this[1] *= scalar;
		this[2] *= scalar;
        this[3] *= scalar;
		return this;
	}

    divideScalar(scalar) 
    {
		return this.multiplyScalar(1 / scalar);
	}

	length() 
    {
		return Math.sqrt( this.x * this.x + this.y * this.y + this.z * this.z );
	}

    normalize()
    {
        return this.divideScalar( this.length() || 1 );
    }

    clone()
    {
        return new Vector(this);
    }

    AsCSSColor()
    {
        let rgb = "#" + this.toHexColor(this[0])
                        + this.toHexColor(this[1])
                        + this.toHexColor(this[2])
        if (this.length === 4)
        {
            rgb += this.toHexColor(this[3]);
        }
        return rgb;
    }

    toHexColor(fraction)
    {
        return Math.floor(fraction * 256).toString(16).padStart(2, "0");
    }

    blend(otherColor, fraction)
    {
        const result = this.clone();
        result[0] = Math.lerp(result[0], otherColor[0], fraction);
        result[1] = Math.lerp(result[1], otherColor[1], fraction);
        result[2] = Math.lerp(result[2], otherColor[2], fraction);
        if (result[3])
        {
            result[3] = Math.lerp(result[3], otherColor[3], fraction);
        }
    
        return result;
    }

}