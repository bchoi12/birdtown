
import { game } from 'game'
import { System, ClientSystemManager } from 'game/system'
import { SystemType } from 'game/system/api'
import { Keys } from 'game/system/keys'

import { defined } from 'util/common'

export class Input extends ClientSystemManager implements System {

	private _keys : Map<number, Keys>;

	constructor() {
		super(SystemType.INPUT);

		this.setFactoryFn((clientId : number) => { return this.addKeys(new Keys(clientId)); })
		this._keys = new Map();
	}

	addKeys(keys : Keys) : Keys { return this.registerChild(keys.clientId(), keys); }
	hasKeys(clientId : number) : boolean { return this.hasChild(clientId); }
	getKeys(clientId? : number) : Keys { return this.getChild<Keys>(defined(clientId) ? clientId : game.clientId()); }
}