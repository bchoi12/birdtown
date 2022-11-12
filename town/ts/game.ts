import * as BABYLON from "babylonjs";

import { Entity } from 'game/entity'
import { Html } from 'ui/html'

interface GameOptions {
	headless : boolean;
}

export class Game {

	private _canvas : HTMLCanvasElement;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;

	private _scene : BABYLON.Scene;

	private _camera : BABYLON.FreeCamera;

	private _lastRenderTime : number;

	private _test : Entity;

	constructor(options : GameOptions) {
		this._canvas = Html.canvasElm(Html.canvasGame);

		if (options.headless) {
			this._engine = new BABYLON.NullEngine();
		} else {
			this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);
		}
		this._scene = new BABYLON.Scene(this._engine);

		this._scene.enablePhysics(new BABYLON.Vector3(0, -1, 0), new BABYLON.CannonJSPlugin());

		this._camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, -20), this._scene);
	    this._camera.setTarget(BABYLON.Vector3.Zero());
    	this._camera.attachControl(this._canvas, true);

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);
	    const sphere = BABYLON.MeshBuilder.CreateSphere("sphere", { diameter: 1, updatable: false }, this._scene);
	    sphere.position.y = 2;
	    sphere.physicsImpostor = new BABYLON.PhysicsImpostor(sphere, BABYLON.PhysicsImpostor.SphereImpostor, { mass: 1, restitution: 0.9 }, this._scene);

	    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 16, height: 16}, this._scene);
	    ground.physicsImpostor = new BABYLON.PhysicsImpostor(ground, BABYLON.PhysicsImpostor.BoxImpostor, { mass: 0, restitution: 0.9 }, this._scene);


	    this._test = new Entity(0, 0);

	    this._lastRenderTime = Date.now();
	    this._engine.runRenderLoop(() => {
	    	this._test.update(this.timestep());
	    	this._scene.render();

		    this._lastRenderTime = Date.now();
	    });
	}

	scene() : BABYLON.Scene { return this._scene; }
	engine() : BABYLON.Engine { return this._engine; }

	timestep() : number { return Date.now() - this._lastRenderTime; }
}