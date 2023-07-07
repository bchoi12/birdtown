import { game } from 'game'
import { System, SystemBase } from 'game/system'
import { SystemType } from 'game/system/api'
import { ClientSideState } from 'game/system/client_side_state'

import { GameMessage, GameMessageType, GameProp } from 'message/game_message'

import { defined } from 'util/common'

// TODO: rename ClientStates
export class ClientSideStates extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENT_SIDE_STATES);

		this.setName({
			base: "client_states",
		});

		this.setFactoryFn((clientId : number) => { return this.addClientState(new ClientSideState(clientId)); })
	}

	override handleMessage(msg : GameMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== GameMessageType.NEW_CLIENT) {
			return;
		}

		const clientId = msg.getProp<number>(GameProp.CLIENT_ID);
		const displayName = msg.getProp<string>(GameProp.DISPLAY_NAME);
		let clientState = <ClientSideState>this.getFactoryFn()(clientId);
		clientState.setDisplayName(displayName);
	}

	queryClientStates(predicate : (state : ClientSideState) => boolean) : boolean {
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

	addClientState(info : ClientSideState) : ClientSideState { return this.registerChild<ClientSideState>(info.clientId(), info); }
	hasClientState(clientId : number) : boolean { return this.hasChild(clientId); }
	getClientState(clientId? : number) : ClientSideState { return this.getChild<ClientSideState>(defined(clientId) ? clientId : game.clientId()); }
	clientStates() : Map<number, ClientSideState> { return <Map<number, ClientSideState>>this.getChildren(); }
	unregisterClientState(clientId : number) : void { this.unregisterChild(clientId); }

	
}