
import { game } from 'game'
import { System, SystemBase, SystemType } from 'game/system'
import { Keys } from 'game/system/keys'

import { Data, DataFilter, DataMap } from 'network/data'

import { ui, Key } from 'ui'
import { defined } from 'util/common'
import { Vec2 } from 'util/vector'

export class Input extends SystemBase implements System {

	private _keys : Map<number, Keys>;

	constructor() {
		super(SystemType.INPUT);

		this.setName({
			base: "input",
		});

		this._keys = new Map();
	}

	keys(id? : number) : Keys {
		id = defined(id) ? id : game.id();

		if (!this._keys.has(id)) {
			this._keys.set(id, new Keys(id));
			this.addChild(id, this._keys.get(id))
		}

		return this._keys.get(id);
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this.keys().preUpdate(millis);
	}

	override preRender() : void {
		super.preRender();

		this.keys().preRender();
	}

	override isSource() : boolean { return true; }
	override shouldBroadcast() : boolean { return true; }
}