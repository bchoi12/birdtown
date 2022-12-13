
import { options } from 'options'

import { HandlerType, Key, Mode } from 'ui'
import { Handler, HandlerBase } from 'ui/handler'

export class Input extends HandlerBase implements Handler{

	private _keys : Set<Key>;
	private _keyMap : Map<number, Key>;

	private _keyDownCallbacks : Map<number, (e : any) => void>;
	private _keyUpCallbacks : Map<number, (e : any) => void>;

	constructor() {
		super(HandlerType.INPUT);

		this._keys = new Set<number>();
		this._keyMap = new Map();

		this._keyDownCallbacks = new Map();
		this._keyUpCallbacks = new Map();
	}

	setup() : void {
		document.addEventListener("keydown", (e : any) => {
			if (e.repeat) return;

			if (this._keyDownCallbacks.has(e.keyCode)) {
				this._keyDownCallbacks.get(e.keyCode)(e);
			}
		});
		document.addEventListener("keyup", (e : any) => {
			if (this._keyUpCallbacks.has(e.keyCode)) {
				this._keyUpCallbacks.get(e.keyCode)(e);
			}
		});
		window.onblur = () => {
			this._keys.clear();
		};
		this.reset();
	}

	reset() : void {
		this._keyMap.clear();
		this._keyDownCallbacks.clear();
		this._keyUpCallbacks.clear();

		this.mapKey(options.leftKeyCode, Key.LEFT);
		this.mapKey(options.rightKeyCode, Key.RIGHT);
		this.mapKey(options.jumpKeyCode, Key.JUMP);
		this.mapKey(options.interactKeyCode, Key.INTERACT);
	}

	setMode(mode : Mode) : void {}

	keys() : Set<number> { return this._keys; }

	private mapKey(keyCode : number, key : Key) {
		this._keyMap.set(keyCode, key);

		this._keyDownCallbacks.set(keyCode, (e : any) => { this.recordKeyDown(e); });
		this._keyUpCallbacks.set(keyCode, (e : any) => { this.recordKeyUp(e); });
	}

	private recordKeyDown(e : any) : void {
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		if (!this._keys.has(key)) {
			this._keys.add(key);
		}
	}

	private recordKeyUp(e : any) : void {
		if (!this._keyMap.has(e.keyCode)) return;

		const key = this._keyMap.get(e.keyCode);
		if (this._keys.has(key)) {
			this._keys.delete(key);
		}
	}
}