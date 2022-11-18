import * as BABYLON from "babylonjs";
import * as MATTER from "matter-js"

import { DataFilter } from 'game/data'
import { Entity, EntityType } from 'game/entity'
import { EntityMap } from 'game/entity_map'
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
	private _entityMap : EntityMap;

	private _camera : BABYLON.FreeCamera;

	private _seqNum : number;
	private _updateSpeed : number;
	private _lastRenderTime : number;

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
		this._entityMap = new EntityMap();

		this._camera = new BABYLON.FreeCamera("camera", new BABYLON.Vector3(0, 10, -20), this._scene);
	    this._camera.setTarget(BABYLON.Vector3.Zero());
    	this._camera.attachControl(this._canvas, true);

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);

	    this._entityMap.add(EntityType.PLAYER, {
	    	pos: {x: 0, y: 10},
	    });
	    this._entityMap.add(EntityType.WALL, {
	    	pos: {x: 0, y: 0},
	    });

	    this._seqNum = 1;
	    this._updateSpeed = 1.0;
	    this._lastRenderTime = Date.now();
	    this._engine.runRenderLoop(() => {
	    	const millis = Math.min(this.timestep(), 20);

	    	this._entityMap.update(millis);
	    	this._entityMap.prePhysics(millis);
	    	MATTER.Engine.update(this._physics, millis);
	    	this._entityMap.postPhysics(millis);
			this._entityMap.handleCollisions(MATTER.Detector.collisions(this.physics().detector));

	    	this._scene.render();
	    	this._entityMap.postRender(millis);

	    	this._entityMap.updateData(this._seqNum);
	    	// this._entityMap.data(DataFilter.ALL, this._seqNum);

	    	this._seqNum++;
		    this._lastRenderTime = Date.now();
	    });
	}

	scene() : BABYLON.Scene { return this._scene; }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : MATTER.Engine { return this._physics; }
	entities() : EntityMap { return this._entityMap; }
	updateSpeed() : number { return this._updateSpeed; }
	timestep() : number { return this._updateSpeed * (Date.now() - this._lastRenderTime); }
}

export const game = new Game();