import { game } from 'game'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { PlayerState } from 'game/system/player_state'

import { defined } from 'util/common'

export class PlayerStates extends ClientSystemManager implements System {

	constructor() {
		super(SystemType.PLAYER_STATES);

		this.addNameParams({
			base: "player_states",
		});

		this.setFactoryFn((clientId : number) => { return this.addPlayerState(new PlayerState(clientId)); })
	}

	addPlayerState(info : PlayerState) : PlayerState { return this.registerChild<PlayerState>(info.clientId(), info); }
	hasPlayerState(clientId : number) : boolean { return this.hasChild(clientId); }
	getPlayerState(clientId? : number) : PlayerState { return this.getChild<PlayerState>(defined(clientId) ? clientId : game.clientId()); }
	unregisterPlayerState(clientId : number) : void { this.unregisterChild(clientId); }
}