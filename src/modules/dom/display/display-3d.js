import * as THREE from "../../three/Three.js"
import { OrbitControls } from "../../three/controls/OrbitControls.js";

export default class Display3d
{
    Renderer;
    Camera;
    Scene;
    Light;
    Controls;

    constructor()
    {  
        this.AddRenderer();
        this.AddCamera();
        this.AddOrbitControls();
        this.AddScene();
        this.AddLight();  
    }

    AddRenderer()
    {
        this.Renderer = new THREE.WebGLRenderer();
        this.Renderer.setSize( window.innerWidth, window.innerHeight);
        document.body.appendChild( this.Renderer.domElement);
        this.Renderer.domElement.style.position = "absolute";
        //this.Renderer.domElement.style.zIndex = -1;
        document.body.addEventListener("keypress", this.onKeyPress.bind(this));
    }

    AddCamera(options = {}) 
    {
        options.fov = options.fov || 45;
        options.near = options.near || 0.1;
        options.far = options.far || 2000;
        options.position = options.position || [0, 0, 300];
        options.lookAt = options.lookAt || [0, 0, 0];

        const aspect = window.innerWidth / window.innerHeight;
        this.Camera = new THREE.PerspectiveCamera(options.fov, aspect, options.near, options.far);

        this.Camera.position.set(...options.position);
        this.Camera.lookAt(...options.lookAt);
    }

    AddScene(options = {}) 
    {
        options.backgroundColor = options.backgroundColor || 0x000000;
        this.Scene = new THREE.Scene();
        const color = new THREE.Color( options.backgroundColor )
        this.Scene.background = new THREE.Color(color);
    }

    AddLight(options = {}) 
    {
        options.color = options.color || 0xffffff;
        options.position = options.position || [100, 100, 200];

        this.Light = new THREE.PointLight(options.color);
        this.Light.position.set(options.position);
        this.Light.castShadow = true;
        this.Camera.add(this.Light);
    }

    AddOrbitControls() {
        this.Controls = new OrbitControls(this.Camera, this.Renderer.domElement);
        this.Controls.autoRotate = true;        
    }

    Resize()
    {
        if (this.Camera)
        {
            this.Camera.aspect = window.innerWidth / window.innerHeight;
            this.Camera.updateProjectionMatrix();
        }
        if (this.Renderer)
        {
            this.Renderer.setSize( window.innerWidth, window.innerHeight );
        }
    }

    Clear()
    {
        if (this.Scene)
        {
            this.Scene.clear();
        }
        if (this.Camera)
        {
            this.Camera.clear();
        }
    }

    StartAnimating()
    {
        this._boundAnimateFunc = this.animate.bind(this);
        //setTimeout(this._boundAnimateFunc, 500);
        this._boundAnimateFunc();
    }

    onKeyPress(event)
    {
        console.log("pressed [" + event.key + "]");
        if (event.key === ' ')
        {
            this.Controls.autoRotate = !this.Controls.autoRotate;
        }
    }

    animate() 
    {
        //TODO: game logic here
        if (this.Controls)
        {
            this.Controls.update();
        }
        this.Renderer.render(this.Scene, this.Camera);    
        requestAnimationFrame(this._boundAnimateFunc);
    }

    updateFrameRate(now)
    {
        $fps.frames++;
        $fps.delta += $t.delta;
        if ($fps.delta > 1.0)
        {
            //console.log($fps.frames, $fps.delta);
            document.title = "fps: " + ($fps.frames/$fps.delta).toFixed(1);
            $fps.frames = 0;
            $fps.delta = 0;
        }       
    }
}

