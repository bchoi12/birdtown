
import { Data, DataFilter } from 'network/data'

import { defined, assignOr } from 'util/common'
import { Optional } from 'util/optional'

export type DataPropOptions<T extends Object> = {
	optional? : boolean;
	minInterval? : number;
	refreshInterval? : number;
	udpRedundancies? : number;
	equals? : (oldValue : T, newValue : T) => boolean;

	filters? : Set<DataFilter>;
}

type EqualsFn<T extends Object> = (a : T, b : T) => boolean;

type PublishInfo<T extends Object> = {
	seqNum : number;
	millis : number;
}

export class DataProp<T extends Object> {

	private _value : Optional<T>;
	private _lastPublished : Map<DataFilter, PublishInfo<T>>;

	private _seqNum : number;
	private _lastChanged : number;

	private _optional : boolean;
	private _minInterval : number;
	private _refreshInterval : Optional<number>;
	private _udpRedundancies : number;
	private _equals : EqualsFn<T>;

	private _filters : Set<DataFilter>;

	constructor(propOptions : DataPropOptions<T>) {
		this._value = new Optional();
		this._lastPublished = new Map();

		this._seqNum = 0;
		this._lastChanged = 0;

		this._optional = assignOr(propOptions.optional, false);
		this._minInterval = assignOr(propOptions.minInterval, 0);
		this._refreshInterval = new Optional(assignOr(propOptions.refreshInterval, null));
		this._udpRedundancies = assignOr(propOptions.udpRedundancies, 2); 
		this._equals = assignOr(propOptions.equals, (a : T, b : T) => { return Data.equals(a, b); });
		this._filters = assignOr(propOptions.filters, Data.allFilters);
	}

	has() : boolean { return this._value.has(); }
	changed(filter : DataFilter, seqNum : number) : boolean {
		if (!this.has()) {
			return false;
		}
		if (!this._lastPublished.has(filter)) {
			return true;
		}
		if (this._lastPublished.get(filter).seqNum >= this._lastChanged) {
			return false;
		}

		return seqNum >= this._lastChanged;
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
		this._lastChanged = Math.max(this._lastChanged, this._seqNum);
		return true;
	}

	optional() : boolean { return this._optional; }

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

		if (filter === DataFilter.UDP && seqNum - this._lastChanged <= this._udpRedundancies) {
			return true;
		}

		const elapsed = Date.now() - this._lastPublished.get(filter).millis;
		if (elapsed < this._minInterval) {
			return false;
		} else if (this._refreshInterval.has() && elapsed > this._refreshInterval.get()) {
			return true;
		}

		return this.changed(filter, seqNum);
	}

	publish(filter : DataFilter, seqNum : number) : [T, boolean] {
		if (!this.shouldPublish(filter, seqNum)) {
			return [null, false];
		}

		const value = this.get();
		if (!this._lastPublished.has(filter)) {
			this._lastPublished.set(filter, {
				seqNum: seqNum,
				millis: Date.now(),
			});	
		} else {
			let publishInfo = this._lastPublished.get(filter);
			publishInfo.seqNum = Math.max(publishInfo.seqNum, seqNum);
			publishInfo.millis = Date.now();
		}

		return [value, true];
	}
}