
import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

import { ui } from 'ui'
import { Key } from 'ui/input'

import { defined } from 'util/common'

enum Prop {
	UNKNOWN = 0,
	KEYS = 1,
	CLIENT_ID = 2,
}

export class Keys extends ComponentBase implements Component {

	private _keys : Set<Key>;
	private _lastKeys : Set<Key>;

	private _clientId : number;

	constructor() {
		super(ComponentType.KEYS);
	}

	override ready() { return true; }
	override initialize() : void {
		super.initialize();

		this._keys = new Set<Key>();
		this._lastKeys = new Set<Key>();
	}

	setClientId(id : number) : void { this._clientId = id }

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

	override authoritative() : boolean {
		return game.options().host || this.updateKeysLocally();
	}

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this.setProp(Prop.KEYS, Data.toObject(this._keys), seqNum);
		this.setProp(Prop.CLIENT_ID, this._clientId, seqNum);
	}

	override mergeData(data : DataMap, seqNum : number) : void {
		super.mergeData(data, seqNum);

		const changed = this._data.merge(data, seqNum, (prop : number) => {
			return prop !== Prop.KEYS || !this.updateKeysLocally();
		});

		if (changed.size === 0) {
			return;
		}

		if (changed.has(Prop.KEYS)) {
			this.updateKeys(new Set(<Array<Key>>this._data.get(Prop.KEYS)));
		}

		if (changed.has(Prop.CLIENT_ID)) {
			this._clientId = <number>this._data.get(Prop.CLIENT_ID);
		}
	}

	private updateKeysLocally() : boolean {
		return defined(this._clientId) && this._clientId === game.id();
	}

	private updateKeys(keys : Set<number>) {
		this._lastKeys = new Set(this._keys);
		this._keys = keys;
	}
}