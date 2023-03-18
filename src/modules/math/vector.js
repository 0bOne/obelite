//compact vector, based on square matrix
export default class Vector extends Float32Array
{
    constructor(length)
    {
        super(length);
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

}