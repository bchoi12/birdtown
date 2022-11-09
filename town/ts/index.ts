import { Engine, NullEngine, Scene, ArcRotateCamera, HemisphericLight, Vector3, MeshBuilder, Mesh } from "babylonjs";

var canvas: any = document.getElementById("game");
var engine: Engine = new Engine(canvas, false);

function createScene(): Scene {
    var scene: Scene = new Scene(engine);

    var camera: ArcRotateCamera = new ArcRotateCamera("Camera", Math.PI / 2, Math.PI / 2, 2, Vector3.Zero(), scene);
    camera.attachControl(canvas, true);

    var light1: HemisphericLight = new HemisphericLight("light1", new Vector3(1, 1, 0), scene);
    var sphere: Mesh = MeshBuilder.CreateSphere("sphere", { diameter: 1, updatable: false }, scene);

    return scene;
}

var scene: Scene = createScene();

engine.runRenderLoop(() => {
    document.getElementById("fps").innerHTML = engine.getFps().toFixed() + " fps";
    scene.render();
});