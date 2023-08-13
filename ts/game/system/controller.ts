
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { GameMaker } from 'game/system/game_maker'
import { DuelMaker } from 'game/system/game_maker/duel_maker'
import { GameData } from 'game/game_data'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

export class Controller extends SystemBase implements System {

	private static readonly _clientSideStates = new Set<GameState>([GameState.LOADING, GameState.SETUP]);

	private _gameMode : GameMode;
	private _gameState : GameState;
	private _round : number;
	private _resetTimer : Timer;
	private _gameMaker : Optional<GameMaker>; 

	constructor() {
		super(SystemType.GAME_MODE);

		this._gameMode = GameMode.UNKNOWN;
		this._gameState = GameState.WAITING;
		this._round = 0;
		this._resetTimer = this.newTimer();
		this._gameMaker = new Optional();

		this.addProp<number>({
			export: () => { return this.gameState(); },
			import: (obj : number) => { this.setGameState(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		});
		this.addProp<number>({
			has: () => { return this._round > 0; },
			export: () => { return this._round; },
			import: (obj : number) => { this._round = obj; },
			options: {
				filters: GameData.tcpFilters,
			},
		})
	}

	override initialize() : void {
		super.initialize();

		if (this.isHost()) {
			this._gameMaker.set(new DuelMaker());
		}
	}

	round() : number { return this._round; }
	gameMode() : GameMode { return this._gameMode; }
	setGameMode(mode : GameMode) {
		this._gameMode = mode;

		if (this._gameState === GameState.WAITING) {
			if (this._gameMaker.get().queryAdvance(this._gameState)) {
				this.advanceGameState();
				this._round = 1;
			}
		}
	}

	gameState() : number { return this._gameState; }
	advanceGameState() : void {
		if (this._gameState === GameState.FINISHING) {
			return;
		}
		this.setGameState(this._gameState + 1);
	}
	setGameState(state : number) : void {
		if (this._gameState === state) {
			return;
		}

		this._gameState = state;

		if (this._gameMaker.has()) {
			this._gameMaker.get().onStateChange(state);
		}

		let msg = new GameMessage(GameMessageType.GAME_STATE);
		msg.setProp<GameState>(GameProp.STATE, this._gameState);
		game.handleMessage(msg);
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (!this.isSource()) {
			return;
		}

		if (msg.type() !== GameMessageType.NEW_CLIENT) {
			return;
		}

		if (this._gameState === GameState.WAITING) {
			const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
    		let [player, hasPlayer] = game.entities().addEntity<Player>(EntityType.PLAYER, {
    			clientId: clientId,
    			profileInit: {
	    			pos: {x: 1, y: 10},
    			},
	    	});
	    	if (hasPlayer) {
	    		player.setSpawn({x: 1, y: 10});
	    	}
		}
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (!this._gameMaker.has()) { return; }

		// TODO: remove this and generalize better
		if (this._gameState === GameState.WAITING) {
			return;
		}

		// TODO: also generalize reset better
		if (this._gameState === GameState.FINISHING) {
			if (!this._resetTimer.hasTimeLeft()) {
				this._resetTimer.start(1000, () => {
					this._round++;
					this.setGameState(GameState.SETUP);
				});
			}
			return;
		}

		if (this._gameMaker.get().queryAdvance(this._gameState)) {
			this.advanceGameState();
		}
	}
}