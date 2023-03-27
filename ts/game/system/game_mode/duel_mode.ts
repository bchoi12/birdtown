
import { game } from 'game'

import { EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { SystemType } from 'game/system'
import { LevelType, NewClientMsg } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { GameModeBase } from 'game/system/game_mode'

import { Data } from 'network/data'

import { ui } from 'ui'

import { Timer } from 'util/timer'

export enum DuelState {
	UNKNOWN,
	FREE,
	SETUP,
	GAME,
	VICTORY,
}

export class DuelMode extends GameModeBase {

	private _state : DuelState;
	private _players : Player[];
	private _resetTimer : Timer;

	constructor() {
		super(SystemType.DUEL_MODE);

		this._state = DuelState.FREE;
		this._players = [];
		this._resetTimer = this.newTimer();
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
					clientState.requestReadyState();
				}
			});
		}

		if (!this.isSource()){
			return;
		}

		switch(this._state) {
		case DuelState.SETUP:
			game.level().setLevel(LevelType.BIRDTOWN);
			game.level().setSeed(Math.floor(1000 * Math.random()));
			this._players.forEach((player : Player) => {
				player.setDeactivated(true);
			});
			break;
		case DuelState.GAME:
			this._players.forEach((player : Player) => {
				player.respawn();
				player.setDeactivated(false);
			});
			game.level().finishLoad();
			break;
		case DuelState.VICTORY:
			this._resetTimer.start(1000, () => {
				this.setState(DuelState.SETUP);
			});
			break;
		}
	}

	override onNewClient(msg : NewClientMsg) : void {
		super.onNewClient(msg);

		if (!this.isSource()) {
			return;
		}

		if (this._state === DuelState.FREE) {
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

		if (this._state === DuelState.FREE) {
			this._players = game.entities().queryEntities<Player>({
				type: EntityType.PLAYER,
				mapQuery: {},
			});

			let initialized = 0;
			for (const player of this._players) {
				if (player.initialized() && !player.dead()) {
					initialized++;
				}

				if (initialized >= 2) {
					this.setState(DuelState.SETUP);
					break;
				}
			}
		} else if (this._state === DuelState.SETUP) {
			if (game.clientStates().allLoaded()) {
				this.setState(DuelState.GAME);
			}
		} else if (this._state === DuelState.GAME) {
			let alive = 0;
			for (const player of this._players) {
				if (!player.dead()) {
					alive++;
				}
			}

			if (alive <= 1) {
				this.setState(DuelState.VICTORY);
			}
		}
	}
}