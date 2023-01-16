
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

		this.addKeys(new Keys(game.id()));
	}

	addKeys(keys : Keys) : void { this.addChild(keys.clientId(), keys); }
	getKeys(clientId? : number) : Keys {
		clientId = defined(clientId) ? clientId : game.id();

		// TODO: Keys should be created upon initializing game ID
		if (!this.hasChild(clientId)) {
			this.addKeys(new Keys(clientId));
		}

		return this.getChild<Keys>(clientId);
	}

	override isSource() : boolean { return true; }
	override shouldBroadcast() : boolean { return true; }
}