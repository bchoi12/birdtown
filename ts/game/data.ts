
import { ComponentType } from 'game/component'

import { defined } from 'util/common'
import { BitMarker } from 'util/bit_marker'

export enum DataFilter {
	UNKNOWN = 0,
	ALL = 1,
	TCP = 2,
	UDP = 3,
}

export class Data {

	private _data : Map<number, Object>;
	private _change : Map<number, BitMarker>;
	private _seqNum : Map<number, number>;

	constructor() {
		this._data = new Map<number, Object>();
		this._change = new Map<number, BitMarker>();
		this._seqNum = new Map<number, number>();
	}

	clear() : void { this._data.clear(); }
	empty() : boolean { return this._data.size === 0; }
	entries() : Map<number, Object> { return this._data; }

	has(key : number) : boolean {
		return this._data.has(key);
	}

	extrapolate(key : number, data : Object) : void {
		this._data.set(key, data);
	}

	set(key : number, data : Object, seqNum : number, predicate? : () => boolean) : boolean {
		if (defined(predicate) && !predicate()) {
			this.recordChange(key, seqNum, false);
			return false;
		}

		if (!defined(this._seqNum.get(key)) || seqNum >= this._seqNum.get(key)) {
			if (data !== this._data.get(key)) {
				this._data.set(key, data);
				this._seqNum.set(key, seqNum);
				this.recordChange(key, seqNum, true);
				return true;
			}
		}

		this.recordChange(key, seqNum, false);
		return false;
	}

	get(key : number) : Object {
		return this._data.get(key);
	}

	filtered(filter : DataFilter, seqNum : number) : Data {
		if (filter === DataFilter.ALL) {
			return this;
		}

		let filtered = new Data();
		switch (filter) {
		case DataFilter.TCP:
			this._data.forEach((data, key) => {
				
			});
			return filtered;
		case DataFilter.UDP:
			this._data.forEach((data, key) => {

			});
			return filtered;
		default:
			return filtered;
		}
	}

	merge(data : Data, seqNum : number) : boolean {
		let changed = false;

		for (const [key, value] of data.entries()) {
			if (seqNum >= this._seqNum.get(key)) {
				changed ||= this.set(key, value, seqNum);
			}
		}

		return changed;
	}

	private recordChange(key : number, seqNum : number, change : boolean) {
		if (!this._change.has(key)) {
			this._change.set(key, new BitMarker(60));
		}

		this._change.get(key).mark(seqNum, change);
	}
}