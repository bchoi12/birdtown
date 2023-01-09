import { game } from 'game'
import { SubComponent, SubComponentBase } from 'game/component'
import { Data, DataFilter, DataMap } from 'game/data'

import { ui, Key } from 'ui'
import { Vec2 } from 'util/vector'

enum KeyState {
	UNKNOWN,
	PRESSED,
	DOWN,
	RELEASED,
	UP,
}

enum Prop {
	UNKNOWN,
	KEY_MAP,
}

export class Keys extends SubComponentBase implements SubComponent {
	private _clientId : number;
	private _keys : Map<Key, KeyState>;
	private _mouse : Vec2;

	// TODO: set entity to follow and compute direction

	constructor(clientId : number) {
		super();

		this._clientId = clientId;
		this._keys = new Map();
		this._mouse = Vec2.zero();
	}

	keyDown(key : Key) : boolean { return this._keys.has(key) && (this._keys.get(key) === KeyState.DOWN || this.keyPressed(key)); }
	keyUp(key : Key) : boolean { return !this._keys.has(key) || (this._keys.get(key) === KeyState.UP || this.keyReleased(key)); }
	keyPressed(key : Key) : boolean { return this._keys.has(key) && this._keys.get(key) === KeyState.PRESSED; }
	keyReleased(key : Key) : boolean { return this._keys.has(key) && this._keys.get(key) === KeyState.RELEASED; }
	mouse() : Vec2 { return this._mouse; }
	mouseWorld() : BABYLON.Vector3 { return new BABYLON.Vector3(this._mouse.x, this._mouse.y, 0); }

	override preUpdate(millis : number) : void {
		super.preUpdate(millis);

		if (!this.isSource()) {
			return;
		}

		const keys = ui.keys();
		keys.forEach((key : Key) => {
			this.pressKey(key);
		});

		this._keys.forEach((keyState : KeyState, key : Key) => {
			if (!keys.has(key)) {
				this.releaseKey(key);
			}
		});

		const mouseWorld = game.mouse();
		this._mouse.copyVec({ x: mouseWorld.x, y: mouseWorld.y });
	}

	override isSource() : boolean { return game.id() === this._clientId; }
	override shouldBroadcast() : boolean { return game.options().host || this.isSource(); }

	override updateData(seqNum : number) : void {
		super.updateData(seqNum);

		this._keys.forEach((keyState : KeyState, key : Key) => {
			this.setProp(key, keyState, seqNum);
		});
	}

	override importData(data : DataMap, seqNum : number) : void {
		super.importData(data, seqNum);

		if (this.isSource()) {
			return;
		}

		const changed = this._data.import(data, seqNum);
		changed.forEach((key : number) => {
			if (<KeyState>this._data.get(key) === KeyState.RELEASED || <KeyState>this._data.get(key) === KeyState.UP) {
				this.releaseKey(<Key>key);
			} else {
				this.pressKey(<Key>key);
			}
		});
	}

	protected pressKey(key : Key) : void {
		if (!this.keyDown(key)) {
			this._keys.set(key, KeyState.PRESSED);
		} else {
			this._keys.set(key, KeyState.DOWN);
		}
	}

	protected releaseKey(key : Key) : void {
		if (this.keyDown(key)) {
			this._keys.set(key, KeyState.RELEASED);
		} else {
			this._keys.set(key, KeyState.UP);
		}
	}
}