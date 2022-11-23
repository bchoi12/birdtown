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
import { defined, isDev } from 'util/common'

interface GameOptions {
	name : string;
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
	private _id : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _physics : MATTER.Engine;

	private _scene : BABYLON.Scene;
	private _entityMap : EntityMap;
	private _camera : Camera;
	private _connection : Connection;

	private _hostSeqNum : number;
	private _seqNum : number;
	private _updateSpeed : number;
	private _lastRenderTime : number;
	private _lastId : number;

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
			this._id = 1;
			this._lastId = 1;

			this._connection = new Host("bossman69");
			this._connection.addRegisterCallback((name : string) => {
				this.registerClient(name);
			});
		} else {
			this._connection = new Client(options.name, "bossman69");
			this._connection.addMessageCallback(MessageType.NEW_CLIENT, (msg : Message) => {
				if (!defined(msg.I) || !defined(msg.N)) {
					console.error("Invalid message: ", msg);
					return;
				}

				if (msg.N === this._connection.peer().id) {
					this._id = msg.I;

					if (isDev()) {
						console.log("Got id: " + this._id);
					}
				}
			});
		}
		this._connection.addMessageCallback(MessageType.ENTITY, (msg : Message) => {
			if (!defined(msg.D) || !defined(msg.S)) {
				console.error("Invalid message: ", msg);
				return;
			}
			this._entityMap.pushData({
				dataMap: <DataMap>msg.D,
				seqNum: msg.S,
			});

			if (!options.host && msg.S > this._hostSeqNum) {
				this._hostSeqNum = msg.S;
				this._seqNum = msg.S;
			}
		});
		this._connection.initialize();

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);

	    if (options.host) {
	    	this._entityMap.add(EntityType.PLAYER, {
	    		clientId: this.id(),
	    		pos: {x: 0, y: 10},
	    	});
		    this._entityMap.add(EntityType.WALL, {
		    	pos: {x: 0, y: 0},
		    });
	    }

	    this._hostSeqNum = 1;
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
	hasId() : boolean { return defined(this._id); }
	id() : number { return this.hasId() ? this._id : -1; }
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

	private registerClient(name : string) : void {
		const id = this.nextId();
		this._connection.setId(name, id);
		this._connection.broadcast(ChannelType.TCP, {
			T: MessageType.NEW_CLIENT,
			N: name,
			I: id,
		});

    	this._entityMap.add(EntityType.PLAYER, {
    		clientId: id,
    		pos: {x: 0, y: 10},
    	});

		const filter = DataFilter.ALL;
		const [message, has] = this.entityMessage(filter, this._seqNum);
		if (!has) return;
		this._connection.send(name, Game._channelMapping.get(filter), message);
	}

	private nextId() : number {
		return ++this._lastId;
	}
}

export const game = new Game();