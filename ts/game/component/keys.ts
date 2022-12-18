
import * as BABYLON from 'babylonjs'

import { game } from 'game'
import { Component, ComponentBase, ComponentType } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

import { ui, Key } from 'ui'

import { defined } from 'util/common'
import { Vec2 } from 'util/vec2'

enum Prop {
	UNKNOWN,
	CURRENT,
	PRESSED,
	RELEASED,
	MOUSE,
}

export class Keys extends ComponentBase implements Component {

	private _current : Set<Key>;
	private _pressed : Set<Key>;
	private _released : Set<Key>;
	private _mouse : Vec2;

	constructor() {
		super(ComponentType.KEYS);

		this._current = new Set<Key>();
		this._pressed = new Set<Key>();
		this._released = new Set<Key>();
		this._mouse = {x: 0, y: 0};
	}

	override ready() : boolean { return this.entity().metadata().hasClientId(); }

	keyDown(key : Key) : boolean { return this._current.has(key); }
	keyPressed(key : Key) : boolean { return this._pressed.has(key); }
	keyReleased(key : Key) : boolean { return this._released.has(key); }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		// Only update from UI if IDs match
		if (this.updateKeysLocally()) {
			this.updateKeys();
		}
	}

	override shouldBroadcast() : boolean { return game.options().host || this.updateKeysLocally(); }
	override isSource() : boolean { return this.updateKeysLocally(); }

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this.setProp(Prop.CURRENT, Data.toObject(this._current), seqNum);
		this.setProp(Prop.PRESSED, Data.toObject(this._pressed), seqNum);
		this.setProp(Prop.RELEASED, Data.toObject(this._released), seqNum);
		this.setProp(Prop.MOUSE, this._mouse, seqNum);
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

		if (changed.has(Prop.CURRENT)) {
			this._current = new Set(<Set<Key>>this._data.get(Prop.CURRENT));
		}
		if (changed.has(Prop.PRESSED)) {
			this._pressed = new Set(<Set<Key>>this._data.get(Prop.PRESSED));
		}
		if (changed.has(Prop.RELEASED)) {
			this._released = new Set(<Set<Key>>this._data.get(Prop.RELEASED));
		}
		if (changed.has(Prop.MOUSE)) {
			this._mouse = <Vec2>this._data.get(Prop.MOUSE);
		}
	}

	private updateKeysLocally() : boolean {
		return this.entity().clientIdMatches();
	}

	private updateKeys() : void {
		this._pressed.clear();
		this._released.clear();

		const keys = ui.keys();

		for (let key of keys) {
			if (!this._current.has(key)) {
				this._pressed.add(key);
			}
		}

		for (let key of this._current) {
			if (!keys.has(key)) {
				this._released.add(key);
			}
		}

		this._current = new Set(keys);
		const mouseWorld = game.mouse();
		this._mouse = { x: mouseWorld.x, y: mouseWorld.y };
	}
}