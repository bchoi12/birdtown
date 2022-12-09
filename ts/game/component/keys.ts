
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

import { ui } from 'ui'
import { Key } from 'ui/input'

import { defined } from 'util/common'

enum Prop {
	UNKNOWN,
	KEYS,
}

export class Keys extends ComponentBase implements Component {

	private _keys : Set<Key>;
	private _lastKeys : Set<Key>;

	constructor() {
		super(ComponentType.KEYS);
	}

	override ready() : boolean { return this.entity().hasClientId(); }
	override initialize() : void {
		super.initialize();

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
		super.preUpdate(millis);

		// Only update from UI if IDs match
		if (this.updateKeysLocally()) {
			this.updateKeys(new Set<Key>(ui.keys()));
		}
	}

	override shouldBroadcast() : boolean { return game.options().host || this.updateKeysLocally(); }
	override isSource() : boolean { return this.updateKeysLocally(); }

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this.setProp(Prop.KEYS, Data.toObject(this._keys), seqNum);
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		if (this.updateKeysLocally()) {
			return;
		}

		const changed = this._data.merge(data, seqNum);
		if (changed.size === 0) {
			return;
		}
		if (changed.has(Prop.KEYS)) {
			this.updateKeys(new Set(<Array<Key>>this._data.get(Prop.KEYS)));
		}
	}

	private updateKeysLocally() : boolean {
		return this.entity().clientId() === game.id();
	}

	private updateKeys(keys : Set<number>) {
		this._lastKeys = new Set(this._keys);
		this._keys = keys;
	}
}