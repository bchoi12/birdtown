

export class DoubleMap<K, V> {
	private _map : Map<K, V>;
	private _reverse : Map<V, K>;

	constructor() {
		this._map = new Map();
		this._reverse = new Map();
	}

	static fromEntries<K, V>(entries : [K, V][]) : DoubleMap<K, V> {
		let dm = new DoubleMap<K, V>();

		for (let i = 0; i < entries.length; ++i) {
			dm.set(entries[i][0], entries[i][1]);
		}
		return dm;
	}

	set(key : K, value : V) {
		if (this._map.has(key)) {
			this._reverse.delete(this._map.get(key));
			this._map.delete(key);
		}
		if (this._reverse.has(value)) {
			this._map.delete(this._reverse.get(value));
			this._reverse.delete(value);
		}

		this._map.set(key, value);
		this._reverse.set(value, key);
	}

	delete(key : K) {
		this._reverse.delete(this._map.get(key));
		this._map.delete(key);
	}
	deleteReverse(value : V) {
		this._map.delete(this._reverse.get(value));
		this._reverse.delete(value);
	}

	has(key : K) : boolean { return this._map.has(key); }
	hasReverse(key : V) : boolean { return this._reverse.has(key); }

	get(key : K) : V { return this._map.get(key); }
	getReverse(key : V) : K { return this._reverse.get(key); }

	keys() : Set<K> { return new Set(this._map.keys()); }
	values() : Set<V> { return new Set(this._map.values()); }
}