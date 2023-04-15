
import { game } from 'game'

import { EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { SystemType } from 'game/system'
import { LevelType, NewClientMsg } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { DuelMaker } from 'game/system/game_mode/duel_maker'
import { GameModeBase } from 'game/system/game_mode'

import { Data } from 'network/data'

import { Timer } from 'util/timer'

export enum DuelState {
	UNKNOWN,
	WAITING,
	SETUP,
	STARTED,
	FINISH,
}

// TODO: change to GameMode
export class DuelMode extends GameModeBase {

	private _state : DuelState;
	private _resetTimer : Timer;

	private _duelMaker : DuelMaker; 

	constructor() {
		super(SystemType.DUEL_MAKER);

		this._state = DuelState.WAITING;
		this._resetTimer = this.newTimer();

		this._duelMaker = new DuelMaker();
	}

	override state() : number { return this._state; }
	override setState(state : number) : void {
		if (this._state === state) {
			return;
		}

		this._state = state;

		if (this._state === DuelState.SETUP) {
			game.clientStates().executeCallback<ClientState>((clientState : ClientState) => {
				if (clientState.gameId() === game.id()) {
					clientState.requestSetupState();
				}
			});
		}
	}

	override onNewClient(msg : NewClientMsg) : void {
		super.onNewClient(msg);

		if (!this.isSource()) {
			return;
		}

		if (this._state === DuelState.WAITING) {
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

		if (this._state === DuelState.WAITING) {
			if (this._duelMaker.querySetup()) {
				this._duelMaker.setup();
				this.setState(DuelState.SETUP);
			}
		} else if (this._state === DuelState.SETUP) {
			if (this._duelMaker.queryStart()) {
				this._duelMaker.start();
				this.setState(DuelState.STARTED);
			}
		} else if (this._state === DuelState.STARTED) {
			if (this._duelMaker.queryFinish()) {
				this._duelMaker.finish();
				this.setState(DuelState.FINISH);
			}
		} else if (this._state === DuelState.FINISH) {
			if (!this._resetTimer.hasTimeLeft()) {
				this._resetTimer.start(1000, () => {
					this._duelMaker.setup();
					this.setState(DuelState.SETUP);
				});
			}
		}
	}
}