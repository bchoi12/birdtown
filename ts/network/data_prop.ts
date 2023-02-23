
import { Data, DataFilter } from 'network/data'

import { defined } from 'util/common'
import { Optional } from 'util/optional'

export type DataPropOptions<T extends Object> = {
	minInterval? : number;
	refreshInterval? : number;
	filters? : Set<DataFilter>;
	equals? : (oldValue : T, newValue : T) => boolean;

	redundancies? : Map<DataFilter, number>;
}

type PublishInfo<T extends Object> = {
	value : T;
	seqNum : number;
	millis : number;
}

export class DataProp<T extends Object> {

	private _value : Optional<T>;
	private _lastPublished : Map<DataFilter, PublishInfo<T>>;

	private _seqNum : number;
	private _changed : boolean;

	private _minInterval : number;
	private _refreshInterval : Optional<number>;
	private _filters : Set<DataFilter>;
	private _equals : (oldValue : T, newValue : T) => boolean;
	private _redundancies : Map<DataFilter, number>;

	constructor(propOptions : DataPropOptions<T>) {
		this._value = new Optional();
		this._lastPublished = new Map();

		this._seqNum = 0;
		this._changed = false;

		this._minInterval = propOptions.minInterval > 0 ? propOptions.minInterval : 0;
		this._refreshInterval = propOptions.refreshInterval > 0 ? new Optional(propOptions.refreshInterval) : new Optional();
		this._filters = defined(propOptions.filters) ? propOptions.filters : Data.allFilters;
		this._equals = propOptions.equals ? propOptions.equals : (oldValue : T, newValue : T) => { return Data.equals(oldValue, newValue); };
		this._redundancies = defined(propOptions.redundancies) ? propOptions.redundancies : new Map([[DataFilter.UDP, 2]]);
	}

	has() : boolean { return this._value.has(); }
	changed(filter : DataFilter) : boolean {
		if (!this.has()) {
			return false;
		}
		if (!this._lastPublished.has(filter)) {
			return true;
		}

		return !this._equals(this._lastPublished.get(filter).value, this.get());
	}
	get() : T { return this._value.get(); }

	set(value : T, seqNum : number) : boolean {
		if (seqNum < this._seqNum) {
			return false;
		}

		if (this._value.has() && this._equals(value, this._value.get())) {
			return false;
		}

		this._value.set(value);
		this._seqNum = seqNum;
		return true;
	}

	shouldPublish(filter : DataFilter, seqNum : number) : boolean {
		if (!this.has()) {
			return false;
		}
		if (!this._filters.has(filter)) {
			return false;
		}
		if (filter === DataFilter.INIT || !this._lastPublished.has(filter)) {
			return true;
		}

		const elapsed = Date.now() - this._lastPublished.get(filter).millis;
		if (elapsed < this._minInterval) {
			return false;
		} else if (this._refreshInterval.has() && elapsed > this._refreshInterval.get()) {
			return true;
		}

		if (seqNum < this._lastPublished.get(filter).seqNum) {
			return false;
		}
		let redundancies = this._redundancies.has(filter) ? this._redundancies.get(filter) : 0;
		if (seqNum - this._lastPublished.get(filter).seqNum > redundancies && !this.changed(filter)) {
			return false;
		}
		return true;
	}

	publish(filter : DataFilter, seqNum : number) : [T, boolean] {
		if (!this.shouldPublish(filter, seqNum)) {
			return [null, false];
		}

		const value = this.get();
		if (!this._lastPublished.has(filter)) {
			this._lastPublished.set(filter, {
				value: value,
				seqNum: seqNum,
				millis: Date.now(),
			});	
		} else {
			let publishInfo = this._lastPublished.get(filter);
			publishInfo.value = value;
			publishInfo.seqNum = Math.max(publishInfo.seqNum, seqNum);
			publishInfo.millis = Date.now();
		}

		return [value, true];
	}
}