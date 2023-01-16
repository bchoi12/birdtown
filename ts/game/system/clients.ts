import * as BABYLON from 'babylonjs'

import { game } from 'game'	
import { EntityType } from 'game/entity'
import { System, SystemBase, SystemType } from 'game/system'
import { ClientInfo } from 'game/system/client_info'

import { ChannelType } from 'network/connection'
import { DataFilter } from 'network/data'
import { MessageType } from 'network/message'

export class Clients extends SystemBase implements System {

	constructor() {
		super(SystemType.CLIENTS);

		this.setFactoryFn((id : number) => { this.addClient(new ClientInfo(id)); })
	}

	// TODO: also register the host here
	register(name : string, gameId : number) : void {
		if (!this.isSource()) { return; }

		let connection = game.connection();
		connection.setGameId(name, gameId);

		connection.send(name, ChannelType.TCP, {
			T: MessageType.INIT_CLIENT,
			I: gameId,
		});

		let client = this.addClient(new ClientInfo(gameId));

		let entities = game.entities();
    	entities.addEntity(EntityType.PLAYER, {
    		clientId: gameId,
    		profileInit: {
	    		pos: {x: 0, y: 10},
    		},
    	});

		const [message, has] = game.systemRunner().message(DataFilter.ALL);
		if (has) {
			connection.send(name, ChannelType.TCP, message);
		}
	}

	addClient(info : ClientInfo) : ClientInfo { return this.addChild<ClientInfo>(info.id(), info); }
	hasClient(id : number) : boolean { return this.hasChild(id); }
	clients() : Map<number, ClientInfo> { return <Map<number, ClientInfo>>this.children(); }
	unregisterClient(id : number) : void { this.unregisterChild(id); }
}