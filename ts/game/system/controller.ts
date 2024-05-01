
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { GameData } from 'game/game_data'
import { StepData } from 'game/game_object'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { GameMaker } from 'game/system/game_maker'

import { GameConfigMessage } from 'message/game_config_message'
import { GameMessage, GameMessageType } from 'message/game_message'

import { KeyType } from 'ui/api'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'
import { Timer} from 'util/timer'

export class Controller extends SystemBase implements System {

	private _gameState : GameState;
	private _gameMaker : GameMaker; 

	constructor() {
		super(SystemType.CONTROLLER);

		this._gameState = GameState.UNKNOWN;
		this._gameMaker = this.addSubSystem<GameMaker>(SystemType.GAME_MAKER, new GameMaker());

		this.addProp<GameState>({
			export: () => { return this.gameState(); },
			import: (obj : GameState) => { this.setGameState(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
	}

	override initialize() : void {
		super.initialize();

		if (this.isSource()) {
			this.setGameState(GameState.FREE);
		}
	}

	round() : number { return this._gameMaker.round(); }

	gameMode() : GameMode { return this._gameMaker.mode(); }
	startGame(mode : GameMode, config? : GameConfigMessage) {
		if (this.gameState() !== GameState.FREE) {
			console.error("Error: trying to start %s in state %s", GameMode[mode], GameState[this.gameState()]);
			return;
		}
		if (this._gameMaker.setMode(mode, config)) {
			this.setGameState(GameState.SETUP);
		}
	}

	gameState() : GameState { return this._gameState; }
	setGameState(state : GameState) : void {
		if (this._gameState === state) {
			return;
		}

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

	override preUpdate(stepData : StepData) : void {
		super.preUpdate(stepData);

		if (!this.isSource()) {
			return;
		}

		this.setGameState(this._gameMaker.queryState(this.gameState()));

		/*
		if (game.keys().getKey(KeyType.INTERACT).pressed()) {
			this.startGame(GameMode.DUEL);
		}
		*/
	}
}