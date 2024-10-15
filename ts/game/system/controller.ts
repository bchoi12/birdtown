
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { GameMaker } from 'game/system/game_maker'
import { PlayerConfig } from 'game/util/player_config'

import { GameConfigMessage } from 'message/game_config_message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { ui } from 'ui'
import { KeyType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { Stopwatch } from 'util/stopwatch'

export class Controller extends SystemBase implements System {

	private static readonly _maxTimeLimit = 999 * 1000;
	private static readonly _showTimerStates = new Set([
		GameState.SETUP, GameState.GAME, GameState.END,
	]);

	private _gameState : GameState;
	private _gameMaker : GameMaker; 
	private _stopwatch : Stopwatch;

	constructor() {
		super(SystemType.CONTROLLER);

		this._gameState = GameState.UNKNOWN;
		this._gameMaker = this.addSubSystem<GameMaker>(SystemType.GAME_MAKER, new GameMaker());
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

	round() : number { return this._gameMaker.round(); }
	winnerClientId() : number { return this._gameMaker.winnerClientId(); }
	entityLimit(type : EntityType) : number { return this._gameMaker.entityLimit(type); }
	timeLimit(state : GameState) : number { return this._gameMaker.timeLimit(state); }

	config() : GameConfigMessage { return this._gameMaker.config(); }
	gameMode() : GameMode { return this._gameMaker.mode(); }
	getEquips(clientId : number) : [EntityType, EntityType] { return this._gameMaker.getEquips(clientId); }
	startGame(config : GameConfigMessage, playerConfig : PlayerConfig) {
		if (this.gameState() !== GameState.FREE) {
			console.error("Error: trying to start %s in state %s", GameMode[config.type()], GameState[this.gameState()]);
			return;
		}
		if (this._gameMaker.setConfig(config, playerConfig)) {
			this.setGameState(GameState.LOAD);
		}
	}

	stateMillis() : number { return this._stopwatch.millis(); }
	gameState() : GameState { return this._gameState; }
	setGameState(state : GameState) : void {
		if (this._gameState === state) {
			return;
		}

		this._stopwatch.reset();
		this._gameState = state;
		this._gameMaker.setGameState(state);

		// Broadcast state change
		let msg = new GameMessage(GameMessageType.GAME_STATE);
		msg.setGameState(this._gameState);
		game.handleMessage(msg);

		if (isLocalhost()) {
			console.log("%s: game state is %s", this.name(), GameState[state]);
		}
	}
	returnToLobby() : void { this.setGameState(GameState.END); }

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
			ui.clearTimer();
			return;
		}

		const timeLimit = this._gameMaker.timeLimit(this._gameState);

		if (timeLimit > Controller._maxTimeLimit) {
			ui.clearTimer();
			return;
		}

		ui.setTimer(Math.max(0, timeLimit - elapsed));
	}
}