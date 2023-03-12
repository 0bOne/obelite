export default class AnimationManager 
{
    isAnimating;
    boundRenderFunction;

    constructor(gameCtx)
    {
        this.gameCtx = gameCtx;
        this.isAnimating = false;

        this.gameCtx.t = {
            id: "time",
            then: 0,
            now: 0,
            delta: 0,
        };

        this.gameCtx.fps = {
            id: "frame rate",
            delta: 0,
            then: 0,
            now: 0,
            frames: 0
        }

        this.boundRenderFunction = this.render.bind(this);

    }

    start()
    {
        requestAnimationFrame(this.boundRenderFunction);
    }

    render(now)
    {
        this.updateTime(now);
        this.updateFrameRate();

        //randering
        this.gameCtx.scene.Draw();

        //animation calculations
        this.gameCtx.scene.models.forEach(model => {
            if (model.animator)
            {
                model.animator.animate(this.gameCtx);   
            }         
        });

        requestAnimationFrame(this.boundRenderFunction);

    }

    updateTime(now)
    {
        //update global animation times
        this.gameCtx.t.now = now * 0.001; // convert to seconds
        this.gameCtx.t.delta = this.gameCtx.t.now - this.gameCtx.t.then; 
        this.gameCtx.t.then = this.gameCtx.t.now;
    }

    updateFrameRate()
    {
        this.gameCtx.fps.frames++;
        this.gameCtx.fps.delta += this.gameCtx.t.delta;
        if (this.gameCtx.fps.delta > 1.0)
        {
            document.title = "fps: " + (this.gameCtx.fps.frames/this.gameCtx.fps.delta).toFixed(1);
            this.gameCtx.fps.frames = 0;
            this.gameCtx.fps.delta = 0;
        }       
    }
}
