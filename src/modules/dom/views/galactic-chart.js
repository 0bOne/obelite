import DomHelper from "../utilities/dom-helper.js";
import jsYaml from "../utilities/js-yaml.js";
import ViewBase from "./_view-base.js";
import Vector from "../../math/vector.js";

const CHART_MARGIN_X = 10;
const CHART_MARGIN_Y = 20;
const CHART_ASPECT_RATIO = 2;  //width:height

const ZOOM_IN_SCALE = 1;
const ZOOM_OUT_SCALE = 0.3;
const ZOOM_RATIO = ZOOM_IN_SCALE / ZOOM_OUT_SCALE;
const LIGHT_YEARS_PER_COORD = 0.4;

const STAR_RADIUS_SCALE = 1/20_000; //star radius to pixels
const SKEW_NONE = 0;
const LOCATION_CROSSHAIR_SIZE = 25;

const LABEL_DISAPPEARANCE_ZOOM = ZOOM_OUT_SCALE + 0.01;
const ZOOM_ANIMATION_SECONDS = 0.5;
const RANGE_CIRCLE_LINE_WIDTH = 5;
const CURSOR_MOVE_RATE = 10;  //cursor movement pixels per second (when zoomed in)

// TODO: Feature: Find by typing
// //Feature: System Info View (selected system's key(name) neded to be updaed in player context first)
// //Feature: Smooth scrolling instead of jumping when using arrows
// //Feature: Estimated journey time (LY ^2)
// //TODO: refactor into SOLID components


const ARROW_KEYS = ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"];
const DEFAULT_HELP = "To zoom in and out use '6' (not F6). Click or use arrows to select a different system";

export default class GalacticChart extends ViewBase 
{
    zoomScale; //1 = zoomed out, 0.25 - zoomed in

    visibleCanvas; //canvas visible on screen, zoomed in or out
    visibleCtx;

    unlabelledCanvas; //canvas holding the full unlabelled galaxy map
    unlabelledCtx;

    labelledCanvas; //canvas holding a laballed galaxy map
    labelledCtx;

    currentSystem;    //player is in this system/
    selectedSystem;   //selected with crosshairs

    constructor(gameCtx, viewId) 
    {
        super(gameCtx, viewId);

        this.AddPanel();
        this.AddTitle("System Atlas");

        this.visibleCanvas = DomHelper.AppendElement(this.panel, Elements.ChartCanvas);
        this.visibleCanvas.width = this.panel.clientWidth;
        this.visibleCanvas.height = this.visibleCanvas.width / CHART_ASPECT_RATIO;

        this.visibleCtx = this.visibleCanvas.getContext("2d");

        this.unlabelledCanvas = new OffscreenCanvas(this.visibleCanvas.width * ZOOM_RATIO, this.visibleCanvas.height * ZOOM_RATIO);
        this.unlabelledCtx = this.unlabelledCanvas.getContext("2d");

        this.labelledCanvas = new OffscreenCanvas(this.unlabelledCanvas.width, this.unlabelledCanvas.height);
        this.labelledCtx = this.labelledCanvas.getContext("2d");

        this.chartScaleX = 256 / this.unlabelledCanvas.width;
        this.chartScaleY = this.chartScaleX * CHART_ASPECT_RATIO;

        //amount of zoom per second for animation duration
        this.zoomDelta = (ZOOM_IN_SCALE - ZOOM_OUT_SCALE) / ZOOM_ANIMATION_SECONDS; 
        this.zoomScale = ZOOM_OUT_SCALE;
        this.desiredZoomScale = ZOOM_OUT_SCALE;

        this.AddUnderline();

        this.area = DomHelper.AppendElement(this.panel, Elements.InfoArea);
        this.leftSide = DomHelper.AppendElement(this.area, Elements.LeftSide);
        this.rightSide = DomHelper.AppendElement(this.area, Elements.RightSide);

        this.leftInfo = DomHelper.AppendElement(this.leftSide, Elements.LeftInfo);
        this.rightInfo = DomHelper.AppendElement(this.rightSide, Elements.RightInfo);

        this.AddMenu(MenuMain, DEFAULT_HELP);

        this.cursorSpeed = {X: 0, Y: 0};
    }

    async Create()
    {
        this.clearScene();
        const galaxyIndexPath = this.gameCtx.dataPath + "/universe/index.yaml";
        const galaxyIndex = await jsYaml.fetch(galaxyIndexPath);
        const galaxyId = galaxyIndex.galaxies[this.gameCtx.playerCtx.galaxy];

        this.title.textContent = "System Chart " + (Number.parseInt(galaxyId.replace("g", "")) + 1);

        const galaxyDataPath = this.gameCtx.dataPath + "/universe/" + galaxyId + ".yaml";
        this.galaxyData = await jsYaml.fetch(galaxyDataPath);
        this.currentSystem = this.galaxyData.systems[this.gameCtx.playerCtx.visiting];
        this.selectedSystem = this.galaxyData.systems[this.gameCtx.playerCtx.selected];

        //this.logDistances();

        let range =  this.gameCtx.playerCtx.fuel  / LIGHT_YEARS_PER_COORD;  //light years : gal coords
        this.rangeCircleRadius = range / this.chartScaleX;      
  
        this.initUnlabelledChart();
        this.initLabelledChart();

        this.visibleCanvas.addEventListener("click", this.onCanvasClicked.bind(this));
        this.interpolateOffset();
        this.drawFrame(this.visibleCtx);

        this.displaySelectedSystemInfo();
    }

    initUnlabelledChart()
    {
        this.calculateSystemCanvasPositions();
        this.calculateCssColors();
        this.drawVisitedSystemMarker(this.unlabelledCtx);
        this.drawChart(this.unlabelledCtx);  
    }

    initLabelledChart()
    {
        //blit to the labelled canvas
        this.labelledCtx.drawImage(this.unlabelledCanvas, 0, 0);
        this.renderLabels(this.labelledCtx);
    }

    calculateSystemCanvasPositions()
    {
        for (const [name, system] of Object.entries(this.galaxyData.systems)) 
        {
            system.name = name;
            system.drawRadius = Math.floor(system.size * STAR_RADIUS_SCALE);             

            system.canvasX = system.location[0] / this.chartScaleX;
            system.canvasY = system.location[1] / this.chartScaleY;

            this.calculateZoomInOffset(system);
        } //for each system
    }

    calculateZoomInOffset(system)
    { 
        const totalMargin = CHART_MARGIN_X + this.rangeCircleRadius + (RANGE_CIRCLE_LINE_WIDTH * 2);
        const minX = system.canvasX - totalMargin;
        const maxX = system.canvasX + totalMargin;
        const minY = system.canvasY - totalMargin;
        const maxY = system.canvasY + totalMargin;

        system.zoomInOffset = { X: 0,Y: 0};

        if (minX < 0)
        {
            system.zoomInOffset.X = minX;
        }
        else if (maxX > this.visibleCanvas.width)
        {
            system.zoomInOffset.X = this.visibleCanvas.width - maxX;
        }

        if (minY < 0)
        {
            system.zoomInOffset.Y = minY; 
        }
        else if (maxY > this.visibleCanvas.height)
        {
            system.zoomInOffset.Y = this.visibleCanvas.height - maxY;
        }
    }

    calculateCssColors()
    {
        for (const [name, system] of Object.entries(this.galaxyData.systems)) 
        {
            const v = new Vector(3);
            v.set([system.color[0],system.color[1], system.color[2]]);
            system.cssColor = v.AsCSSColor();
        }        
    }

    drawChart(targetCtx)
    {
        for (const [name, system] of Object.entries(this.galaxyData.systems)) 
        {
            targetCtx.fillStyle = system.cssColor;

            targetCtx.beginPath();
            targetCtx.arc(system.canvasX, system.canvasY, system.drawRadius, 0, Math.PI*2, true);
            targetCtx.closePath();
            targetCtx.fill();
        }
    }

    renderLabels(targetCtx, labelSize = 20, labelMatch = "")
    {
        //now add the labels
        targetCtx.font = labelSize + "px Arial";
        targetCtx.fillStyle = "yellow";

        for (const [name, system] of Object.entries(this.galaxyData.systems)) 
        {
            if (labelMatch === "" || name.toLowerCase().startsWith(labelMatch.toLowerCase()))
            {
                let textX = system.canvasX + system.drawRadius;
                let textY = system.canvasY - system.drawRadius;
                targetCtx.fillText(name, textX, textY);
            }
        }
    }

    drawVisitedSystemMarker(targetCtx)
    {
       //draw location circle  
       targetCtx.strokeStyle  = "green";
       targetCtx.lineWidth  = RANGE_CIRCLE_LINE_WIDTH;
       
       //location circle
       targetCtx.beginPath();
       targetCtx.arc(this.currentSystem.canvasX, this.currentSystem.canvasY, this.rangeCircleRadius, 0, Math.PI*2, true);

       //location crosshairs
       targetCtx.moveTo(this.currentSystem.canvasX - LOCATION_CROSSHAIR_SIZE, this.currentSystem.canvasY);
       targetCtx.lineTo(this.currentSystem.canvasX + LOCATION_CROSSHAIR_SIZE, this.currentSystem.canvasY);
       
       targetCtx.moveTo(this.currentSystem.canvasX, this.currentSystem.canvasY - LOCATION_CROSSHAIR_SIZE);
       targetCtx.lineTo(this.currentSystem.canvasX, this.currentSystem.canvasY + LOCATION_CROSSHAIR_SIZE);
       
       targetCtx.stroke();

    }

    drawCursor(targetCtx)
    { 
        const SELECTION_CROSSHAIR_START = 6;
        const SELECTION_CROSSHAIR_FINISH = 18;   
        
        this.cursor = this.cursor || {
            X: this.selectedSystem.canvasX,
            Y: this.selectedSystem.canvasY
        };

        targetCtx.strokeStyle  = "red";
        targetCtx.lineWidth  = RANGE_CIRCLE_LINE_WIDTH;

        //location crosshairs
        targetCtx.beginPath();

       //right
       targetCtx.moveTo(this.cursor.X + SELECTION_CROSSHAIR_START, this.cursor.Y);
       targetCtx.lineTo(this.cursor.X + SELECTION_CROSSHAIR_FINISH, this.cursor.Y);

       //left
       targetCtx.moveTo(this.cursor.X - SELECTION_CROSSHAIR_START, this.cursor.Y);
       targetCtx.lineTo(this.cursor.X - SELECTION_CROSSHAIR_FINISH, this.cursor.Y);
       
        //up
        targetCtx.moveTo(this.cursor.X, this.cursor.Y - SELECTION_CROSSHAIR_START);
        targetCtx.lineTo(this.cursor.X, this.cursor.Y - SELECTION_CROSSHAIR_FINISH);

        //down
        targetCtx.moveTo(this.cursor.X, this.cursor.Y + SELECTION_CROSSHAIR_START);
        targetCtx.lineTo(this.cursor.X, this.cursor.Y + SELECTION_CROSSHAIR_FINISH);

       targetCtx.stroke();
    }


    interpolateZoomScale()
    {
        const deltaT = this.gameCtx.t.delta;
        const deltaZoom = this.zoomDelta * deltaT * this.zoomDirection;
        this.zoomScale += deltaZoom;
        
        if (this.zoomScale < ZOOM_OUT_SCALE)
        {
            this.zoomScale = ZOOM_OUT_SCALE;
        }
        else if (this.zoomScale > ZOOM_IN_SCALE)
        {
            this.zoomScale = ZOOM_IN_SCALE;
        } 
    }

    interpolateOffset()
    {
        let offsetMulitiplier =  (ZOOM_OUT_SCALE - this.zoomScale) / (ZOOM_OUT_SCALE - ZOOM_IN_SCALE);

        this.offset = {
            X: this.selectedSystem.zoomInOffset.X * offsetMulitiplier,
            Y: this.selectedSystem.zoomInOffset.Y * offsetMulitiplier
        };

        //console.log("offset multiplier", offsetMulitiplier, offset, this.zoomScale);

        // //TODO: adding border overflows to the right + bottom. solve before uncommenting
        //const borderMultiplier = 1 - offsetMulitiplier;
        // let border = {
        //     X: CHART_MARGIN_X * borderMultiplier,
        //     Y: CHART_MARGIN_Y * borderMultiplier
        // }
        // //console.log("border multiplier", borderMultiplier, border, this.zoomScale);
        // offset.X += border.X;
        // offset.Y += border.Y;
    }

    onCanvasClicked(event)
    {
        const offset = this.offset; 

        this.cursor.X = (event.offsetX - this.offset.X) /  this.zoomScale;
        this.cursor.Y = (event.offsetY - this.offset.Y) /  this.zoomScale;
        const sys = this.galaxyData.systems.Rebia;
        //debugger;
        
        this.selectNearestSystem();
    }

    drawFrame(targetCtx)
    {
        let sourceCanvas = (this.zoomScale <= LABEL_DISAPPEARANCE_ZOOM) ? this.unlabelledCanvas : this.labelledCanvas;

        targetCtx.clearRect(0, 0, this.visibleCanvas.width, this.visibleCanvas.height);
        targetCtx.save();

        targetCtx.setTransform(this.zoomScale, SKEW_NONE, SKEW_NONE, this.zoomScale, this.offset.X, this.offset.Y);
        targetCtx.drawImage(sourceCanvas, 0, 0);
        this.drawCursor(targetCtx);

        targetCtx.restore();
    }

    showDistances()
    {
        for (const [name, system] of Object.entries(this.galaxyData.systems)) 
        {
            const distance = this.lightYearsApart(this.currentSystem, system);
            if (distance < 10)
            {
                //distance = Math.round(distance * 100) / 100;
                console.log(name, distance.toFixed(1));
            }
        }
    }

    lightYearsApart(systemA, systemB)
    {
        let dx = systemA.location[0] - systemB.location[0];
        let dy = systemA.location[1] - systemB.location[1];

        dy = dy / 2.0;
        let distance = Math.hypot(dx, dy);
        //emulate original rounding error to get classic distances
        distance = Math.floor(distance);            
        //scale of coords to light years:
        distance = distance * LIGHT_YEARS_PER_COORD;
        return distance;
    }

    onKey(event)
    {
        console.log("key", event.key, event.type);

        if (event.key === "6" && event.type === "keydown")
        {
            this.desiredZoomScale = (this.zoomScale === 1) ? 0.25: 1;
            this.zoomDirection = Math.sign(this.desiredZoomScale - this.zoomScale); 
        }
        else if (ARROW_KEYS.indexOf(event.key) > -1)
        {
            this.changeCursorVelocity(event);
            event.preventDefault();
        }

    }
    
    changeCursorVelocity(event)
    {
        //CURSOR_MOVE_RATE
        let rate = event.type === "keydown" ? CURSOR_MOVE_RATE : 0; //key up means stop

        this.cursorSpeed.X = (event.key === "ArrowRight") ? rate: this.cursorSpeed.X;
        this.cursorSpeed.X = (event.key === "ArrowLeft") ? -rate: this.cursorSpeed.X;
        this.cursorSpeed.Y = (event.key === "ArrowDown") ? rate: this.cursorSpeed.Y;
        this.cursorSpeed.Y = (event.key === "ArrowUp") ? -rate: this.cursorSpeed.Y;

        this.cursorIsMoving = (this.cursorSpeed.X !== 0 || this.cursorSpeed.Y !== 0);

        if (event.type === "keyup" && this.cursorIsMoving === false)
        {   
            this.selectNearestSystem();
        }
    }

    animate(gameCtx)
    {
        if (this.desiredZoomScale !== this.zoomScale)
        {
            this.interpolateZoomScale();
            this.redrawNeeded = true;
        }

        if (this.cursorIsMoving === true)
        {
            this.moveCursor();
            this.redrawNeeded = true;
        }

        if (this.redrawNeeded === true)
        {
            this.interpolateOffset();
            this.drawFrame(this.visibleCtx);
            this.redrawNeeded = false;
        }
    }

    moveCursor()
    {
        this.cursor.X += this.cursorSpeed.X;
        this.cursor.Y += this.cursorSpeed.Y;

        //TODO: cursor can go off canvas when zoomed out: get min and max star location and constrain to those instead
        this.cursor.X = (this.cursor.X < 0) ? 0: this.cursor.X;
        this.cursor.X = (this.cursor.X > this.unlabelledCanvas.width) ? this.unlabelledCanvas.width: this.cursor.X;
        this.cursor.Y = (this.cursor.Y < 0) ? 0: this.cursor.Y;
        this.cursor.Y = (this.cursor.Y > this.unlabelledCanvas.height) ? this.unlabelledCanvas.height: this.cursor.Y;
    }

    selectNearestSystem()
    {
        let nearestSystem = this.selectedSystem;
        let nearestDistance = Number.MAX_SAFE_INTEGER;

        for (const [name, system] of Object.entries(this.galaxyData.systems)) 
        {
            system.name = name;
            const distanceFromCursor = Math.hypot(system.canvasX - this.cursor.X, 
                                                    system.canvasY - this.cursor.Y);
            if (distanceFromCursor < nearestDistance)
            {
                nearestSystem = system;
                nearestDistance = distanceFromCursor;
            }
        }

        //debugger;
        this.selectedSystem = nearestSystem;

        console.log("selected system ", this.selectedSystem.name);
        this.cursor = {
            X: this.selectedSystem.canvasX,
            Y: this.selectedSystem.canvasY
        };

        this.displaySelectedSystemInfo();
        this.redrawNeeded = true;
    }

    displaySelectedSystemInfo()
    {
        this.leftInfo.textContent = this.selectedSystem.name;
        const lyDistance = this.lightYearsApart(this.currentSystem, this.selectedSystem)
        let distanceMessage = "";
        if (lyDistance > 0)
        {
            distanceMessage = "Distance: " + lyDistance.toFixed(1) + " Light Years";
        }
        this.rightInfo.textContent = distanceMessage;
    }
};

const Styles = {
    ChartCanvas: {
        backgroundColor: "black",
        cursor: "crosshair"
    },
    InfoArea: {
        flexGrow: 1,
        alignSelf: "stretch",
        alignItems: "flex-start"
    },
    LeftSide: {
        flexGrow: 1,
        alignSelf: "stretch",
        alignItems: "flex-start"
    },
    RightSide: {
        flexGrow: 1,
        alignSelf: "stretch",
        alignItems: "flex-end"
    },
    Info: {
        minWidth: "220px",
        backgroundColor: "transparent",
        margin: "5px",
        color: "yellow"
    },
    Left: {
        textAlign: "left"
    },
    Right: {
        textAlign: "right"
    }
};

const Elements = {
    ChartCanvas: {
        tag: "canvas",
        styles: Styles.ChartCanvas
    },
    InfoArea: {
        tag: "div",
        classes: "flex-across",
        styles: Styles.InfoArea
    },
    LeftSide: {
        tag: "div",
        classes: "flex-down",
        styles: Styles.LeftSide
    },
    RightSide: {
        tag: "div",
        classes: "flex-down",
        styles: Styles.RightSide
    },
    LeftInfo: {
        tag: "p",
        classes: "bold",
        styles: [Styles.Info, Styles.Left]
    },
    RightInfo: {
        tag: "p",
        classes: "bold",
        styles: [Styles.Info, Styles.Right]
    }
}

const MenuMain = [
    {
        caption: "Go Back",
        event: "changeView",
        detail: { to: "Welcome" },
        help: "select a classification and item from the upper menus"
    }
];


