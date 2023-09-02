import { game } from 'game'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'

import { defined } from 'util/common'

export class ClientStates extends ClientSystemManager implements System {

	constructor() {
		super(SystemType.CLIENT_STATES);

		this.addNameParams({
			base: "client_states",
		});

		this.setFactoryFn((clientId : number) => { return this.addClientState(new ClientState(clientId)); })
	}

	addClientState(info : ClientState) : ClientState { return this.registerChild<ClientState>(info.clientId(), info); }
	hasClientState(clientId : number) : boolean { return this.hasChild(clientId); }
	getClientState(clientId? : number) : ClientState { return this.getChild<ClientState>(defined(clientId) ? clientId : game.clientId()); }
	unregisterClientState(clientId : number) : void { this.unregisterChild(clientId); }
}