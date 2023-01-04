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

import { options } from 'options'

import { ui } from 'ui'
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
	private _seqNum : number;

	private _options : GameOptions;
	private _id : number;
	private _lastId : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _physics : MATTER.Engine;

	private _scene : BABYLON.Scene;
	private _entityMap : EntityMap;
	private _camera : Camera;
	private _connection : Connection;

	constructor() {
		this._initialized = false;
		this._canvas = Html.canvasElm(Html.canvasGame);
		this._seqNum = 1;
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

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
		this._camera = new Camera(this._canvas, this._scene);

		if (this._options.host) {
			this._id = 1;
			this._lastId = 1;

			this._connection = new Host(this._options.name);
			this._connection.addRegisterCallback((name : string) => {
				this.registerClient(name);
			});
		} else {
			this._connection = new Client(this._options.name, this._options.hostName);
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

			if (!this._options.host && msg.S > this._seqNum) {
				this._seqNum = msg.S;
			}
		});
		this._connection.initialize();

	    const light = new BABYLON.HemisphericLight("light", new BABYLON.Vector3(1, 1, 0), this._scene);

	    if (this._options.host) {
	    	this._entityMap.add(EntityType.PLAYER, {
	    		metadataInitOptions: {
		    		clientId: this.id(),
	    		},
	    		bodyInitOptions: {
		    		pos: {x: 0, y: 10},
	    		},
	    	});
		    this._entityMap.add(EntityType.WALL, {
	    		bodyInitOptions: {
			    	pos: {x: 0, y: 0},
			    	dim: {x: 16, y: 1},
			    },
		    });
		    this._entityMap.add(EntityType.WALL, {
	    		bodyInitOptions: {
		    		pos: {x: 3, y: 1},
		    		dim: {x: 1, y: 1},
		    	},
		    });
		    this._entityMap.add(EntityType.WALL, {
	    		bodyInitOptions: {
			    	pos: {x: 6, y: 3},
			    	dim: {x: 2, y: 1},
			    },
		    });
	    }

	    this._engine.runRenderLoop(() => {
	    	this._entityMap.update();
	    	this._camera.update();
	    	this._entityMap.render(this._scene);
	    	this._entityMap.updateData(this._seqNum);
	    	this._connection.update(this._seqNum);

	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
    			const [message, has] = this.entityMessage(filter, this._seqNum);
    			if (has) {
    				this._connection.broadcast(Game._channelMapping.get(filter), message);
	    		}
	    	}

	    	if (this._options.host) {
		    	this._seqNum++;
	    	}
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

	mouse() : BABYLON.Vector3 {
		if (!this.initialized() || !defined(this.scene().getViewMatrix())) {
			return new BABYLON.Vector3();
		}

		const mouse = ui.mouse();

		// Z-coordinate is not necessarily 0
		let mouseWorld = BABYLON.Vector3.Unproject(
			new BABYLON.Vector3(mouse.x, mouse.y, 0.99),
			window.innerWidth,
			window.innerHeight,
			BABYLON.Matrix.Identity(),
			this.camera().get().getViewMatrix(),
			this.camera().get().getProjectionMatrix());

		if (Math.abs(mouseWorld.z) < 1e-3) {
			return mouseWorld;
		}

		// Camera to mouse
		mouseWorld.subtractInPlace(this.camera().get().position);

		// Scale camera to mouse to end at z = 0
		const scale = Math.abs(this.camera().get().position.z / mouseWorld.z);

		// Camera to mouse at z = 0
		mouseWorld.scaleInPlace(scale);

		// World coordinates
		mouseWorld.addInPlace(this.camera().get().position);

		return mouseWorld;
	}

	private entityMessage(filter : DataFilter, seqNum : number) : [Message, boolean] {
		const data = this._entityMap.dataMap(filter);
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
    		metadataInitOptions: {
	    		clientId: id,
    		},
	 		bodyInitOptions: {
	    		pos: {x: 0, y: 10},
	    	},
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