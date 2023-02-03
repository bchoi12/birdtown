import { game } from 'game'	
import { System, SystemBase, SystemType } from 'game/system'
import { ClientInfo } from 'game/system/client_info'

export class ClientInfos extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENTS);

		this.setFactoryFn((gameId : number) => { this.addClientInfo(new ClientInfo(gameId)); })
	}

	override onNewClient(name : string, gameId : number) : void { this.addClientInfo(new ClientInfo(gameId)); }

	addClientInfo(info : ClientInfo) : ClientInfo { return this.addChild<ClientInfo>(info.gameId(), info); }
	hasClientInfo(gameId : number) : boolean { return this.hasChild(gameId); }
	clientInfos() : Map<number, ClientInfo> { return <Map<number, ClientInfo>>this.children(); }
	unregisterClient(gameId : number) : void { this.unregisterChild(gameId); }
}