import * as BABYLON from "babylonjs";

import { GameData, DataFilter } from 'game/game_data'
import { System } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { Audio } from 'game/system/audio'
import { Controller } from 'game/system/controller'
import { ClientDialog } from 'game/system/client_dialog'
import { ClientDialogs } from 'game/system/client_dialogs'
import { Entities } from 'game/system/entities'
import { Input } from 'game/system/input'
import { Keys } from 'game/system/keys'
import { Lakitu } from 'game/system/lakitu'
import { Level } from 'game/system/level'
import { Physics } from 'game/system/physics'
import { Pipeline } from 'game/system/pipeline'
import { PlayerState } from 'game/system/player_state'
import { PlayerStates } from 'game/system/player_states'
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
	private static readonly _targetFrames = 60;
	private static readonly _targetFrameTime = Math.floor(1000 / Game._targetFrames);

	private static readonly _channelMapping = new Map<DataFilter, ChannelType>([
		[DataFilter.INIT, ChannelType.TCP],
		[DataFilter.TCP, ChannelType.TCP],
		[DataFilter.UDP, ChannelType.UDP],
	]);

	private _initialized : boolean;
	private _clientId : number;
	private _canvas : HTMLCanvasElement;
	private _stepTimes : NumberRingBuffer;
	private _renderTimes : NumberRingBuffer;

	private _options : GameOptions;
	private _lastClientId : number;
	private _engine : BABYLON.Engine|BABYLON.NullEngine;
	private _netcode : Netcode;

	private _runner : Runner;
	private _audio : Audio;
	private _clientDialogs : ClientDialogs;
	private _entities : Entities;
	private _controller : Controller;
	private _input : Input;
	private _lakitu : Lakitu;
	private _level : Level;
	private _physics : Physics;
	private _pipeline : Pipeline;
	private _playerStates : PlayerStates;
	private _world : World;

	constructor() {
		this._initialized = false;
		this._clientId = 0;
		this._canvas = Html.canvasElm(Html.canvasGame);
		this._stepTimes = new NumberRingBuffer(Game._targetFrames / 2);
		this._renderTimes = new NumberRingBuffer(Game._targetFrames / 2);
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

		this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false, {
			stencil: true,
		});
		window.onresize = () => { this._engine.resize(); };

		this._runner = new Runner();
		this._audio = new Audio();
		this._clientDialogs = new ClientDialogs();
		this._entities = new Entities();
		this._controller = new Controller();
		this._input = new Input();
		this._level = new Level();
		this._physics = new Physics();
		this._playerStates = new PlayerStates();

		this._world = new World(this._engine);
		this._lakitu = new Lakitu(this._world.scene());
		this._pipeline = new Pipeline(this._engine, this._world.scene(), this._lakitu.camera());

		// Order of insertion is order of execution
		this._runner.push(this._clientDialogs);
		this._runner.push(this._controller);
		this._runner.push(this._playerStates);
		this._runner.push(this._level);
		this._runner.push(this._input);
		this._runner.push(this._entities);
		this._runner.push(this._physics);
		this._runner.push(this._lakitu);
		this._runner.push(this._pipeline);
		this._runner.push(this._world);
		this._runner.push(this._audio);

		// TODO: move most of this stuff to network code
		if (this._options.host) {
			this._netcode = new Host(this._options.hostName, this._options.displayName);
			this._netcode.addRegisterCallback((connection : Connection) => {
				const clientId = game.nextClientId();
				connection.setClientId(clientId);
				
				let networkMsg = new NetworkMessage(NetworkMessageType.INIT_CLIENT);
				networkMsg.set<number>(NetworkProp.CLIENT_ID, clientId);
				this._netcode.send(connection.name(), ChannelType.TCP, networkMsg);

				let gameMsg = new GameMessage(GameMessageType.CLIENT_JOIN);
				gameMsg.set(GameProp.CLIENT_ID, clientId);
				gameMsg.set(GameProp.DISPLAY_NAME, connection.displayName());
				this.handleMessage(gameMsg);

				if (isLocalhost()) {
					console.log("Registered new client to game:", clientId);
				}
			});
		} else {
			this._netcode = new Client(this._options.hostName, this._options.displayName);
			this._netcode.addMessageCallback(NetworkMessageType.INIT_CLIENT, (msg : NetworkMessage) => {
				const clientId = msg.get<number>(NetworkProp.CLIENT_ID);
				if (isLocalhost()) {
					console.log("Got client id", clientId);
				}
				this.setClientId(clientId);
			});
		}
		this._netcode.addMessageCallback(NetworkMessageType.GAME, (msg : NetworkMessage) => {
			// TODO: put data into buffer
			this._runner.importData(msg.get(NetworkProp.DATA), msg.get<number>(NetworkProp.SEQ_NUM));
		});
		this._netcode.initialize();

		this.step();
	    this._engine.runRenderLoop(() => {
    		const frameStart = Date.now();
	    	this._runner.renderFrame();
	    	this._renderTimes.push(Date.now() - frameStart);
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

		let gameMsg = new GameMessage(GameMessageType.CLIENT_JOIN);
		gameMsg.set(GameProp.CLIENT_ID, clientId);
		gameMsg.set(GameProp.DISPLAY_NAME, this._netcode.displayName());
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
	stepTime() : number { return this._stepTimes.average(); }
	renderTime() : number { return this._renderTimes.average(); }

	getSystem<T extends System>(type : SystemType) : T { return this._runner.getSystem<T>(type); }
	handleMessage(msg : GameMessage) : void {
		if (!msg.valid()) {
			console.error("Error: invalid message", msg);
			return;
		}
		this._runner.handleMessage(msg);
	}

	// Easy access for commonly used systems
	runner() : Runner { return this._runner; }
	scene() : BABYLON.Scene { return this._world.scene(); }
	engine() : BABYLON.Engine { return this._engine; }
	netcode() : Netcode { return this._netcode; }

	audio() : Audio { return this._audio; }
	clientDialogs() : ClientDialogs { return this._clientDialogs; }
	clientDialog(id? : number) : ClientDialog { return this._clientDialogs.getClientDialog(id); }
	controller() : Controller { return this._controller; }
	entities() : Entities { return this._entities; }
	input() : Input { return this._input; }
	keys(id? : number) : Keys { return this._input.getKeys(id); }
	lakitu() : Lakitu { return this._lakitu; }
	level() : Level { return this._level; }
	physics() : Physics { return this._physics; }
	playerStates() : PlayerStates { return this._playerStates; }
	playerState(id? : number) : PlayerState { return this._playerStates.getPlayerState(id); }
	world() : World { return this._world; }

	private step() : void {
    	const frameStart = Date.now();

    	this._netcode.preStep();
		this._runner.step();

    	for (const filter of this._runner.getDataFilters()) {
			const [msg, has] = this._runner.message(filter);
			if (has) {
				this._netcode.broadcast(Game._channelMapping.get(filter), msg);
			}
    	}
    	this._runner.cleanup();
    	this._stepTimes.push(Date.now() - frameStart);

    	setTimeout(() => {
    		this.step();
    	}, Game._targetFrameTime);
	}
}

export const game = new Game();