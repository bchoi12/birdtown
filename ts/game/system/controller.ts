
import { game } from 'game'

import { EntityType } from 'game/entity/api'
import { Player } from 'game/entity/player'
import { System, SystemBase } from 'game/system'
import { ClientLoadState, ControllerState, LevelType, SystemType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'
import { GameMaker } from 'game/system/game_maker'
import { DuelMaker } from 'game/system/game_maker/duel_maker'
import { GameData } from 'game/game_data'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { Optional } from 'util/optional'
import { Timer } from 'util/timer'

export class Controller extends SystemBase implements System {

	private _state : ControllerState;
	private _resetTimer : Timer;
	private _gameMaker : Optional<GameMaker>; 

	constructor() {
		super(SystemType.GAME_MODE);

		this._state = ControllerState.WAITING;
		this._resetTimer = this.newTimer();
		this._gameMaker = new Optional();

		this.addProp<number>({
			export: () => { return this.state(); },
			import: (obj : number) => { this.setState(obj); },
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

	state() : number { return this._state; }
	setState(state : number) : void {
		if (this._state === state) {
			return;
		}

		this._state = state;
		if (this._state === ControllerState.SETUP) {
			game.clientStates().executeCallback<ClientState>((clientState : ClientState) => {
				if (clientState.clientIdMatches()) {
					clientState.setLoadState(ClientLoadState.CHECK_READY);
				}
			});
		}
	}

	trySetup() : void {
		if (!this._gameMaker.has()) { return; }

		if (this._state === ControllerState.WAITING) {
			if (this._gameMaker.get().querySetup()) {
				this._gameMaker.get().setup();
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

		if (this._state === ControllerState.WAITING) {
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

		if (this._state === ControllerState.SETUP) {
			if (this._gameMaker.get().queryStart()) {
				this._gameMaker.get().start();
				this.setState(ControllerState.STARTED);
			}
		} else if (this._state === ControllerState.STARTED) {
			if (this._gameMaker.get().queryFinish()) {
				this._gameMaker.get().finish();
				this.setState(ControllerState.FINISH);
			}
		} else if (this._state === ControllerState.FINISH) {
			if (!this._resetTimer.hasTimeLeft()) {
				this._resetTimer.start(1000, () => {
					this._gameMaker.get().setup();
					this.setState(ControllerState.SETUP);
				});
			}
		}
	}
}