//TODO: inherit from animator base class


export default class PlanetShowroom 
{
    isRotating;
    model;
    rate;

    constructor(model, rate)
    {
        this.isRotating = true;
        this.model = model;
        this.model.rotation = {x: 0.7, y: 0.7, z: 0.7};
        this.model.worldPosition.z = -5;
        this.rate = rate;
    }

    animate(gameCtx)
    {
        if (this.isRotating === true)
        {
            //TODO: figure out how to get it to rotate around its poles
            this.model.rotation.y -= gameCtx.t.delta * 0.2;
        }
    }

    onKey(event)
    {
        if (event.key === " ")
        {
            //toggle rotation flag
            this.isRotating = !this.isRotating;
        }
    }
}
