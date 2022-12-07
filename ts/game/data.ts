import * as MATTER from 'matter-js'

import { ComponentType } from 'game/component'

import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

export enum DataFilter {
	UNKNOWN = 0,
	ALL = 1,
	TCP = 2,
	UDP = 3,
}

export type DataMap = { [k: number]: Object } 

export class Data {
	public static readonly numberEpsilon = 1e-3;

	private _data : DataMap;
	private _change : Map<number, BitMarker>;
	private _seqNum : Map<number, number>;

	constructor() {
		this._data = {};
		this._change = new Map();
		this._seqNum = new Map();
	}

	static toObject(data : any) : Object {
		if (data instanceof Map) {
			return Object.fromEntries(data);
		} else if (data instanceof Set) {
			return [...data];
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
	has(key : number) : boolean { return defined(this._data[key]); }
	get(key : number) : Object { return this._data[key]; }

	set(key : number, data : Object) : boolean {
		if (!defined(data)) {
			return false;
		}
		this._data[key] = data;
		return true;
	}

	update(key : number, data : Object, seqNum : number, predicate? : () => boolean) : boolean {
		if (!defined(data)) { return false; }

		if (defined(predicate) && !predicate()) {
			this.recordChange(key, seqNum, false);
			return false;
		}

		if (!defined(this._data[key]) || !defined(this._seqNum.get(key)) || seqNum >= this._seqNum.get(key)) {
			if (!Data.equals(data, this.get(key))) {
				if (this.set(key, data)) {
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
			return this._data;
		}

		let filtered = {};
		switch (filter) {
		case DataFilter.TCP:
			for (const [stringKey, data] of Object.entries(this._data)) {
				const key = Number(stringKey);
				if (!this._change.has(key)) {
					continue;
				}

				const change = this._change.get(key);
				if (change.consecutiveTrue() === 1 || change.consecutiveFalse() === 1) {
					filtered[key] = data;
				}				
			}
			return filtered;
		case DataFilter.UDP:
			for (const [stringKey, data] of Object.entries(this._data)) {
				const key = Number(stringKey);
				if (!this._change.has(key)) {
					continue;
				}

				const change = this._change.get(key);
				if (change.consecutiveTrue() >= 1 || change.consecutiveFalse() <= 2) {
					filtered[key] = data;
				}
			}
			return filtered;
		default:
			return filtered;
		}
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