import * as BABYLON from "babylonjs";

import { Data, DataFilter, DataMap } from 'network/data'
import { System, SystemType } from 'game/system'
import { SystemRunner } from 'game/system_runner'
import { ClientInfos } from 'game/system/client_infos'
import { Entities } from 'game/system/entities'
import { Input } from 'game/system/input'
import { Keys } from 'game/system/keys'
import { Lakitu } from 'game/system/lakitu'
import { Level, LevelType } from 'game/system/level'
import { Physics } from 'game/system/physics'
import { World } from 'game/system/world'

import { Client } from 'network/client'
import { Netcode, ChannelType } from 'network/netcode'
import { Host } from 'network/host'
import { IncomingMessage, Message, MessageType } from 'network/message'

import { options } from 'options'

import { ui } from 'ui'
import { defined, isLocalhost } from 'util/common'
import { Html } from 'ui/html'
import { NumberRingBuffer } from 'util/number_ring_buffer'

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
	private _frameTimes : NumberRingBuffer;

	private _options : GameOptions;
	private _id : number;
	private _lastId : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _netcode : Netcode;

	private _systemRunner : SystemRunner;
	private _clientInfos : ClientInfos;
	private _entities : Entities;
	private _input : Input;
	private _lakitu : Lakitu;
	private _level : Level;
	private _physics : Physics;
	private _world : World;

	constructor() {
		this._initialized = false;
		this._canvas = Html.canvasElm(Html.canvasGame);
		this._frameTimes = new NumberRingBuffer(60);
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

		// this._engine = new BABYLON.NullEngine();
		// TODO: fast anti-alias
		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false);
		window.onresize = () => { this.resize(); };

		// TODO: move most of this stuff to network code
		if (this._options.host) {
			this._netcode = new Host(this._options.name, this._options.hostName);
			this._netcode.addRegisterCallback((name : string) => {
				const gameId = game.nextId();
				this._netcode.getConnection(name).setGameId(gameId);
				this._netcode.send(name, ChannelType.TCP, {
					T: MessageType.INIT_CLIENT,
					D: gameId,
				});
				this._systemRunner.onNewClient(name, gameId);

				if (isLocalhost()) {
					console.log("Registered new client to game:", gameId);
				}
			});
		} else {
			this._netcode = new Client(this._options.name, this._options.hostName);
			this._netcode.addMessageCallback(MessageType.INIT_CLIENT, (incoming : IncomingMessage) => {
				if (!defined(incoming.msg.D)) {
					console.error("Error: invalid message ", incoming);
					return;
				}

				this.setId(<number>incoming.msg.D);
				if (isLocalhost()) {
					console.log("Got client id", this.id());
				}
			});
		}
		this._netcode.addMessageCallback(MessageType.GAME, (incoming : IncomingMessage) => {
			if (!defined(incoming.msg.D) || !defined(incoming.msg.S)) {
				console.error("Error: invalid message ", incoming);
				return;
			}

			this._systemRunner.importData(<DataMap>incoming.msg.D, incoming.msg.S);
		});
		this._netcode.addMessageCallback(MessageType.CHAT, (incoming : IncomingMessage) => {
			if (!defined(incoming.msg.D)) {
				console.error("Error: invalid message ", incoming);
				return;
			}

			this._netcode.receiveChat(incoming.name, <string>incoming.msg.D);
		});
		this._netcode.initialize();

		this._systemRunner = new SystemRunner();
		this._clientInfos = new ClientInfos();
		this._entities = new Entities();
		this._input = new Input();
		this._level = new Level();
		this._physics = new Physics();

		this._world = new World(this._engine);
		this._lakitu = new Lakitu(this._world.scene());

		// Order of insertion becomes order of execution
		this._systemRunner.push(this._clientInfos);
		this._systemRunner.push(this._level);
		this._systemRunner.push(this._input);
		this._systemRunner.push(this._entities);
		this._systemRunner.push(this._physics);
		this._systemRunner.push(this._lakitu);
		this._systemRunner.push(this._world);

	    if (this._options.host) {
	    	this.setId(1);
		    this._level.setLevel(LevelType.BIRDTOWN);	
		    this._level.setSeed(333);
	    	this._systemRunner.onNewClient(this._options.name, this.id());
	    }

	    this._engine.runRenderLoop(() => {
	    	const frameStart = Date.now();

	    	this._netcode.preUpdate();
	    	if (this.hasId()) {
	    		this._systemRunner.update();
	    	}
	    	this._netcode.postUpdate();

	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
    			const [msg, has] = this._systemRunner.message(filter);
				if (has) {
					this._netcode.broadcast(Game._channelMapping.get(filter), msg);
    			}
	    	}

	    	if (this.hasId()) {
		    	this._frameTimes.push(Date.now() - frameStart);
	    	}
	    });

	    this._initialized = true;
	}

	resize() : void { this._engine.resize(); }
	initialized() : boolean { return this._initialized; }
	canvas() : HTMLCanvasElement { return this._canvas; }
	hasId() : boolean { return defined(this._id); }
	id() : number { return this._id; }
	options() : GameOptions { return this._options; }
	averageFrameTime() : number { return this._frameTimes.average(); }

	systemRunner() : SystemRunner { return this._systemRunner; }
	getSystem<T extends System>(type : SystemType) : T { return this._systemRunner.getSystem<T>(type); }

	// Easy access for commonly used systems
	scene() : BABYLON.Scene { return this._world.scene(); }
	engine() : BABYLON.Engine { return this._engine; }
	physics() : Physics { return this._physics; }
	lakitu() : Lakitu { return this._lakitu; }
	keys(id? : number) : Keys { return this._input.getKeys(id); }
	entities() : Entities { return this._entities; }
	netcode() : Netcode { return this._netcode; }

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
		this._netcode.setGameId(this._id);

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