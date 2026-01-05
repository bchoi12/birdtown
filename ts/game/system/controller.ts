
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { TeamType } from 'game/component/api'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/bird/player'
import { ConfigFactory } from 'game/factory/config_factory'
import { System, SystemBase } from 'game/system'
import { SystemType, WinConditionType } from 'game/system/api'
import { GameMaker } from 'game/system/game_maker'
import { PlayerState } from 'game/system/player_state'
import { PlayerConfig } from 'game/util/player_config'

import { Flags } from 'global/flags'

import { GameConfigMessage } from 'message/game_config_message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'

import { Optional } from 'util/optional'
import { Stopwatch } from 'util/stopwatch'

export class Controller extends SystemBase implements System {

	private static readonly _maxTimeLimit = 999 * 1000;
	private static readonly _showTimerStates = new Set([
		GameState.SETUP, GameState.GAME, GameState.FINISH, GameState.VICTORY, GameState.ERROR,
	]);

	private _gameState : GameState;
	private _gameMaker : GameMaker; 
	private _rematchMode : GameMode;
	private _stopwatch : Stopwatch;

	constructor() {
		super(SystemType.CONTROLLER);

		this._gameState = GameState.UNKNOWN;
		this._gameMaker = this.addSubSystem<GameMaker>(SystemType.GAME_MAKER, new GameMaker());
		this._rematchMode = GameMode.UNKNOWN;
		this._stopwatch = new Stopwatch();

		this.addProp<GameState>({
			export: () => { return this.gameState(); },
			import: (obj : GameState) => { this.setGameState(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			export: () => { return this._stopwatch.seconds(); },
			import: (obj : number) => { this.updateTimeLimit(obj * 1000); },
		});
	}

	override initialize() : void {
		super.initialize();

		if (this.isSource()) {
			this.setGameState(GameState.FREE);
		}
	}

	static canStart(mode : GameMode) : [string[], boolean] {
		if (mode === GameMode.UNKNOWN) {
			return [["No game mode selected"], false];
		}

		const config = ConfigFactory.defaultConfig(mode);
		const numPlayers = game.tablets().numSetup();
		let errors = [];
		if (config.hasPlayersMin() && numPlayers < config.getPlayersMin()) {
			errors.push(`Need ${config.getPlayersMin()} players for this game mode`);
			errors.push(`Current number of players is ${numPlayers}`);
		}
		return [errors, errors.length === 0];
	}

	round() : number { return this._gameMaker.round(); }
	winnerClientId() : number { return this._gameMaker.winnerClientId(); }
	winningTeam() : TeamType { return this._gameMaker.winningTeam(); }
	isTeamMode() : boolean { return this._gameMaker.isTeamMode(); }
	entityLimit(type : EntityType) : number { return this._gameMaker.entityLimit(type); }
	timeLimit(state : GameState) : number { return this._gameMaker.timeLimit(state); }

	config() : GameConfigMessage { return this._gameMaker.config(); }
	gameMode() : GameMode { return this._gameMaker.mode(); }
	allowRevives() : boolean {
		return this._gameMaker.config().getWinCondition() === WinConditionType.TEAM_LIVES;
	}
	useTeamSpawns() : boolean {
		return this._gameMaker.config().getWinCondition() === WinConditionType.TEAM_LIVES;
	}

	getEquips(clientId : number) : [EntityType, EntityType] { return this._gameMaker.getEquips(clientId); }
	startGame(config : GameConfigMessage, playerConfig : PlayerConfig) : void {
		if (this.gameState() !== GameState.FREE) {
			console.error("Error: trying to start %s in state %s", GameMode[config.type()], GameState[this.gameState()]);
			return;
		}
		if (this._gameMaker.setConfig(config, playerConfig)) {
			ConfigFactory.save(config);
			this.setGameState(GameState.PRELOAD);
			this._rematchMode = config.type();
		}
	}
	canRematch() : boolean { return this._rematchMode !== GameMode.UNKNOWN && this._rematchMode !== GameMode.PRACTICE; }
	rematch() : boolean {
		if (this.gameState() !== GameState.FREE) {
			console.error("Error: trying to rematch in state %s.", GameState[this.gameState()]);
			return false;
		}

		if (!this.canRematch()) {
			console.error("Error: rematch not allowed");
			return false;
		}

		if (this._gameMaker.rematch(this._rematchMode)) {
			this.setGameState(GameState.PRELOAD);
			return true;
		}

		return false;
	}

	stateMillis() : number { return this._stopwatch.millis(); }
	gameState() : GameState { return this._gameState; }
	setGameState(state : GameState) : void {
		if (this._gameState === state) {
			return;
		}

		ui.clearTimer();
		this._stopwatch.reset();
		this._gameState = state;
		this._gameMaker.setGameState(state);

		// Broadcast state change
		game.runner().setGameState(this._gameState);
		ui.setGameState(this._gameState);

		if (Flags.printDebug.get()) {
			console.log("%s: game state is %s", this.name(), GameState[state]);
		}
	}
	inSetup() : boolean { return this._gameState === GameState.LOAD || this._gameState === GameState.SETUP; }
	terminateGame() : void { this.setGameState(GameState.END); }

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (!this.isSource()) {
			return;
		}

		this._stopwatch.elapse(stepData.realMillis);
		this.updateTimeLimit(this._stopwatch.millis());
		this.setGameState(this._gameMaker.queryState(this.gameState()));
	}

	private updateTimeLimit(elapsed : number) : void {
		if (!Controller._showTimerStates.has(this._gameState)) {
			return;
		}

		const timeLimit = this._gameMaker.timeLimit(this._gameState);
		if (timeLimit < Controller._maxTimeLimit) {
			ui.setTimer(Math.max(0, timeLimit - elapsed));
		}
	}
}