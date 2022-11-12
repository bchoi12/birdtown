
import { Component } from 'game/component'

import { ui } from 'ui'
import { Key } from 'ui/input'

export class Keys implements Component {

	private _keys : Set<Key>;
	private _lastKeys : Set<Key>;

	constructor() {
		this._keys = new Set<Key>();
		this._lastKeys = new Set<Key>();
	}

	update(ts : number) : void {
		this._lastKeys = new Set<Key>(this._keys);
		this._keys = ui.keys();
	}
}