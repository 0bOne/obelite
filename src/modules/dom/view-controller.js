import VIEW_CLASS_MAP from "./views/_view-map.js";

export default class ViewController
{
    _currentView;
    _gameCtx;

    constructor(gameCtx)
    {
        this._gameCtx = gameCtx;
        document.body.addEventListener("changeView", this.onViewSwitch.bind(this));
        document.body.addEventListener("viewResize", this.onViewResized.bind(this));
    }

    onViewResized(event)
    {
        if (this._currentView)
        {
            this._currentView.resize();
        }
    }

    async onViewSwitch(event)
    {
        await this.ChangeView(event.detail.to);
    }

    async onKey(event)
    {
        if (this._currentView)
        {
            this._currentView.onKey(event);
        }
    }

    animate(gameCtx)
    {
        if (this._currentView)
        {
            this._currentView.animate(gameCtx);
        }
    }

    async ChangeView(viewId)
    {
        const viewClass = VIEW_CLASS_MAP[viewId];
        if(viewClass === null || viewClass === undefined)
        {
            console.error("Unrecognized view id: " + viewId);
        }
        else 
        {
            if (this._currentView)
            {
                this._currentView.Destroy();
                this._currentView = null;
            }

            console.info("switching to view " + viewId);
            this._currentView = new viewClass(this._gameCtx, viewId);
            await this._currentView.Create();
        }
    }
}