
import { game } from 'game'

import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { ControllerState, LevelType, SystemType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { DuelMaker } from 'game/system/game_maker/duel_maker'
import { GameData } from 'game/game_data'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { Timer } from 'util/timer'

export class Controller extends SystemBase implements System {

	private _state : ControllerState;
	private _resetTimer : Timer;

	// TODO: Optional<GameMaker>
	private _duelMaker : DuelMaker; 

	constructor() {
		super(SystemType.GAME_MODE);

		this._state = ControllerState.WAITING;
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
		if (this._state === ControllerState.SETUP) {
			game.clientStates().executeCallback<ClientState>((clientState : ClientState) => {
				if (clientState.clientId() === game.clientId()) {
					clientState.requestSetupState();
				}
			});
		}
	}

	trySetup() : void {
		if (this._state === ControllerState.WAITING) {
			if (this._duelMaker.querySetup()) {
				this._duelMaker.setup();
				this.setState(ControllerState.SETUP);
			}
		}
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (!this.isSource()) {
			return;
		}

		if (msg.type() !== GameMessageType.NEW_CLIENT) {
			return;
		}

		const clientId = msg.getProp<number>(GameProp.CLIENT_ID);

		if (this._state === ControllerState.WAITING) {
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

		if (!this.isSource()) {
			return;
		}

		if (this._state === ControllerState.SETUP) {
			if (this._duelMaker.queryStart()) {
				this._duelMaker.start();
				this.setState(ControllerState.STARTED);
			}
		} else if (this._state === ControllerState.STARTED) {
			if (this._duelMaker.queryFinish()) {
				this._duelMaker.finish();
				this.setState(ControllerState.FINISH);
			}
		} else if (this._state === ControllerState.FINISH) {
			if (!this._resetTimer.hasTimeLeft()) {
				this._resetTimer.start(1000, () => {
					this._duelMaker.setup();
					this.setState(ControllerState.SETUP);
				});
			}
		}
	}
}