//TODO: inherit from animator base class
export default class Rotator 
{
    isRotating;
    model;
    rate;

    constructor(model, rate)
    {
        this.isRotating = true;
        this.model = model;
        this.rate = rate;
    }

    animate(gameCtx)
    {
        if (this.isRotating === true)
        {
            this.model.rotation -= gameCtx.t.delta * 0.5;
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
