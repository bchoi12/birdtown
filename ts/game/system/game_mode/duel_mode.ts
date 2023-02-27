
import { game } from 'game'

import { EntityType } from 'game/entity'
import { Player } from 'game/entity/player'
import { SystemType } from 'game/system'
import { GameModeBase } from 'game/system/game_mode'
import { LevelType } from 'game/system/level'

import { Data } from 'network/data'

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

		switch(state) {
		case DuelState.SETUP:
			break;
		case DuelState.GAME:
			game.level().setLevel(LevelType.BIRDTOWN);
			game.level().setSeed(Math.floor(1000 * Math.random()));
			this._players.forEach((player : Player) => {
				player.respawn();
			})
			break;
		case DuelState.VICTORY:
			this._resetTimer.start(1000, () => {
				this.setState(DuelState.GAME);
			});
			break;
		}

		this._state = state;
	}

	override onNewClient(name : string, clientId : number) : void {
		if (this._state === DuelState.FREE) {
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

		if (this._state === DuelState.FREE) {
			this._players = game.entities().queryEntities<Player>({
				type: EntityType.PLAYER,
				mapQuery: {},
			});
		}

		if (!this.isSource()) {
			return;
		}

		if (this._state === DuelState.FREE) {
			let initialized = 0;
			for (const player of this._players) {
				if (player.initialized() && !player.dead()) {
					initialized++;
				}

				if (initialized >= 2) {
					this.setState(DuelState.GAME);
					break;
				}
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