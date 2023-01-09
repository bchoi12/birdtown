
import { BitMarker } from 'util/bit_marker'
import { defined } from 'util/common'

export enum DataFilter {
	UNKNOWN = 0,
	ALL = 1,
	TCP = 2,
	UDP = 3,
}

export interface DataObject<T> {
	valid(value : T): boolean;
	has() : boolean;
	get() : T;
	equals(other : T) : boolean;
	set(value : T) : void;

	markChange(seqNum : number) : void;
	filtered(filter : DataFilter) : [Object, boolean];
}

export abstract class DataObjectBase<T> implements DataObject<T> {

	protected _hasValue : boolean;
	protected _changed : boolean;
	protected _changeMarker : BitMarker;

	protected _value : T;

	constructor() {
		this._hasValue = false;
		this._changed = false;
		this._changeMarker = new BitMarker(32);
	}

	protected initialize(t : T) { this._value = t; }
	protected onSet() : void {
		this._hasValue = true;
		this._changed = true;
	}

	valid(value : T) : boolean { return defined(value); }
	has() : boolean { return this._hasValue; }
	get() : T { return this._value; }
	equals(other : T) : boolean { return this.has() && this.get() === other; }
	set(value : T) : void {
		if (!this.valid(value)) {
			return;
		}

		if (!this.has() || !this.equals(value)) {
			this._value = value;
			this.onSet();
		}
	}

	markChange(seqNum : number) : void {
		this._changeMarker.mark(seqNum, this._changed);
		this._changed = false;
	}

	filtered(filter : DataFilter) : [Object, boolean] {
		if (!this.has()) {
			return [{}, false];
		}

		let match = false;

		switch(filter) {
		case DataFilter.ALL:
			match = true;
			break;
		case DataFilter.TCP:
			if (this._changeMarker.consecutiveTrue() === 1 || this._changeMarker.consecutiveFalse() === 1) {
				match = true;
			}
			break;
		case DataFilter.UDP:
			if (this._changeMarker.consecutiveTrue() >= 1 || this._changeMarker.consecutiveFalse() <= 2) {
				match = true;
			}
			break;
		}

		if (match) {
			return [this.get(), true];
		}
		return [{}, false];
	}
}