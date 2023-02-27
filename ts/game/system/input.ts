
import { game } from 'game'
import { System, SystemBase, SystemType } from 'game/system'
import { Keys } from 'game/system/keys'

import { defined } from 'util/common'

export class Input extends SystemBase implements System {

	private _keys : Map<number, Keys>;

	constructor() {
		super(SystemType.INPUT);

		this.setName({
			base: "input",
		});

		this.setFactoryFn((clientId : number) => { this.addKeys(new Keys(clientId)); })

		this._keys = new Map();
	}

	override initialize() : void {
		super.initialize();

		if (!this.hasKeys(game.id())) {
			this.addKeys(new Keys(game.id()));
		}
	}

	hasKeys(clientId : number) : boolean { return this.hasChild(clientId); }
	addKeys(keys : Keys) : void { this.addChild(keys.clientId(), keys); }
	getKeys(clientId? : number) : Keys {
		clientId = defined(clientId) ? clientId : game.id();
		return this.getChild<Keys>(clientId);
	}

	override onNewClient(name : string, clientId : number) {
		super.onNewClient(name, clientId);

		if (!this.hasKeys(clientId)) {
			this.addKeys(new Keys(clientId));
		}
	}
}