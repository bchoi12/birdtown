import { game } from 'game'
import { NewClientMsg, System, SystemBase, SystemType } from 'game/system'
import { ClientState } from 'game/system/client_state'

export class ClientStates extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENT_STATES);

		this.setName({
			base: "client_states",
		});

		this.setFactoryFn((gameId : number) => { this.addClientState(new ClientState(gameId)); })
	}

	override onNewClient(msg : NewClientMsg) : void {
		super.onNewClient(msg);
		this.getFactoryFn()(msg.gameId);
	}

	allLoaded() : boolean {
		if (!this.isSource()) {
			return false;
		}

		const levelVersion = game.level().version();
		const order = this.childOrder();
		for (let i = 0; i < order.length; ++i) {
			const state = this.getClientState(order[i]);
			if (state.levelVersion() !== levelVersion) {
				return false;
			}
		}

		console.log("All %d loaded on %d", order.length, levelVersion);
		return true;
	}

	addClientState(info : ClientState) : ClientState { return this.addChild<ClientState>(info.gameId(), info); }
	hasClientState(gameId : number) : boolean { return this.hasChild(gameId); }
	getClientState(gameId : number) : ClientState { return this.getChild<ClientState>(gameId); }
	clientStates() : Map<number, ClientState> { return <Map<number, ClientState>>this.getChildren(); }
	unregisterClientState(gameId : number) : void { this.unregisterChild(gameId); }
}