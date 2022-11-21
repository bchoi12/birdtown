import * as BABYLON from "babylonjs";
import * as MATTER from "matter-js"

import { Camera } from 'game/camera'
import { Data, DataFilter, DataMap } from 'game/data'
import { Entity, EntityType } from 'game/entity'
import { EntityMap } from 'game/entity_map'

import { ChannelMap } from 'network/channel_map'
import { Client } from 'network/client'
import { Connection, ChannelType } from 'network/connection'
import { Host } from 'network/host'
import { Message, MessageType } from 'network/message'

import { Html } from 'ui/html'

interface GameOptions {
	host : boolean;
}

class Game {
	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.ALL, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

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
			this._connection.addRegisterCallback((name : string) => {
				const filter = DataFilter.ALL;
				const [message, has] = this.entityMessage(filter, this._seqNum);
				if (!has) return;

				this._connection.send(name, Game._channelMapping.get(filter), message);
			});
		} else {
			this._connection = new Client("slothman333", "bossman69");
		}
		this._connection.addMessageCallback(MessageType.ENTITY, (msg : Message) => {
			this._entityMap.pushData({
				dataMap: <DataMap>msg.D,
				seqNum: msg.S,
			});
		});
		this._connection.initialize();

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);

	    if (options.host) {
	    	let player = this._entityMap.add(EntityType.PLAYER, {});
	    	player.profile().setPos({x: 0, y: 10});
		    let wall = this._entityMap.add(EntityType.WALL, {});
		    wall.profile().setPos({x: 0, y: 0});
	    }

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
	    	this._entityMap.finalize(millis);

	    	this._entityMap.updateData(this._seqNum);

	    	for (const filter of [DataFilter.TCP, DataFilter.ALL]) {
    			const [message, has] = this.entityMessage(filter, this._seqNum);
    			if (has) {
    				this._connection.broadcast(Game._channelMapping.get(filter), message);
	    		}
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

	private entityMessage(filter : DataFilter, seqNum : number) : [Message, boolean] {
		const data = this._entityMap.filteredData(filter);
		if (Object.keys(data).length === 0) {
			return [null, false];
		}
		return [{
			T: MessageType.ENTITY,
			S: seqNum,
			D: data,
		}, true];
	}
}

export const game = new Game();