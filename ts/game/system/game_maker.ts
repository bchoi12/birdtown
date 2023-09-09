
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { GameData } from 'game/game_data'
import { SystemBase, System } from 'game/system'
import { SystemType, LevelType } from 'game/system/api'
import { Controller } from 'game/system/controller'
import { ClientSetup } from 'game/system/game_maker/client_setup'
import { GameSetup, GameConfig } from 'game/system/game_maker/game_setup'
import { PlayerState } from 'game/system/player_state'

import { GameMessage, GameMessageType, GameProp} from 'message/game_message'
import { GameConfigMessage, GameConfigProp } from 'message/game_config_message'
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { ui } from 'ui'
import { AnnouncementType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class GameMaker extends SystemBase implements System {

	private static readonly _finishTime = 2000;
	private static readonly _victoryTime = 3000;
	private static readonly _errorTime = 3000;

	private _config : GameConfigMessage;
	private _clientSetup : ClientSetup;

	private _round : number;
	private _lastStateChange : number;

	constructor() {
		super(SystemType.GAME_MAKER);
		this.addNameParams({
			base: "game_maker",
		})

		this._config = GameConfigMessage.defaultConfig(GameMode.UNKNOWN);
		this._clientSetup = new ClientSetup(250);
		this._round = 0;
		this._lastStateChange = Date.now();

		this.addProp<Object>({
			has: () => { return this._config.updated(); },
			export: () => { return this._config.exportObject(); },
			import: (obj : Object) => { this._config.parseObject(obj); },
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

		this._config.setUpdated(true);
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
			break;
		case GameState.GAME:
			if (this.timeLimitReached(GameConfigProp.TIME_GAME)) {
				return GameState.FINISH;
			}
			// TODO: check num alive
			break;
		case GameState.FINISH:
			if (this.timeLimitReached(GameConfigProp.TIME_FINISH)) {
				return GameState.SETUP;
			}
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

			if (this._round === 1) {
		    	let uiMsg = new UiMessage(UiMessageType.ANNOUNCEMENT);
		    	uiMsg.set(UiProp.TYPE, AnnouncementType.LEVEL);
		    	uiMsg.set(UiProp.NAMES, [game.level().displayName()]);
		    	ui.handleMessage(uiMsg);
			}
			break;
		case GameState.GAME:
			// TODO: Respawn players
			break;
		}
	}
}
