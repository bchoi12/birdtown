import { game } from 'game'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { PlayerState } from 'game/system/player_state'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { defined } from 'util/common'

export class PlayerStates extends SystemBase implements System {

	constructor() {
		super(SystemType.PLAYER_STATES);

		this.setName({
			base: "player_states",
		});

		this.setFactoryFn((clientId : number) => { return this.addPlayerState(new PlayerState(clientId)); })
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.NEW_CLIENT) {
			return;
		}

		const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
		const displayName = msg.getProp<string>(GameProp.DISPLAY_NAME);
		let playerState = <PlayerState>this.getFactoryFn()(clientId);
	}

	addPlayerState(info : PlayerState) : PlayerState { return this.registerChild<PlayerState>(info.clientId(), info); }
	hasPlayerState(clientId : number) : boolean { return this.hasChild(clientId); }
	getPlayerState(clientId? : number) : PlayerState { return this.getChild<PlayerState>(defined(clientId) ? clientId : game.clientId()); }
	queryPlayerStates(predicate : (state : PlayerState) => boolean) : boolean { return this.queryChildren<PlayerState>(predicate); }
	playerStates() : Map<number, PlayerState> { return <Map<number, PlayerState>>this.getChildren(); }
	unregisterPlayerState(clientId : number) : void { this.unregisterChild(clientId); }	
}