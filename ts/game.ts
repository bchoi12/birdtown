import * as BABYLON from "babylonjs";
import * as MATTER from "matter-js"

import { Camera } from 'game/camera'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity, EntityType } from 'game/entity'
import { EntityMap } from 'game/entity_map'

import { Client } from 'network/client'
import { Connection, ChannelType } from 'network/connection'
import { Host } from 'network/host'
import { Message, MessageType } from 'network/message'

import { Html } from 'ui/html'

interface GameOptions {
	host : boolean;
}

class Game {
	private _canvas : HTMLCanvasElement;

	private _options : GameOptions;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _physics : MATTER.Engine;

	private _scene : BABYLON.Scene;
	private _entityMap : EntityMap;
	private _camera : Camera;
	private _connection : Connection;

	private _seqNum : number;
	private _updateSpeed : number;
	private _lastRenderTime : number;

	constructor() {
		this._canvas = Html.canvasElm(Html.canvasGame);
	}

	initialize(options : GameOptions) {
		this._options = options;

		// this._engine = new BABYLON.NullEngine();
		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);

		this._physics = MATTER.Engine.create({
			gravity: {
				y: -0.2,
			}
		});

		this._scene = new BABYLON.Scene(this._engine);
		this._entityMap = new EntityMap();
		this._camera = new Camera();
		if (options.host) {
			this._connection = new Host("bossman69");
			this._connection.addCallback(MessageType.ENTITY, (msg : Message) => {
				this._entityMap.pushData({
					dataMap: <DataMap>msg.D,
					seqNum: msg.S,
				});
			});
		} else {
			this._connection = new Client("slothman333", "bossman69");
			this._connection.addCallback(MessageType.ENTITY, (msg : Message) => {
				this._entityMap.pushData({
					dataMap: <DataMap>msg.D,
					seqNum: msg.S,
				});
			});
		}

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

	    	const tcp = this._entityMap.data(DataFilter.TCP, this._seqNum);
	    	if (Object.keys(tcp).length > 0) {
		    	this._connection.send(ChannelType.TCP, {
		    		T: MessageType.ENTITY,
		    		S: this._seqNum,
		    		D: tcp,
		    	});
	    	}

	    	const udp = this._entityMap.data(DataFilter.UDP, this._seqNum);
	    	if (Object.keys(udp).length > 0) {
		    	this._connection.send(ChannelType.UDP, {
		    		T: MessageType.ENTITY,
		    		S: this._seqNum,
		    		D: udp,
		    	});
	    	}

	    	this._seqNum++;
		    this._lastRenderTime = Date.now();
	    });
	}

	canvas() : HTMLCanvasElement { return this._canvas; }
	options() : GameOptions { return this._options; }
	scene() : BABYLON.Scene { return this._scene; }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : MATTER.Engine { return this._physics; }
	entities() : EntityMap { return this._entityMap; }
	updateSpeed() : number { return this._updateSpeed; }
	timestep() : number { return this._updateSpeed * (Date.now() - this._lastRenderTime); }
}

export const game = new Game();