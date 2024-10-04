import * as BABYLON from '@babylonjs/core/Legacy/legacy'

import { System } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { Announcer } from 'game/system/announcer'
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
import { Tablet } from 'game/system/tablet'
import { Tablets } from 'game/system/tablets'
import { World } from 'game/system/world'

import { Client } from 'network/client'
import { Netcode } from 'network/netcode'
import { Host } from 'network/host'

import { GameMessage, GameMessageType } from 'message/game_message'
import { NetworkMessage, NetworkMessageType } from 'message/network_message'

import { isLocalhost } from 'util/common'

import { Html } from 'ui/html'

export type GameOptions = {
	room : string;
	isHost : boolean;
	
	netcodeSuccess : () => void;
	netcodeError : () => void;
}

class Game {
	private _initialized : boolean;
	private _clientId : number;
	private _canvas : HTMLCanvasElement;

	private _options : GameOptions;
	private _lastClientId : number;
	private _engine : BABYLON.Engine;
	private _netcode : Netcode;

	private _runner : Runner;
	private _announcer : Announcer;
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
	private _tablets : Tablets;
	private _world : World;

	constructor() {
		this._initialized = false;
		this._clientId = 0;
		this._canvas = Html.canvasElm(Html.canvasGame);
	}

	initialize(gameOptions : GameOptions) {
		this._options = gameOptions;

		if (this._options.isHost) {
			this._netcode = new Host(this._options.room);
		} else {
			this._netcode = new Client(this._options.room);
		}
		this._netcode.initialize(() => {
			this._engine = new BABYLON.Engine(this._canvas, /*antialias=*/false, {
				audioEngine: true,
				stencil: true,
			});
			window.onresize = () => { this._engine.resize(); };

			this._runner = new Runner();
			this._announcer = new Announcer();
			this._audio = new Audio();
			this._clientDialogs = new ClientDialogs();
			this._entities = new Entities();
			this._controller = new Controller();
			this._input = new Input();
			this._level = new Level();
			this._physics = new Physics();
			this._playerStates = new PlayerStates();
			this._tablets = new Tablets();

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
			this._runner.push(this._tablets);
			this._runner.push(this._lakitu);
			this._runner.push(this._pipeline);
			this._runner.push(this._world);
			this._runner.push(this._announcer);
			this._runner.push(this._audio);

			this._runner.runGameLoop();
			this._runner.runRenderLoop();
		    this._initialized = true;

			this._options.netcodeSuccess();
		}, this._options.netcodeError);
	}

	initialized() : boolean { return this._initialized; }
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
		gameMsg.setClientId(clientId);
    	this.handleMessage(gameMsg);

		if (this.isHost()) {
			this._lastClientId = clientId;
		}

		if (isLocalhost()) {
			console.log("Set client id:", clientId);
		}
	}
	displayName(clientId? : number) : string {
		if (!clientId) {
			clientId = this.clientId();
		}

		if (game.tablets().hasTablet(clientId)) {
			return game.tablet(clientId).displayName();
		}
		return "";
	}

	nextClientId() : number {
		if (!this.isHost()) {
			console.error("Error: client called nextClientId()");
			return -1;
		}

		return ++this._lastClientId;
	}	

	canvas() : HTMLCanvasElement { return this._canvas; }
	options() : GameOptions { return this._options; }
	isHost() : boolean { return this._options.isHost; }

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

	announcer() : Announcer { return this._announcer; }
	audio() : Audio { return this._audio; }
	clientDialogs() : ClientDialogs { return this._clientDialogs; }
	clientDialog(id? : number) : ClientDialog { return this._clientDialogs.clientDialog(id); }
	controller() : Controller { return this._controller; }
	entities() : Entities { return this._entities; }
	input() : Input { return this._input; }
	keys(id? : number) : Keys { return this._input.keys(id); }
	lakitu() : Lakitu { return this._lakitu; }
	level() : Level { return this._level; }
	physics() : Physics { return this._physics; }
	playerStates() : PlayerStates { return this._playerStates; }
	playerState(id? : number) : PlayerState { return this._playerStates.playerState(id); }
	tablets() : Tablets { return this._tablets; }
	tablet(id? : number) : Tablet { return this._tablets.tablet(id); }
	world() : World { return this._world; }

}

export const game = new Game();