
import { Component, ComponentBase, ComponentType } from 'game/component'

import { ui } from 'ui'
import { Key } from 'ui/input'

export class Keys extends ComponentBase implements Component {

	private _keys : Set<Key>;
	private _lastKeys : Set<Key>;

	constructor() {
		super(ComponentType.KEYS);

		this._keys = new Set<Key>();
		this._lastKeys = new Set<Key>();
	}

	preUpdate(ts : number) : void {
		this._lastKeys = new Set<Key>(this._keys);
		this._keys = ui.keys();
	}

	keyDown(key : Key) : boolean {
		return this._keys.has(key);
	}
}