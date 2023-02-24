
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
	GAME,
}

export class GameModeDuel extends GameModeBase {

	private _state : DuelState;

	private _players : Player[];

	private _resetTimer : Timer;

	constructor() {
		super(SystemType.GAME_MODE_DUEL);

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
		case DuelState.GAME:
			game.level().setLevel(LevelType.BIRDTOWN);
			game.level().setSeed(333);
			break;
		}

		this._state = state;
	}

	override onNewClient(name : string, clientId : number) : void {
		if (this._state === DuelState.FREE) {
    		game.entities().addEntity(EntityType.PLAYER, {
    			clientId: clientId,
    			profileInit: {
	    			pos: {x: 0, y: 10},
    			},
	    	});
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

			if (this._players.length >= 2) {
				this.setState(DuelState.GAME);
			}
		} else if (this._state === DuelState.GAME) {
			let alive = 0;
			for (const player of this._players) {
				if (!player.dead()) {
					alive++;
				}
			}

			if (alive <= 1 && !this._resetTimer.hasTimeLeft()) {
				console.log("RESET");
				this._resetTimer.start(1000, () => {
					console.log("LEVEL");
					game.level().setSeed(Math.floor(1000 * Math.random()));
				});
			}
		}
	}
}