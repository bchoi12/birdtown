
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Keys } from 'game/component/keys'
import { Data, DataFilter, DataMap } from 'game/data'

import { ui, Key } from 'ui'
import { defined } from 'util/common'
import { Vec2 } from 'util/vector'

enum Prop {
	UNKNOWN,
	CLIENT_KEYS,
}

export class Input extends ComponentBase implements Component {

	private _keys : Map<number, Keys>;

	constructor() {
		super(ComponentType.INPUT);
		this._keys = new Map();
	}

	keys(id? : number) : Keys {
		id = defined(id) ? id : game.id();

		if (!this._keys.has(id)) {
			this._keys.set(id, new Keys(id));
		}

		return this._keys.get(id);
	}

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		this.keys().preUpdate(millis);
	}

	override isSource() : boolean { return true; }
	override shouldBroadcast() : boolean { return true; }

	override dataMap(filter : DataFilter) : DataMap {
		let dataMap = {};
		this._keys.forEach((keys : Keys, id : number) => {
			const data = keys.dataMap(filter);
			if (Object.keys(data).length > 0) {
				dataMap[id] = data;
			}
		});
		return dataMap;
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this._keys.forEach((keys : Keys) => {
			keys.updateData(seqNum);
		})
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		const changed = this._data.import(data, seqNum);

		changed.forEach((id : number) => {
			this.keys(id).importData(<DataMap>data[id], seqNum);
		});
	}
}