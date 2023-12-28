import LessEl from '../lessel/less-el.js';
import StyleSheet from '../lessel/stylesheet.js';
import mainStylesheet from '../obelite/main-stylesheet.js';
import Language from '../obelite/language-en.js';
import LayoutStyles from '../obelite/layout-styles.js';
import Menu from '../components/menu.js';
import WebGPUCanvas from '../webgpu/webgpu-canvas.js';
import SceneGraph from '../3d/scene-graph.js';
//import MgScript from '../mgscript/mgscript.js';

export default class IndexPage {

    
    sceneGraph;
    gpuContext;

    constructor() {
        this.styleSheet = new StyleSheet(document.head);
        this.styleSheet.AddSheet(mainStylesheet);
    }

    async Begin() {

        this.gpuContext = {
            adapter: await navigator.gpu?.requestAdapter(),
            features: [],
            pipelines: {}
        };
        this.gpuContext.adapter.features.forEach(feature => {
            this.gpuContext.features.push(feature);
        });
        this.gpuContext.device = await this.gpuContext.adapter?.requestDevice();

        if (!this.gpuContext.device) {
            //TODO: navigate to no-gpu.html
            throw new Error("WebGPU not supported on this browser.");
        }
        
        this.gpuContext.canvasFormat = navigator.gpu.getPreferredCanvasFormat();
        //console.log("gpuContext", this.gpuContext);

        const page = await LessEl.Create(document.body, mainPageDef);
        document.body.addEventListener("GameEvent", this.onGameEvent.bind(this));

        await page.named.WebGPU.Configure(this.gpuContext);
        this.sceneGraph = new SceneGraph(this.gpuContext);

        const start = performance.now();
        await this.sceneGraph.AddNode('../meshes/cobra-mesh.js');
        const end = performance.now();
        console.log("mesh load time", end - start, "ms");
        this.sceneGraph.Draw();

        document.body.addEventListener("keyup", this.onKeyUp.bind(this));
    }

    onGameEvent(event) {
        switch(event.detail.action){
            case "navigate":
                document.location.href = event.detail.target;
                break;
            default:
                throw "action not recognized " + event.detail.action;
        }
    }

    onKeyUp(event) {
        const changed = this.sceneGraph.onKeyUp(event);
        if (changed) {
            requestAnimationFrame(this.animationFrame.bind(this));
        }
    }

    animationFrame(a, b, c) {
        this.sceneGraph.Draw();
    }
}

const mainPageDef = {
    tag: 'main',
    styles: {
        extends: LayoutStyles.FlexToptoBottomCenteredH,
        backgroundColor: 'transparent',
        minWidth: '800px',
        maxWidth: '800px',
        height: '100%',
        gap: '6px'
    },
    kids: [{
        name: "WebGPU",
        tag: "canvas",
        styles: {
            zIndex: -1,
            position: "absolute",
            backgroundColor: "purple"
        },
        gpu: {},
        wrapper: WebGPUCanvas
    },{
        tag: 'h1',
        name: 'title',
        text: Language.Home.Title
    }, {
        tag: 'hr',
        styles: {
            margin: 0,
            borderWidth: '2px',
            borderStyle: 'solid',
            borderColor: '-underlineColor',
            width: '100%'
        }
    }, {
        tag: 'p',
        text: Language.Home.ByOb1Inspired,
        styles: {
            marginTop: '10px',
            color: '-mutedTextColor'
        }
    }, {
        styles: {
            flexGrow: 1
        }
    }, {
        tag: 'nav',
        name: 'Menu',
        styles: {
            extends: LayoutStyles.FlexToptoBottomCenteredH,
            padding: 0,
            width: '400px',
            gap: '6px',
        },
        //wrapper: Menu,
        itemDefinition: {
            tag: 'button',
            classes: 'MenuButton'
        },
        helpItem: {
            tag: 'div',
            styles: {
                color: '-helpTextColor',
                fontStyle: 'italic'
            }
        },
        menuItems: [{
            text: Language.ShipLibraryView.Menu,
            help: Language.ShipLibraryView.MenuInfo,
            event: {action: 'navigate', target: './ship-library.html'}
        }, {
            text: Language.GalacticChartView.Menu,
            help: Language.GameOptionsView.MenuInfo,
            event: {action: 'navigate', target: './galactic-chart.html'}
        }, {
            text: Language.LoadCommanderView.Menu,
            help: Language.LoadCommanderView.MenuInfo,
            event: {action: 'navigate', target: './load-commander.html'}            
        }, {
            text: Language.NewCommanderView.Menu,
            help: Language.NewCommanderView.MenuInfo,
            event: {action: 'navigate', target: './new-commander.html'}            
        }, {
            text: Language.GameOptionsView.Menu,
            help: Language.GameOptionsView.MenuInfo,
            event: {action: 'navigate', target: './game-options.html'}
        }]
    }]
}

const p = new IndexPage();
p.Begin();
