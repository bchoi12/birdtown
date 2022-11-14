import * as BABYLON from "babylonjs";
import * as MATTER from "matter-js"

import { Entity } from 'game/entity'
import { SpacedId } from 'game/spaced_id'
import { Html } from 'ui/html'

import { Player } from 'game/player'
import { Wall } from 'game/wall'

interface GameOptions {
	headless : boolean;
}

class Game {

	private _canvas : HTMLCanvasElement;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;

	private _physics : MATTER.Engine;

	private _scene : BABYLON.Scene;

	private _camera : BABYLON.FreeCamera;

	private _updateSpeed : number;
	private _lastRenderTime : number;

	private _test : Entity;

	constructor() {
		this._canvas = Html.canvasElm(Html.canvasGame);
	}

	initialize(options : GameOptions) {
		if (options.headless) {
			this._engine = new BABYLON.NullEngine();
		} else {
			this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);
		}

		this._physics = MATTER.Engine.create({
			gravity: {
				y: -0.25,
			}
		});

		this._scene = new BABYLON.Scene(this._engine);

		this._camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, -20), this._scene);
	    this._camera.setTarget(BABYLON.Vector3.Zero());
    	this._camera.attachControl(this._canvas, true);

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);

	    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 16, height: 16}, this._scene);

	    this._test = new Wall({
			spacedId: new SpacedId(0, 0),
			pos: { x: 0, y : 0 },
		});

	    const player = new Player({
	    	spacedId: new SpacedId(0, 0),
	    	pos: { x: 0, y: 10 },
	    });

	    this._updateSpeed = 1.0;
	    this._lastRenderTime = Date.now();
	    this._engine.runRenderLoop(() => {
	    	const ts = Math.min(this.timestep(), 20);

	    	this._test.preUpdate(ts);
	    	player.preUpdate(ts);
	    	this._test.update(ts);
	    	player.update(ts);
	    	this._test.postUpdate(ts);
	    	player.postUpdate(ts);

	    	MATTER.Engine.update(this._physics, ts);
	    	this._test.postPhysics(ts);
	    	player.postPhysics(ts);
	    	this._scene.render();
	    	this._test.postRender(ts);
	    	player.postRender(ts);

		    this._lastRenderTime = Date.now();
	    });
	}

	scene() : BABYLON.Scene { return this._scene; }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : MATTER.Engine { return this._physics; }
	updateSpeed() : number { return this._updateSpeed; }
	timestep() : number { return this._updateSpeed * (Date.now() - this._lastRenderTime); }
}

export const game = new Game();