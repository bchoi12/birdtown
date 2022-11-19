
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

	private _data : DataMap;
	private _change : Map<number, BitMarker>;
	private _seqNum : Map<number, number>;

	constructor() {
		this._data = {};
		this._change = new Map<number, BitMarker>();
		this._seqNum = new Map<number, number>();
	}

	static toObject(data : any) : Object {
		if (data instanceof Map) {
			return Object.fromEntries(data);
		} else if (data instanceof Set) {
			return Array.from(data);
		}
		return data;
	}

	empty() : boolean { return Object.keys(this._data).length === 0; }
	has(key : number) : Object { return defined(this._data[key]); }
	get(key : number) : Object { return this._data[key]; }

	set(key : number, value : Object, seqNum : number, predicate? : () => boolean) : boolean {
		if (defined(predicate) && !predicate()) {
			this.recordChange(key, seqNum, false);
			return false;
		}

		const data = Data.toObject(value);
		if (!defined(this._seqNum.get(key)) || seqNum >= this._seqNum.get(key)) {
			if (data !== this._data[key]) {
				this._data[key] = data;
				this._seqNum.set(key, seqNum);
				this.recordChange(key, seqNum, true);
				return true;
			}
		}

		this.recordChange(key, seqNum, false);
		return false;
	}

	filtered(filter : DataFilter, seqNum : number) : DataMap {
		if (filter === DataFilter.ALL) {
			return this._data;
		}

		let filtered = {};
		switch (filter) {
		case DataFilter.TCP:
			for (const [stringKey, data] of Object.entries(this._data)) {
				const key = Number(stringKey);
				const change = this._change.get(key);
				if (change.consecutiveTrue() === 1) {
					filtered[key] = Data.toObject(data);
				}				
			}
			return filtered;
		case DataFilter.UDP:
			for (const [stringKey, data] of Object.entries(this._data)) {
				const key = Number(stringKey);
				const change = this._change.get(key);
				if (change.consecutiveFalse() <= 3) {
					filtered[key] = Data.toObject(data);
				}
			}
			return filtered;
		default:
			return filtered;
		}
	}

	merge(data : DataMap, seqNum : number) : Set<number> {
		let changed = new Set<number>();

		for (const [stringKey, value] of Object.entries(data)) {
			const key = Number(stringKey);
			if (this.set(key, value, seqNum)) {
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