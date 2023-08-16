import * as BABYLON from "babylonjs";

import { GameData, DataFilter } from 'game/game_data'
import { System } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { Audio } from 'game/system/audio'
import { Controller } from 'game/system/controller'
import { ClientState } from 'game/system/client_state'
import { ClientStates } from 'game/system/client_states'
import { Entities } from 'game/system/entities'
import { Input } from 'game/system/input'
import { Keys } from 'game/system/keys'
import { Lakitu } from 'game/system/lakitu'
import { Level } from 'game/system/level'
import { Physics } from 'game/system/physics'
import { Runner } from 'game/system/runner'
import { World } from 'game/system/world'

import { ChannelType } from 'network/api'
import { Client } from 'network/client'
import { Connection } from 'network/connection'
import { Netcode } from 'network/netcode'
import { Host } from 'network/host'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'
import { NetworkMessage, NetworkMessageType, NetworkProp } from 'message/network_message'

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
	private _clientId : number;
	private _canvas : HTMLCanvasElement;
	private _frameTimes : NumberRingBuffer;

	private _options : GameOptions;
	private _lastClientId : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _netcode : Netcode;

	private _runner : Runner;
	private _audio : Audio;
	private _clientStates : ClientStates;
	private _entities : Entities;
	private _controller : Controller;
	private _input : Input;
	private _lakitu : Lakitu;
	private _level : Level;
	private _physics : Physics;
	private _world : World;

	constructor() {
		this._initialized = false;
		this._clientId = 0;
		this._canvas = Html.canvasElm(Html.canvasGame);
		this._frameTimes = new NumberRingBuffer(60);
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

		// this._engine = new BABYLON.NullEngine();
		// TODO: fast anti-alias
		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false, {
			stencil: true,
		});
		window.onresize = () => { this._engine.resize(); };

		this._runner = new Runner();
		this._audio = new Audio();
		this._clientStates = new ClientStates();
		this._entities = new Entities();
		this._controller = new Controller();
		this._input = new Input();
		this._level = new Level();
		this._physics = new Physics();

		this._world = new World(this._engine);
		this._lakitu = new Lakitu(this._world.scene());

		// Order of insertion becomes order of execution
		this._runner.push(this._clientStates);
		this._runner.push(this._controller);
		this._runner.push(this._level);
		this._runner.push(this._input);
		this._runner.push(this._entities);
		this._runner.push(this._physics);
		this._runner.push(this._lakitu);
		this._runner.push(this._world);
		this._runner.push(this._audio);

		// TODO: move most of this stuff to network code
		if (this._options.host) {
			this._netcode = new Host(this._options.hostName, this._options.displayName);
			this._netcode.addRegisterCallback((connection : Connection) => {
				const clientId = game.nextClientId();
				connection.setClientId(clientId);
				
				let networkMsg = new NetworkMessage(NetworkMessageType.INIT_CLIENT);
				networkMsg.setProp<number>(NetworkProp.CLIENT_ID, clientId);
				this._netcode.send(connection.name(), ChannelType.TCP, networkMsg);

				let gameMsg = new GameMessage(GameMessageType.NEW_CLIENT);
				gameMsg.setProp(GameProp.CLIENT_ID, clientId);
				gameMsg.setProp(GameProp.DISPLAY_NAME, connection.displayName());
				this.handleMessage(gameMsg);

				if (isLocalhost()) {
					console.log("Registered new client to game:", clientId);
				}
			});
		} else {
			this._netcode = new Client(this._options.hostName, this._options.displayName);
			this._netcode.addMessageCallback(NetworkMessageType.INIT_CLIENT, (msg : NetworkMessage) => {
				this.setClientId(msg.getProp<number>(NetworkProp.CLIENT_ID));
				if (isLocalhost()) {
					console.log("Got client id", this.clientId());
				}
			});
		}
		this._netcode.addMessageCallback(NetworkMessageType.GAME, (msg : NetworkMessage) => {
			this._runner.importData(msg.getProp(NetworkProp.DATA), msg.getProp<number>(NetworkProp.SEQ_NUM));
		});
		this._netcode.initialize();

	    if (this._options.host) {
	    	this.setClientId(1);
		    this._level.setLevel({
		    	level: LevelType.LOBBY,
		    	seed: Math.floor(Math.random() * 10000) + 1,
		    });	
	    }

	    this._engine.runRenderLoop(() => {
	    	const frameStart = Date.now();

	    	this._netcode.preStep();
    		this._runner.step();
	    	this._netcode.postStep();

	    	for (const filter of [DataFilter.TCP, DataFilter.UDP]) {
    			const [msg, has] = this._runner.message(filter);
				if (has) {
					this._netcode.broadcast(Game._channelMapping.get(filter), msg);
    			}
	    	}
	    	this._runner.cleanup();
	    	this._frameTimes.push(Date.now() - frameStart);
	    });

	    this._initialized = true;
	}

	initialized() : boolean { return this._initialized; }
	canvas() : HTMLCanvasElement { return this._canvas; }

	hasClientId() : boolean { return this._clientId > 0; }
	clientId() : number { return this._clientId; }
	setClientId(clientId : number) : void {
		if (this.hasClientId()) {
			console.error("Error: skipping setting clientId twice, current=%d, requested=%d", this.clientId(), clientId);
			return;
		}

		this._clientId = clientId;
		this._netcode.setClientId(clientId);

		let gameMsg = new GameMessage(GameMessageType.NEW_CLIENT);
		gameMsg.setProp(GameProp.CLIENT_ID, clientId);
		gameMsg.setProp(GameProp.DISPLAY_NAME, this._netcode.displayName());
    	this.handleMessage(gameMsg);

		if (this.options().host) {
			this._lastClientId = clientId;
		}
	}

	nextClientId() : number {
		if (!this.options().host) {
			console.error("Error: client called nextClientId()");
			return -1;
		}

		return ++this._lastClientId;
	}	
	options() : GameOptions { return this._options; }
	averageFrameTime() : number { return this._frameTimes.average(); }

	getSystem<T extends System>(type : SystemType) : T { return this._runner.getSystem<T>(type); }
	handleMessage(msg : GameMessage) : void { this._runner.handleMessage(msg); }

	// Easy access for commonly used systems
	runner() : Runner { return this._runner; }
	scene() : BABYLON.Scene { return this._world.scene(); }
	engine() : BABYLON.Engine { return this._engine; }
	audio() : Audio { return this._audio; }
	clientStates() : ClientStates { return this._clientStates; }
	clientState(id? : number) : ClientState { return this._clientStates.getClientState(id); }
	controller() : Controller { return this._controller; }
	level() : Level { return this._level; }
	physics() : Physics { return this._physics; }
	lakitu() : Lakitu { return this._lakitu; }
	keys(id? : number) : Keys { return this._input.getKeys(id); }
	entities() : Entities { return this._entities; }
	netcode() : Netcode { return this._netcode; }
	world() : World { return this._world; }
}

export const game = new Game();