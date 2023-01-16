import * as BABYLON from "babylonjs";
import * as MATTER from "matter-js"

import { Data, DataFilter, DataMap } from 'network/data'
import { EntityType } from 'game/entity'
import { System, SystemRunner, SystemType } from 'game/system'
import { Clients } from 'game/system/clients'
import { Entities } from 'game/system/entities'
import { EntityMap } from 'game/system/entity_map'
import { Input } from 'game/system/input'
import { Keys } from 'game/system/keys'
import { Lakitu } from 'game/system/lakitu'
import { Level, LevelType } from 'game/system/level'
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
	private _clients : Clients;
	private _entities : Entities;
	private _input : Input;
	private _lakitu : Lakitu;
	private _level : Level;
	private _physics : Physics;
	private _world : World;

	private _lastUpdateTime : number;

	constructor() {
		this._initialized = false;
		this._canvas = Html.canvasElm(Html.canvasGame);

		this._lastUpdateTime = Date.now();
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

		// this._engine = new BABYLON.NullEngine();
		// TODO: fast anti-alias
		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);
		window.onresize = () => { this.resize(); };

		if (this._options.host) {
			this._connection = new Host(this._options.name);
			this._connection.addRegisterCallback((name : string) => {
				const clientId = game.nextId();
				this._connection.setClientId(name, clientId);
				this._connection.send(name, ChannelType.TCP, {
					T: MessageType.INIT_CLIENT,
					I: clientId,
				});
				this._systemRunner.onNewClient(name, clientId);
			});
		} else {
			this._connection = new Client(this._options.name, this._options.hostName);
			this._connection.addMessageCallback(MessageType.INIT_CLIENT, (peer : string, msg : Message) => {
				if (!defined(msg.I)) {
					console.error("Invalid message: ", msg);
					return;
				}
				this._id = msg.I;
				if (isLocalhost()) {
					console.log("Got client id: " + this._id);
				}
			});
		}
		this._connection.addMessageCallback(MessageType.GAME, (peer : string, msg : Message) => {
			if (!defined(msg.D) || !defined(msg.S)) {
				console.error("Invalid message: ", msg);
				return;
			}

			this._systemRunner.importData(<DataMap>msg.D, msg.S);
		});
		this._connection.initialize();

		this._systemRunner = new SystemRunner();
		this._clients = new Clients();
		this._entities = new Entities();
		this._input = new Input();
		this._level = new Level();
		this._physics = new Physics();

		this._world = new World(this._engine);
		this._lakitu = new Lakitu(this._world.scene());

		// Order matters
		this._systemRunner.push(this._clients);
		this._systemRunner.push(this._level);
		this._systemRunner.push(this._input);
		this._systemRunner.push(this._entities);
		this._systemRunner.push(this._physics);
		this._systemRunner.push(this._lakitu);
		this._systemRunner.push(this._world);

	    this._engine.runRenderLoop(() => {
	    	const millis = Math.min(Date.now() - this._lastUpdateTime, 32);

	    	if (this.hasId()) {
	    		this._systemRunner.update(millis);
	    	}

	    	this._connection.update();
	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
    			const [msg, has] = this._systemRunner.message(filter);
				if (has) {
					this._connection.broadcast(Game._channelMapping.get(filter), msg);
    			}
	    	}

	    	this._lastUpdateTime = Date.now();
	    });

	    this._level.setLevel(LevelType.TEST, 1);
	    if (this._options.host) {
	    	this.setId(1);
	    	this._systemRunner.onNewClient(this._options.name, this.id());
	    }

	    this._initialized = true;
	}

	resize() : void { this._engine.resize(); }
	initialized() : boolean { return this._initialized; }
	canvas() : HTMLCanvasElement { return this._canvas; }
	hasId() : boolean { return defined(this._id); }
	id() : number { return this.hasId() ? this._id : -1; }
	options() : GameOptions { return this._options; }

	systemRunner() : SystemRunner { return this._systemRunner; }
	getSystem<T extends System>(type : SystemType) : T { return this._systemRunner.getSystem<T>(type); }
	scene() : BABYLON.Scene { return this._world.scene(); }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : Physics { return this._physics; }
	lakitu() : Lakitu { return this._lakitu; }
	keys(id? : number) : Keys { return this._input.getKeys(id); }
	entities() : Entities { return this._entities; }
	connection() : Connection { return this._connection; }

	// For some reason this has to be here for typescript
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

	private setId(id : number) : void {
		this._id = id;

		if (this.options().host) {
			this._lastId = id;
		}
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