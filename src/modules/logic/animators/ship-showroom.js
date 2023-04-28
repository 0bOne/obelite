//TODO: inherit from animator base class

export default class ShipShowroom 
{
    isRotating;
    model;

    constructor(model, zAway = -30, zNear = -3)
    {
        this.zAway = zAway;
        this.zNear = zNear;
        this.model = model;
        this.model.worldPosition.z = zAway;

        if (model.subentities)
        {
            model.subentities.forEach(sub => {
                sub.animator = new ShipShowroom(sub, zAway, zNear);
            });
        }
    }

    animate(gameCtx)
    {
        if (this.isRotating === true)
        {
            this.model.rotation.x -= gameCtx.t.delta * 0.5;
            this.model.rotation.y -= gameCtx.t.delta * 0.2;
            this.model.rotation.z -= gameCtx.t.delta * 0.1;
        }
        else if (this.model.worldPosition.z < this.zNear)
        {
            this.model.worldPosition.z += gameCtx.t.delta * 20;
        }
        else
        {
            this.isRotating = true;
        }

        if (this.model.subentities)
        {
            this.model.subentities.forEach(sub => {
                sub.animator.animate(gameCtx);
            });
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
