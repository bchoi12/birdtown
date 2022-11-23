

export class DoubleMap<K, V> {
	private _map : Map<K, V>;
	private _reverse : Map<V, K>;

	constructor() {
		this._map = new Map();
		this._reverse = new Map();
	}

	set(key : K, value : V) {
		this._map.set(key, value);
		this._reverse.set(value, key);
	}

	has(key : K) : boolean { return this._map.has(key); }
	hasReverse(key : V) : boolean { return this._reverse.has(key); }

	get(key : K) : V { return this._map.get(key); }
	getReverse(key : V) : K { return this._reverse.get(key); }
}