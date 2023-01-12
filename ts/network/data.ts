import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

export enum DataFilter {
	UNKNOWN = 0,
	ALL = 1,
	TCP = 2,
	UDP = 3,
}

// TODO: deprecate DataMap?
export type DataMap = { [k: number]: Object }
export type DataTree = Map<number, Object>;

enum NodeType {
	UNKNOWN,
	BRANCH,
	LEAF,
}

export class Data {
	private static readonly numberEpsilon = 1e-3;

	private _props : Set<number>;
	private _data : DataTree;
	// TODO: include _change and _seqNum in _data
	private _change : Map<number, BitMarker>;
	private _seqNum : Map<number, number>;

	constructor() {
		this._data = new Map();
		this._props = new Set();
		this._change = new Map();
		this._seqNum = new Map();
	}

	static numberEquals(a : number, b : number) : boolean {
		return Math.abs(a - b) < Data.numberEpsilon;
	}

	static equals(a : Object, b : Object) : boolean {
		if (a === b) return true;
		if (!defined(a) || !defined(b)) return false;
		if (a !== Object(a) && b !== Object(b)) {
			if (!Number.isNaN(a) && !Number.isNaN(b)) {
				return Data.numberEquals(<number>a, <number>b);
			}
			return a === b;
		};
		if (Object.keys(a).length !== Object.keys(b).length) return false;

		for (let key in a) {
			if (!(key in b)) return false;
			if (!Data.equals(a[key], b[key])) return false;
		}
		return true;
	}

	empty() : boolean { return this._data.size === 0; }
	tree() : DataTree { return this._data; }
	has(key : number) : boolean { return this._data.has(key); }
	get(key : number) : Object { return this._data.get(key); }

	registerProp(prop : number) : void { this._props.add(prop); }

	set(key : number, node : Object, seqNum : number, predicate? : () => boolean) : boolean {
		if (!defined(node)) {
			return false;
		}

		if (defined(predicate) && !predicate()) {
			this.recordChange(key, seqNum, false);
			return false;
		}

		let changed = false;
		if (!this.has(key) || seqNum >= this._seqNum.get(key)) {
			if (!this._props.has(key) || !Data.equals(node, this.get(key))) {
				this._data.set(key, node);
				changed = true;
			}
		}

		this.recordChange(key, seqNum, changed);
		return changed;
	}

	import(data : DataMap, seqNum : number, predicate? : (key : number) => boolean) : Set<number> {
		let changed = new Set<number>();

		for (const [stringKey, value] of Object.entries(data)) {
			const key = Number(stringKey);
			const updatePredicate = () => {
				return defined(predicate) ? predicate(key) : true;
			};
			if (this.set(key, value, seqNum, updatePredicate)) {
				changed.add(key);
			}
		}
		return changed;
	}

	// TODO: return [DataMap, boolean]
	filtered(filter : DataFilter) : DataMap {
		if (this.empty()) {
			return {};
		}

		let filtered : DataMap = {};
		this._data.forEach((data : Object, key : number) => {
			if (filter === DataFilter.ALL) {
				filtered[key] = data;
				return;
			}

			if (!this._change.has(key)) {
				return;
			}

			const change = this._change.get(key);
			if (filter === DataFilter.TCP) {
				if (change.consecutiveTrue() === 1 || change.consecutiveFalse() === 1) {
					filtered[key] = data;
				}
			} else if (filter === DataFilter.UDP) {
				if (change.consecutiveTrue() >= 1 || change.consecutiveFalse() <= 2) {
					filtered[key] = data;
				}
			}	
		});
		return filtered;
	}

	protected recordChange(key : number, seqNum : number, change : boolean) {
		if (!this._change.has(key)) {
			this._change.set(key, new BitMarker(32));
		}

		this._change.get(key).mark(seqNum, change);

		if (change) {
			this._seqNum.set(key, seqNum);
		}
	}
}