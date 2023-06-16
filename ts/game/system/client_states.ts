import { game } from 'game'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { ClientState } from 'game/system/client_state'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { defined } from 'util/common'

export class ClientStates extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENT_STATES);

		this.setName({
			base: "client_states",
		});

		this.setFactoryFn((clientId : number) => { return this.addClientState(new ClientState(clientId)); })
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.NEW_CLIENT) {
			return;
		}

		const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
		const displayName = msg.getProp<string>(GameProp.DISPLAY_NAME);
		let clientState = <ClientState>this.getFactoryFn()(clientId);
		clientState.setDisplayName(displayName);
	}

	queryClientStates(predicate : (state : ClientState) => boolean) : boolean {
		if (!this.isSource()) {
			return false;
		}

		const order = this.childOrder();
		for (let i = 0; i < order.length; ++i) {
			const state = this.getClientState(order[i]);
			if (!predicate(state)) {
				return false;
			}
		}
		return true;
	}

	addClientState(info : ClientState) : ClientState { return this.registerChild<ClientState>(info.clientId(), info); }
	hasClientState(clientId : number) : boolean { return this.hasChild(clientId); }
	getClientState(clientId? : number) : ClientState { return this.getChild<ClientState>(defined(clientId) ? clientId : game.clientId()); }
	clientStates() : Map<number, ClientState> { return <Map<number, ClientState>>this.getChildren(); }
	unregisterClientState(clientId : number) : void { this.unregisterChild(clientId); }

	
}