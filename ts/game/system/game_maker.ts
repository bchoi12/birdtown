
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { GameData } from 'game/game_data'
import { SystemBase, System } from 'game/system'
import { SystemType, LevelType, LevelLayout, PlayerRole, ScoreType } from 'game/system/api'
import { Controller } from 'game/system/controller'
import { PlayerState } from 'game/system/player_state'
import { Tablet } from 'game/system/tablet'

import { MessageObject } from 'message'
import { GameMessage, GameMessageType} from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { ui } from 'ui'
import { AnnouncementType, DialogType } from 'ui/api'

import { isLocalhost } from 'util/common'

export class GameMaker extends SystemBase implements System {

	private _config : GameConfigMessage;
	private _round : number;
	private _lastStateChange : number;
	private _winners : Array<Tablet>;

	constructor() {
		super(SystemType.GAME_MAKER);

		this._config = GameConfigMessage.defaultConfig(GameMode.UNKNOWN);
		this._round = 0;
		this._lastStateChange = Date.now();
		this._winners = new Array();

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
	round() : number { return this._round; }
	timeLimitReached(state : GameState) : boolean {
		const elapsed = Date.now() - this._lastStateChange;

		switch (state) {
		case GameState.SETUP:
			return this._config.hasTimeSetup() && elapsed >= this._config.getTimeSetup();
		case GameState.GAME:
			return this._config.hasTimeGame() && elapsed >= this._config.getTimeGame();
		case GameState.FINISH:
			return this._config.hasTimeFinish() && elapsed >= this._config.getTimeFinish();
		case GameState.VICTORY:
			return this._config.hasTimeVictory() && elapsed >= this._config.getTimeVictory();
		case GameState.ERROR:
			return this._config.hasTimeError() && elapsed >= this._config.getTimeError();
		default:
			console.error("Warning: queried time limit of unknown type %s", GameState[state]);
			return false;
		}
	}

	setConfig(config : GameConfigMessage) : boolean {
		this._config = config;

		if (!this._config.valid()) {
			console.error("Error: invalid config", this._config);
			return false;
		}

		if (!this.valid(GameState.SETUP)) {
			return false;
		}

		game.tablets().reset();
		this.addNameParams({
			type: GameMode[this._config.type()],
		});

		if (isLocalhost()) {
			console.log("%s: config is", this.name(), this._config.dataMap());
		}
		return true;
	}

	valid(current : GameState) : boolean {
		switch (current) {
		case GameState.SETUP:
		case GameState.GAME:
			if (this._config.hasPlayersMin() && game.playerStates().numSpawnedPlayers() < this._config.getPlayersMin()) {
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
			if (this.timeLimitReached(current)) {
				return GameState.GAME;
			}
			if (game.clientDialogs().inSync(DialogType.LOADOUT)) {
				return GameState.GAME;
			}
			break;
		case GameState.GAME:
			if (this.timeLimitReached(current)) {
				return GameState.FINISH;
			}

			if (this._config.hasLives()) {
				this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
					return !tablet.outOfLives();
				});
				if (this._winners.length <= 1) {
					return GameState.FINISH;
				}
			} else if (this._config.hasPoints()) {
				this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
					return tablet.roundScore() >= this._config.getPoints();
				});
			}
			break;
		case GameState.FINISH:
			if (this.timeLimitReached(current)) {
				if (this._config.hasVictories()) {
					this._winners = game.tablets().findAll<Tablet>((tablet : Tablet) => {
						return tablet.score(ScoreType.VICTORY) >= this._config.getVictories();
					});
					if (this._winners.length >= 1) {
						return GameState.VICTORY;
					}					
				}
				return GameState.SETUP;
			}
			break;
		case GameState.VICTORY:
			if (this.timeLimitReached(current)) {
				return GameState.FREE;
			}
			break;
		case GameState.ERROR:
			if (this.timeLimitReached(current)) {
				return GameState.FREE;
			}
		}
		return current;
	}
	setGameState(state : GameState) : void {
		this._lastStateChange = Date.now();

		if (!this.isSource()) {
			return;
		}

		switch (state) {
		case GameState.FREE:
			this._round = 0;
			game.level().loadLevel({
				type: LevelType.LOBBY,
				layout: LevelLayout.CIRCLE,
				seed: Math.floor(Math.random() * 10000),
			});
			break;
		case GameState.SETUP:
			this._round++;
			game.level().loadLevel({
				type: LevelType.BIRDTOWN,
				layout: LevelLayout.CIRCLE,
				seed: Math.floor(Math.random() * 10000),
			});

			game.tablets().execute<Tablet>((tablet : Tablet) => {
				tablet.resetRound();
				if (this._config.hasLives()) {
					tablet.setLives(this._config.getLives());
				} else {
					tablet.clearLives();
				}
			});

			game.playerStates().execute((playerState : PlayerState) => {
				playerState.setRole(PlayerRole.WAITING);
			});
			break;
		case GameState.GAME:
			break;
		case GameState.FINISH:
			this._winners.forEach((tablet : Tablet) => {
				tablet.addScore(ScoreType.VICTORY, 1);
			});

	    	let winnerMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	winnerMsg.setAnnouncementType(AnnouncementType.GAME_FINISH);
	    	winnerMsg.setNames(this._winners.map((tablet : Tablet) => { return tablet.displayName(); }));
	    	game.announcer().broadcast(winnerMsg);
			break;
		case GameState.VICTORY:
	    	let victorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	victorMsg.setAnnouncementType(AnnouncementType.GAME_VICTORY);
	    	victorMsg.setNames(this._winners.map((tablet : Tablet) => { return tablet.displayName(); }));
	    	game.announcer().broadcast(victorMsg);
			break;
		case GameState.ERROR:
	    	let errorMsg = new GameMessage(GameMessageType.ANNOUNCEMENT);
	    	errorMsg.setAnnouncementType(AnnouncementType.GAME_ERROR);
	    	errorMsg.setNames(["TODO: add the error message here"]);
	    	game.announcer().broadcast(errorMsg);
	    	break;
		}
	}
}
