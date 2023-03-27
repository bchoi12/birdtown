
import { game } from 'game'
import { System, SystemBase, SystemType } from 'game/system'
import { NewClientMsg } from 'game/system/api'
import { Keys } from 'game/system/keys'

import { defined } from 'util/common'

export class Input extends SystemBase implements System {

	private _keys : Map<number, Keys>;

	constructor() {
		super(SystemType.INPUT);

		this.setName({
			base: "input",
		});

		this.setFactoryFn((clientId : number) => { return this.addKeys(new Keys(clientId)); })

		this._keys = new Map();
	}

	override onNewClient(msg : NewClientMsg) {
		super.onNewClient(msg);
		this.getFactoryFn()(msg.gameId);
	}

	addKeys(keys : Keys) : Keys { return this.addChild(keys.gameId(), keys); }
	hasKeys(clientId : number) : boolean { return this.hasChild(clientId); }
	getKeys(clientId? : number) : Keys {
		clientId = defined(clientId) ? clientId : game.id();
		return this.getChild<Keys>(clientId);
	}
}