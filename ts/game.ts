import * as BABYLON from "babylonjs";

import { GameData, DataFilter } from 'game/game_data'
import { System } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { Runner } from 'game/system/runner'
import { ClientState } from 'game/system/client_state'
import { ClientStates } from 'game/system/client_states'
import { Entities } from 'game/system/entities'
import { GameMode } from 'game/system/game_mode'
import { Input } from 'game/system/input'
import { Keys } from 'game/system/keys'
import { Lakitu } from 'game/system/lakitu'
import { Level } from 'game/system/level'
import { Physics } from 'game/system/physics'
import { World } from 'game/system/world'

import { ChannelType } from 'network/api'
import { Client } from 'network/client'
import { Netcode } from 'network/netcode'
import { Host } from 'network/host'

import { MessageType } from 'message/api'
import { NetworkMessage, NetworkProp } from 'message/network_message'

import { settings } from 'settings'

import { ui } from 'ui'

import { defined, isLocalhost } from 'util/common'
import { Html } from 'ui/html'
import { NumberRingBuffer } from 'util/number_ring_buffer'

interface GameOptions {
	displayName : string;
	hostName : string;

	host : boolean;
}

class Game {
	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.INIT, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private _initialized : boolean;
	private _id : number;
	private _canvas : HTMLCanvasElement;
	private _frameTimes : NumberRingBuffer;

	private _options : GameOptions;
	private _lastId : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _netcode : Netcode;

	private _runner : Runner;
	private _clientStates : ClientStates;
	private _entities : Entities;
	private _gameMode : GameMode;
	private _input : Input;
	private _lakitu : Lakitu;
	private _level : Level;
	private _physics : Physics;
	private _world : World;

	constructor() {
		this._initialized = false;
		this._id = 0;
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
			this._netcode = new Host(this._options.hostName, this._options.displayName);
			this._netcode.addRegisterCallback((name : string) => {
				const gameId = game.nextId();
				this._netcode.getConnection(name).setGameId(gameId);
				
				let msg = new NetworkMessage(MessageType.INIT_CLIENT);
				msg.setProp<number>(NetworkProp.CLIENT_ID, gameId);
				this._netcode.send(name, ChannelType.TCP, msg);

				this._runner.onNewClient({
					displayName: this._netcode.getConnection(name).displayName(),
					gameId: gameId,
				});

				if (isLocalhost()) {
					console.log("Registered new client to game:", gameId);
				}
			});
		} else {
			this._netcode = new Client(this._options.hostName, this._options.displayName);
			this._netcode.addMessageCallback(MessageType.INIT_CLIENT, (msg : NetworkMessage) => {
				this.setId(msg.getProp<number>(NetworkProp.CLIENT_ID));
				if (isLocalhost()) {
					console.log("Got client id", this.id());
				}
			});
		}
		this._netcode.addMessageCallback(MessageType.GAME, (msg : NetworkMessage) => {
			this._runner.importData(msg.getProp(NetworkProp.DATA), msg.getProp<number>(NetworkProp.SEQ_NUM));
		});
		this._netcode.initialize();

		this._runner = new Runner();
		this._clientStates = new ClientStates();
		this._entities = new Entities();
		this._gameMode = new GameMode();
		this._input = new Input();
		this._level = new Level();
		this._physics = new Physics();

		this._world = new World(this._engine);
		this._lakitu = new Lakitu(this._world.scene());

		// Order of insertion becomes order of execution
		this._runner.push(this._clientStates);
		this._runner.push(this._gameMode);
		this._runner.push(this._level);
		this._runner.push(this._input);
		this._runner.push(this._entities);
		this._runner.push(this._physics);
		this._runner.push(this._lakitu);
		this._runner.push(this._world);

	    if (this._options.host) {
	    	this.setId(1);
		    this._level.setLevel({
		    	level: LevelType.LOBBY,
		    	seed: Math.floor(Math.random() * 10000) + 1,
		    });	
	    }

	    this._engine.runRenderLoop(() => {
	    	const frameStart = Date.now();

	    	this._netcode.preUpdate();
    		this._runner.run();
	    	this._netcode.postUpdate();

	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
    			const [msg, has] = this._runner.message(filter);
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
	hasId() : boolean { return this._id > 0; }
	id() : number { return this._id; }
	options() : GameOptions { return this._options; }
	averageFrameTime() : number { return this._frameTimes.average(); }

	runner() : Runner { return this._runner; }
	getSystem<T extends System>(type : SystemType) : T { return this._runner.getSystem<T>(type); }

	// Easy access for commonly used systems
	scene() : BABYLON.Scene { return this._world.scene(); }
	engine() : BABYLON.Engine { return this._engine; }
	clientStates() : ClientStates { return this._clientStates; }
	clientState(id? : number) : ClientState { return this._clientStates.getClientState(id)}
	gameMode() : GameMode { return this._gameMode; }
	level() : Level { return this._level; }
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
		this._netcode.setGameId(id);

    	this._runner.onNewClient({
    		displayName: this._netcode.displayName(),
    		gameId: id,
    	});

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