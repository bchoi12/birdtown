import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

export enum DataFilter {
	UNKNOWN = 0,
	ALL = 1,
	TCP = 2,
	UDP = 3,
}

export type DataMap = { [k: number]: Object } 
export type DataNode = Object|Data;
export type DataTree = Map<number, DataNode>;

export class Data {
	public static readonly numberEpsilon = 1e-3;

	private _data : DataTree;
	private _flattened : DataMap;
	private _change : Map<number, BitMarker>;
	private _seqNum : Map<number, number>;

	constructor() {
		this._data = new Map();
		this._flattened = {};
		this._change = new Map();
		this._seqNum = new Map();
	}

	static toObject(data : any) : Object {
		if (data instanceof Map) {
			return Object.fromEntries(data);
		} else if (data instanceof Set) {
			return [...data];
		} else if (data instanceof Data) {
			return data.flattened();
		}
		return data;
	}

	static equals(a : Object, b : Object) : boolean {
		if (a === b) return true;
		if (!defined(a) || !defined(b)) return false;
		if (a !== Object(a) && b !== Object(b)) {
			if (!Number.isNaN(a) && !Number.isNaN(b)) {
				return Math.abs(<number>a - <number>b) < Data.numberEpsilon;
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

	empty() : boolean { return Object.keys(this._data).length === 0; }
	tree() : DataTree { return this._data; }
	flattened() : DataMap {
		this._data.forEach((node : DataNode, key : number) => {
			if (node instanceof Data) {
				this._flattened[key] = node.flattened();
			}
		})
		return this._flattened;
	}
	has(key : number) : boolean { return this._data.has(key); }
	get(key : number) : DataNode { return this._data.get(key); }

	set(key : number, node : DataNode) : boolean {
		if (!defined(node)) {
			return false;
		}
		this._data.set(key, node);
		if (!(node instanceof Data)) {
			this._flattened[key] = node;
		}

		return true;
	}

	update(key : number, node : DataNode, seqNum : number, predicate? : () => boolean) : boolean {
		if (!defined(node)) { return false; }

		if (defined(predicate) && !predicate()) {
			this.recordChange(key, seqNum, false);
			return false;
		}

		if (!defined(this._data[key]) || !defined(this._seqNum.get(key)) || seqNum >= this._seqNum.get(key)) {
			if (node instanceof Data || !Data.equals(node, this.get(key))) {
				if (this.set(key, node)) {
					this._seqNum.set(key, seqNum);
					this.recordChange(key, seqNum, true);
					return true;
				}
			}
		}

		this.recordChange(key, seqNum, false);
		return false;
	}

	filtered(filter : DataFilter) : DataMap {
		if (filter === DataFilter.ALL) {
			return this.flattened();
		}

		let filtered : DataMap = {};
		switch (filter) {
		case DataFilter.TCP:
		case DataFilter.UDP:
			this._data.forEach((data : DataNode, key : number) => {
				if (!this._change.has(key)) {
					return;
				}

				if (data instanceof Data) {
					data = data.filtered(filter);
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
		}
		return filtered;
	}

	copy(data : Data) : void {
		data.tree().forEach((node : DataNode, key : number) => {
			this.set(key, node);
		});
	}

	merge(data : DataMap, seqNum : number, predicate? : (key : number) => boolean) : Set<number> {
		let changed = new Set<number>();

		for (const [stringKey, value] of Object.entries(data)) {
			const key = Number(stringKey);
			const updatePredicate = () => {
				return defined(predicate) ? predicate(key) : true;
			};
			if (this.update(key, value, seqNum, updatePredicate)) {
				changed.add(key);
			}
		}
		return changed;
	}

	private recordChange(key : number, seqNum : number, change : boolean) {
		if (!this._change.has(key)) {
			this._change.set(key, new BitMarker(32));
		}

		this._change.get(key).mark(seqNum, change);
	}
}