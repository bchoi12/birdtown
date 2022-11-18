
export enum Key {
	UNKNOWN = 0,
	LEFT = 1,
	RIGHT = 2,
	JUMP = 3,
}

export class Input {

	private _keys : Set<Key>;
	private _keyMap : Map<number, Key>;

	private _keyDownCallbacks : Map<number, (e : any) => void>;
	private _keyUpCallbacks : Map<number, (e : any) => void>;

	constructor() {
		this._keys = new Set<number>();
		this._keyMap = new Map();

		this._keyDownCallbacks = new Map();
		this._keyUpCallbacks = new Map();

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
		this.reset();
	}

	reset() : void {
		this._keyMap.clear();
		this._keyDownCallbacks.clear();
		this._keyUpCallbacks.clear();

		this.mapKey(65, Key.LEFT);
		this.mapKey(68, Key.RIGHT);
		this.mapKey(87, Key.JUMP);
	}

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