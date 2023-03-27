import { game } from 'game'
import { System, SystemBase, SystemType } from 'game/system'
import { NewClientMsg } from 'game/system/api'
import { ClientState } from 'game/system/client_state'

import { defined } from 'util/common'

export class ClientStates extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENT_STATES);

		this.setName({
			base: "client_states",
		});

		this.setFactoryFn((gameId : number) => { return this.addClientState(new ClientState(gameId)); })
	}

	override onNewClient(msg : NewClientMsg) : void {
		super.onNewClient(msg);

		const clientState = <ClientState>this.getFactoryFn()(msg.gameId);
		clientState.setDisplayName(msg.displayName);
	}

	allLoaded() : boolean {
		if (!this.isSource()) {
			return false;
		}

		const levelVersion = game.level().version();
		const order = this.childOrder();
		for (let i = 0; i < order.length; ++i) {
			const state = this.getClientState(order[i]);
			if (!state.prepared() || state.levelVersion() !== levelVersion) {
				return false;
			}
		}
		return true;
	}

	addClientState(info : ClientState) : ClientState { return this.addChild<ClientState>(info.gameId(), info); }
	hasClientState(gameId : number) : boolean { return this.hasChild(gameId); }
	getClientState(gameId? : number) : ClientState { return this.getChild<ClientState>(defined(gameId) ? gameId : game.id()); }
	clientStates() : Map<number, ClientState> { return <Map<number, ClientState>>this.getChildren(); }
	unregisterClientState(gameId : number) : void { this.unregisterChild(gameId); }
}