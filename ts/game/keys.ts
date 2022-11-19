
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

import { ui } from 'ui'
import { Key } from 'ui/input'

enum Prop {
	UNKNOWN = 0,
	KEYS = 1,
}

export class Keys extends ComponentBase implements Component {

	private _keys : Set<Key>;
	private _lastKeys : Set<Key>;

	constructor() {
		super(ComponentType.KEYS);
		this.setClientSide(true);

		this._keys = new Set<Key>();
		this._lastKeys = new Set<Key>();
	}

	keyDown(key : Key) : boolean { return this._keys.has(key); }
	keyPressed(key : Key) : boolean { return this._keys.has(key) && !this._lastKeys.has(key); }
	keyReleased(key : Key) : boolean { return this._lastKeys.has(key) && !this._keys.has(key); }

	changed() : boolean {
		if (this._lastKeys.size !== this._keys.size) {
			return true;
		}

		for(let key of this._keys) {
			if (!this._lastKeys.has(key)) {
				return true;
			}
		}

		return false;
	}

	override preUpdate(millis : number) : void {
		if (!game.options().host) {
			return;
		}

		this.updateKeys(new Set<Key>(ui.keys()));
	}

	override updateData(seqNum : number) : void {
		this._data.set(Prop.KEYS, this._keys, seqNum, () => { return game.options().host && this.changed(); });
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		const changed = this._data.merge(data, seqNum);

		if (changed.size === 0) {
			return;
		}

		if (changed.has(Prop.KEYS)) {
			this.updateKeys(new Set(<Array<Key>>this._data.get(Prop.KEYS)));
		}
	}

	private updateKeys(keys : Set<number>) {
		this._lastKeys = new Set(this._keys);
		this._keys = keys;
	}
}