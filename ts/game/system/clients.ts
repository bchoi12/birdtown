import * as BABYLON from 'babylonjs'

import { game } from 'game'	
import { EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'
import { ClientInfo } from 'game/system/client_info'

import { ChannelType } from 'network/netcode'
import { DataFilter } from 'network/data'
import { MessageType } from 'network/message'

// TODO: deprecate along with ClientInfo?
export class Clients extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENTS);

		this.setFactoryFn((id : number) => { this.addClient(new ClientInfo(id)); })
	}

	override onNewClient(name : string, gameId : number) : void { this.addClient(new ClientInfo(gameId)); }

	addClient(info : ClientInfo) : ClientInfo { return this.addChild<ClientInfo>(info.id(), info); }
	hasClient(id : number) : boolean { return this.hasChild(id); }
	clients() : Map<number, ClientInfo> { return <Map<number, ClientInfo>>this.children(); }
	unregisterClient(id : number) : void { this.unregisterChild(id); }
}