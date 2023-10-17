
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { GameData } from 'game/game_data'
import { SystemBase, System } from 'game/system'
import { SystemType, LevelType } from 'game/system/api'
import { Controller } from 'game/system/controller'
import { ClientSetup } from 'game/system/game_maker/client_setup'
import { PlayerState } from 'game/system/player_state'
import { EntityQuery } from 'game/util/entity_query'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType, GameProp} from 'message/game_message'
import { GameConfigMessage, GameConfigProp } from 'message/game_config_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class GameMaker extends SystemBase implements System {

	private static readonly _noWinner = "no one";
	private static readonly _finishTime = 2000;
	private static readonly _victoryTime = 3000;
	private static readonly _errorTime = 3000;

	private _config : GameConfigMessage;
	private _clientSetup : ClientSetup;
	private _entityQuery : EntityQuery;

	private _round : number;
	private _lastStateChange : number;

	constructor() {
		super(SystemType.GAME_MAKER);

		this._config = GameConfigMessage.defaultConfig(GameMode.UNKNOWN);
		this._clientSetup = new ClientSetup(250);
		this._entityQuery = new EntityQuery();
		this._round = 0;
		this._lastStateChange = Date.now();

		this.addProp<MessageObject>({
			export: () => { return this._config.exportObject(); },
			import: (obj : MessageObject) => { this._config.parseObject(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			export: () => { return this._round; },
			import: (obj : number) => { this._round = obj; },
			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	mode() : GameMode { return this._config.type(); }
	clientSetup() : ClientSetup { return this._clientSetup; }
	round() : number { return this._round; }
	timeLimitReached(prop : GameConfigProp) : boolean {
		if (!this._config.has(prop)) {
			return false;
		}
		return (Date.now() - this._lastStateChange) >= this._config.get<number>(prop);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		switch (msg.type()) {
		case GameMessageType.LEVEL_LOAD:
			if (msg.has(GameProp.DISPLAY_NAME)) {
		    	let uiMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
		    	uiMsg.set(UiProp.TYPE, AnnouncementType.LEVEL);
		    	uiMsg.set(UiProp.NAMES, [msg.get<string>(GameProp.DISPLAY_NAME)]);
		    	ui.handleMessage(uiMsg);
			}
			break;
		}
	}

	setMode(mode : GameMode, config? : GameConfigMessage) : boolean {
		this._config.resetToDefault(mode);
		if (config) {
			this._config.merge(config);
		}

		if (!this._config.valid()) {
			console.error("Error: invalid config", this._config);
			return false;
		}

		this._clientSetup.refresh();
		if (!this.valid(GameState.SETUP)) {
			return false;
		}

		this.addNameParams({
			type: GameMode[mode],
		});

		if (isLocalhost()) {
			console.log("%s: config is", this.name(), this._config.dataMap());

			if (config) {
				console.log("%s: applied override", this.name(), config);
			}
		}
		return true;
	}

	valid(current : GameState) : boolean {
		switch (current) {
		case GameState.SETUP:
		case GameState.GAME:
			this._clientSetup.prune();
			if (this._clientSetup.numConnected() < this._config.getOr(GameConfigProp.PLAYERS_MIN, 0)) {
				return false;
			}
			break;
		}
		return true;
	}
	queryState(current : GameState) : GameState {
		if (!this.valid(current)) {
			return GameState.ERROR;
		}

		switch(current) {		
		case GameState.SETUP:
			if (this.timeLimitReached(GameConfigProp.TIME_SETUP)) {
				return GameState.GAME;
			}
			if (game.clientDialogs().inSync()) {
				return GameState.GAME;
			}
			break;
		case GameState.GAME:
			if (this.timeLimitReached(GameConfigProp.TIME_GAME)) {
				return GameState.FINISH;
			}
			const alive = this._entityQuery.filter<Player>(EntityType.PLAYER, (player : Player) => {
				return !player.dead();
			});
			if (alive.length <= 1) {
				return GameState.FINISH;
			}

			break;
		case GameState.FINISH:
			if (this.timeLimitReached(GameConfigProp.TIME_FINISH)) {
				return GameState.SETUP;
			}
			// TODO: victory check
			break;
		case GameState.VICTORY:
			if (this.timeLimitReached(GameConfigProp.TIME_VICTORY)) {
				return GameState.FREE;
			}
			break;
		case GameState.ERROR:
			if (this.timeLimitReached(GameConfigProp.TIME_ERROR)) {
				return GameState.FREE;
			}
		}
		return current;
	}
	setGameState(state : GameState) : void {
		this._lastStateChange = Date.now();

		ui.clear();

		if (!this.isSource()) {
			return;
		}

		switch (state) {
		case GameState.FREE:
			this._round = 0;
			let lobbyMsg = new GameMessage(GameMessageType.LEVEL_LOAD);
			lobbyMsg.set(GameProp.TYPE, LevelType.LOBBY);
			lobbyMsg.set(GameProp.SEED, Math.floor(Math.random() * 10000));
			lobbyMsg.set(GameProp.VERSION, game.level().version() + 1);
			game.level().loadLevel(lobbyMsg);
			break;
		case GameState.SETUP:
			this._round++;
			let birdtownMsg = new GameMessage(GameMessageType.LEVEL_LOAD);
			birdtownMsg.set(GameProp.TYPE, LevelType.BIRDTOWN);
			birdtownMsg.set(GameProp.SEED, Math.floor(Math.random() * 10000));
			birdtownMsg.set(GameProp.VERSION, game.level().version() + 1);
			game.level().loadLevel(birdtownMsg);

			this._entityQuery.registerQuery(EntityType.PLAYER, {
				query: (player : Player) => { return player.canStep(); },
				maxStaleness: 250,
			});
			this._entityQuery.query<Player>(EntityType.PLAYER).forEach((player : Player) => {
				game.level().spawnPlayer(player);
			});
			break;
		case GameState.GAME:
			// Respawn again to reflect loadout changes
			this._entityQuery.query<Player>(EntityType.PLAYER).forEach((player : Player) => {
				game.level().spawnPlayer(player);
			});
			break;
		case GameState.FINISH:
			const alive = this._entityQuery.filter<Player>(EntityType.PLAYER, (player : Player) => {
				return !player.dead();
			});

			// TODO: send GameStateMessage to clients
			let winner = GameMaker._noWinner;
			if (alive.length === 1) {
				winner = alive[0].displayName();
			}
	    	let finishMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
	    	finishMsg.set(UiProp.TYPE, AnnouncementType.GAME_FINISH);
	    	finishMsg.set(UiProp.NAMES, [winner]);
	    	ui.handleMessage(finishMsg);

			break;
		case GameState.VICTORY:
			// TODO: announce victory
			break;
		case GameState.ERROR:
	    	let errorMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
	    	errorMsg.set(UiProp.TYPE, AnnouncementType.GAME_ERROR);
	    	errorMsg.set(UiProp.NAMES, ["TODO: add the error message here"]);
	    	ui.handleMessage(errorMsg);
	    	break;
		}
	}
}
