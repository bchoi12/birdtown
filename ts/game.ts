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
import { defined, isLocalhost } from 'util/common'
import { StatsTracker } from 'util/stats_tracker'

interface GameOptions {
	name : string;
	hostName : string;

	host : boolean;
}

class Game {
	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.ALL, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private _initialized : boolean;
	private _canvas : HTMLCanvasElement;

	private _options : GameOptions;
	private _id : number;
	private _lastId : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _physics : MATTER.Engine;

	private _scene : BABYLON.Scene;
	private _entityMap : EntityMap;
	private _camera : Camera;
	private _connection : Connection;

	private _hostSeqNum : number;
	private _seqNum : number;

	constructor() {
		this._initialized = false;
		this._canvas = Html.canvasElm(Html.canvasGame);
	}

	initialize(options : GameOptions) {
		this._options = options;

		// this._engine = new BABYLON.NullEngine();
		// TODO: fast anti-alias
		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);
		window.onresize = () => { this.resize(); };

		this._physics = MATTER.Engine.create({
			gravity: { y: 0 }
		});

		this._scene = new BABYLON.Scene(this._engine);
		this._scene.useRightHandedSystem = true;

		this._entityMap = new EntityMap();
		this._camera = new Camera();
		if (options.host) {
			this._id = 1;
			this._lastId = 1;

			this._connection = new Host(options.name);
			this._connection.addRegisterCallback((name : string) => {
				this.registerClient(name);
			});
		} else {
			this._connection = new Client(options.name, options.hostName);
			this._connection.addMessageCallback(MessageType.NEW_CLIENT, (peer : string, msg : Message) => {
				if (!defined(msg.I) || !defined(msg.N)) {
					console.error("Invalid message: ", msg);
					return;
				}

				if (msg.N === this._connection.peer().id) {
					this._id = msg.I;

					if (isLocalhost()) {
						console.log("Got client id: " + this._id);
					}
				}
			});
		}
		this._connection.addMessageCallback(MessageType.ENTITY, (peer : string, msg : Message) => {
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
		    	dim: {x: 16, y: 1},
		    });
	    }

	    this._hostSeqNum = 1;
	    this._seqNum = 1;
	    this._engine.runRenderLoop(() => {
	    	this._entityMap.update();
	    	this._camera.update();
	    	this._entityMap.render(this._scene);
	    	this._entityMap.updateData(this._seqNum);

	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
    			const [message, has] = this.entityMessage(filter, this._seqNum);
    			if (has) {
    				this._connection.broadcast(Game._channelMapping.get(filter), message);
	    		}
	    	}

	    	this._seqNum++;
	    });

	    this._initialized = true;
	}

	resize() : void { this._engine.resize(); }

	initialized() : boolean { return this._initialized; }
	canvas() : HTMLCanvasElement { return this._canvas; }
	hasId() : boolean { return defined(this._id); }
	id() : number { return this.hasId() ? this._id : -1; }
	options() : GameOptions { return this._options; }
	scene() : BABYLON.Scene { return this._scene; }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : MATTER.Engine { return this._physics; }
	camera() : Camera { return this._camera; }
	entities() : EntityMap { return this._entityMap; }
	connection() : Connection { return this._connection; }

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
		if (!this.options().host) {
			console.error("Error: client called nextId()");
			return -1;
		}

		return ++this._lastId;
	}
}

export const game = new Game();