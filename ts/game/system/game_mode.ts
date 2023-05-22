
import { game } from 'game'

import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { LevelType, SystemType, NewClientMsg } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { DuelMaker } from 'game/system/game_maker/duel_maker'

import { GameData } from 'game/game_data'

import { Timer } from 'util/timer'

export enum GameState {
	UNKNOWN,
	WAITING,
	SETUP,
	STARTED,
	FINISH,
}

// TODO: rename controller?
export class GameMode extends SystemBase implements System {

	private _state : GameState;
	private _resetTimer : Timer;

	// TODO: Optional<GameMaker>
	private _duelMaker : DuelMaker; 

	constructor() {
		super(SystemType.GAME_MODE);

		this._state = GameState.WAITING;
		this._resetTimer = this.newTimer();

		this._duelMaker = new DuelMaker();

		this.addProp<number>({
			export: () => { return this.state(); },
			import: (obj : number) => { this.setState(obj); },
			options: {
				filters: GameData.tcpFilters,
			},
		})
	}

	state() : number { return this._state; }
	setState(state : number) : void {
		if (this._state === state) {
			return;
		}

		this._state = state;
		if (this._state === GameState.SETUP) {
			game.clientStates().executeCallback<ClientState>((clientState : ClientState) => {
				if (clientState.gameId() === game.id()) {
					clientState.requestSetupState();
				}
			});
		}
	}

	trySetup() : void {
		if (this._state === GameState.WAITING) {
			if (this._duelMaker.querySetup()) {
				this._duelMaker.setup();
				this.setState(GameState.SETUP);
			}
		}
	}

	override onNewClient(msg : NewClientMsg) : void {
		super.onNewClient(msg);

		if (!this.isSource()) {
			return;
		}

		if (this._state === GameState.WAITING) {
    		let [player, hasPlayer] = game.entities().addEntity<Player>(EntityType.PLAYER, {
    			clientId: msg.gameId,
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

		if (!this.isSource()) {
			return;
		}

		if (this._state === GameState.SETUP) {
			if (this._duelMaker.queryStart()) {
				this._duelMaker.start();
				this.setState(GameState.STARTED);
			}
		} else if (this._state === GameState.STARTED) {
			if (this._duelMaker.queryFinish()) {
				this._duelMaker.finish();
				this.setState(GameState.FINISH);
			}
		} else if (this._state === GameState.FINISH) {
			if (!this._resetTimer.hasTimeLeft()) {
				this._resetTimer.start(1000, () => {
					this._duelMaker.setup();
					this.setState(GameState.SETUP);
				});
			}
		}
	}
}