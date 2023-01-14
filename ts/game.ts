import * as BABYLON from "babylonjs";
import * as MATTER from "matter-js"

import { Data, DataFilter, DataMap } from 'network/data'
import { EntityType } from 'game/entity'
import { SystemRunner } from 'game/system'
import { Entities } from 'game/system/entities'
import { EntityMap } from 'game/system/entity_map'
import { Input } from 'game/system/input'
import { Keys } from 'game/system/keys'
import { Lakitu } from 'game/system/lakitu'
import { Physics } from 'game/system/physics'
import { World } from 'game/system/world'

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
	private _connection : Connection;

	private _systemRunner : SystemRunner;
	private _entities : Entities;
	private _input : Input;
	private _lakitu : Lakitu;
	private _physics : Physics;
	private _world : World;

	private _lastUpdateTime : number;

	constructor() {
		this._initialized = false;
		this._canvas = Html.canvasElm(Html.canvasGame);
		this._seqNum = 1;

		this._lastUpdateTime = Date.now();
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

		// this._engine = new BABYLON.NullEngine();
		// TODO: fast anti-alias
		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);
		window.onresize = () => { this.resize(); };

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

			this._entities.importData(<DataMap>msg.D, msg.S);
		});
		this._connection.addMessageCallback(MessageType.INPUT, (peer : string, msg : Message) => {
			if (!defined(msg.D) || !defined(msg.S)) {
				console.error("Invalid message: ", msg);
				return;
			}

			const id = this._connection.idFromName(peer);
			this._input.importData(<DataMap>msg.D, msg.S);
		});
		this._connection.initialize();

		this._systemRunner = new SystemRunner();
		this._entities = new Entities();
		this._input = new Input();
		this._world = new World(this._engine);
		this._lakitu = new Lakitu(this._canvas, this._world.scene());
		this._physics = new Physics();

		// Order matters
		this._systemRunner.push(this._input);
		this._systemRunner.push(this._entities);
		this._systemRunner.push(this._physics);
		this._systemRunner.push(this._lakitu);
		this._systemRunner.push(this._world);

		// TODO: level system
	    if (this._options.host) {
	    	this._entities.addEntity(EntityType.PLAYER, {
	    		clientId: this.id(),
	    		profileInit: {
		    		pos: {x: 0, y: 10},
	    		},
	    	});
		    this._entities.addEntity(EntityType.WALL, {
		    	profileInit: {
			    	pos: {x: 0, y: 0},
			    	dim: {x: 16, y: 1},
		    	},
		    });
		    this._entities.addEntity(EntityType.WALL, {
		    	profileInit: {
		    		pos: {x: 3, y: 1},
		    		dim: {x: 1, y: 1},
		    	},
		    });
		    this._entities.addEntity(EntityType.WALL, {
		    	profileInit: {
			    	pos: {x: 6, y: 3},
		    		dim: {x: 2, y: 1},
				},
		    });
	    }

	    this._engine.runRenderLoop(() => {
	    	const millis = Math.min(Date.now() - this._lastUpdateTime, 32);

	    	if (this.hasId()) {
	    		this._systemRunner.update(millis);
	    		this._systemRunner.updateData(this._seqNum);
	    	}

	    	this._connection.update(this._seqNum);
	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
	    		{
	    			const [msg, has] = this.entityMessage(filter, this._seqNum);
    				if (has) {
    					this._connection.broadcast(Game._channelMapping.get(filter), msg);
	    			}
	    		}
	    		{
	    			const [msg, has] = this.inputMessage(filter, this._seqNum);
    				if (has) {
    					this._connection.broadcast(Game._channelMapping.get(filter), msg);
	    			}
	    		}
	    	}

	    	if (this._options.host) {
		    	this._seqNum++;
	    	}

	    	this._lastUpdateTime = Date.now();
	    });

	    this._initialized = true;
	}

	resize() : void { this._engine.resize(); }
	initialized() : boolean { return this._initialized; }
	canvas() : HTMLCanvasElement { return this._canvas; }
	hasId() : boolean { return defined(this._id); }
	id() : number { return this.hasId() ? this._id : -1; }
	options() : GameOptions { return this._options; }
	scene() : BABYLON.Scene { return this._world.scene(); }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : Physics { return this._physics; }
	lakitu() : Lakitu { return this._lakitu; }
	keys(id? : number) : Keys { return this._input.keys(id); }
	entities() : Entities { return this._entities; }
	connection() : Connection { return this._connection; }

	// TODO: move this to input
	mouse() : BABYLON.Vector3 {
		if (!this.initialized() || !defined(this.lakitu())) {
			return new BABYLON.Vector3();
		}

		const mouse = ui.mouse();

		// Z-coordinate is not necessarily 0
		let mouseWorld = BABYLON.Vector3.Unproject(
			new BABYLON.Vector3(mouse.x, mouse.y, 0.99),
			window.innerWidth,
			window.innerHeight,
			BABYLON.Matrix.Identity(),
			this.lakitu().camera().getViewMatrix(),
			this.lakitu().camera().getProjectionMatrix());

		if (Math.abs(mouseWorld.z) < 1e-3) {
			return mouseWorld;
		}

		// Camera to mouse
		mouseWorld.subtractInPlace(this.lakitu().camera().position);

		// Scale camera to mouse to end at z = 0
		const scale = Math.abs(this.lakitu().camera().position.z / mouseWorld.z);

		// Camera to mouse at z = 0
		mouseWorld.scaleInPlace(scale);

		// World coordinates
		mouseWorld.addInPlace(this.lakitu().camera().position);

		return mouseWorld;
	}

	// TODO: move to system runner
	private entityMessage(filter : DataFilter, seqNum : number) : [Message, boolean] {
		const data = this._entities.dataMap(filter);
		if (Object.keys(data).length === 0) {
			return [null, false];
		}
		return [{
			T: MessageType.ENTITY,
			S: seqNum,
			D: data,
		}, true];
	}

	private inputMessage(filter : DataFilter, seqNum : number) : [Message, boolean] {
		const data = this._input.dataMap(filter);
		if (Object.keys(data).length === 0) {
			return [null, false];
		}
		return [{
			T: MessageType.INPUT,
			S: seqNum,
			D: data,
		}, true];
	}

	// TODO: client system
	private registerClient(name : string) : void {
		const id = this.nextId();
		this._connection.setId(name, id);
		this._connection.broadcast(ChannelType.TCP, {
			T: MessageType.NEW_CLIENT,
			N: name,
			I: id,
		});

    	this._entities.addEntity(EntityType.PLAYER, {
    		clientId: id,
    		profileInit: {
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