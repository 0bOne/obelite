Math.lerp = function(v0, v1, fraction)
{
    // Linear interpolation - equivalent to v0 * (1.0f - fraction) + v1 * fraction.
    return v0 + fraction * (v1 - v0);
}

Math.hermite = function(q)
{
	return 3.0 * q * q - 2.0 * q * q * q;
}

Math.fract = function(value)
{
    return value - Math.floor(value);
}

Math.clamp = function(value, min, max)
{
    value = (value < min) ? min: value;
    value = (value > max) ? max: value;
    return value;
}

Math.TWO_PI = Math.PI * 2;