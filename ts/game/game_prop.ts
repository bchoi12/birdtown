
import { game } from 'game'
import { GameData, DataFilter } from 'game/game_data'

import { assignOr } from 'util/common'
import { Optional } from 'util/optional'

export type GamePropOptions<T extends Object> = {
	optional? : boolean;
	conditionalInterval? : IntervalFn<T>;
	minInterval? : number;
	refreshInterval? : number;
	udpRedundancies? : number;
	equals? : (oldValue : T, newValue : T) => boolean;

	filters? : Set<DataFilter>;
}

type IntervalFn<T extends Object> = (t : T, elapsed : number) => boolean;
type EqualsFn<T extends Object> = (a : T, b : T) => boolean;
type PublishInfo<T extends Object> = {
	seqNum : number;
	millis : number;
}

export class GameProp<T extends Object> {

	private static readonly numberEpsilon = 1e-2;

	private _value : Optional<T>;
	private _lastPublished : Map<DataFilter, PublishInfo<T>>;

	private _seqNum : number;
	private _consecutiveChanges : number;
	private _lastChanged : number;

	private _optional : boolean;
	private _minInterval : number;
	private _conditionalInterval : Optional<IntervalFn<T>>;
	private _refreshInterval : Optional<number>;
	private _udpRedundancies : number;
	private _manualUpdate : boolean;
	private _equals : EqualsFn<T>;

	private _filters : Set<DataFilter>;

	constructor(propOptions : GamePropOptions<T>) {
		this._value = new Optional();
		this._lastPublished = new Map();

		this._seqNum = 0;
		this._consecutiveChanges = 0;
		this._lastChanged = 0;

		this._optional = assignOr(propOptions.optional, false);
		this._minInterval = assignOr(propOptions.minInterval, 0);
		this._refreshInterval = new Optional(assignOr(propOptions.refreshInterval, null));
		this._conditionalInterval = new Optional(assignOr(propOptions.conditionalInterval, null));
		this._udpRedundancies = assignOr(propOptions.udpRedundancies, 1);
		this._equals = assignOr(propOptions.equals, (a : T, b : T) => { return GameProp.equals(a, b); });
		this._filters = assignOr(propOptions.filters, GameData.allFilters);
	}

	private static numberEquals(a : number, b : number) : boolean {
		return Math.abs(a - b) < GameProp.numberEpsilon;
	}

	private static equals(a : Object, b : Object) : boolean {
		if (a === b) return true;
		if (a === null || b === null) return false;
		if (a !== Object(a) && b !== Object(b)) {
			if (!Number.isNaN(a) && !Number.isNaN(b)) {
				return GameProp.numberEquals(<number>a, <number>b);
			}
			return a === b;
		}
		if (Object.keys(a).length !== Object.keys(b).length) return false;

		for (let key in a) {
			if (!(key in b)) return false;
			if (!GameProp.equals(a[key], b[key])) return false;
		}
		return true;
	}

	seqNum() : number { return this._seqNum; }
	consecutiveChanges() : number { return this._consecutiveChanges; }
	lastChanged() : number { return this._lastChanged; }

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

		if (filter === DataFilter.TCP) {
			// Only send TCP packet when change stabilizes
			return seqNum >= this._lastChanged && Math.abs(this._consecutiveChanges) === 1;
		}
		return seqNum >= this._lastChanged;
	}
	get() : T { return this._value.get(); }

	equals(value : T) : boolean {
		if (!this._value.has()) {
			return false;
		}
		return this._equals(value, this._value.get());
	}

	set(value : T, seqNum : number) : boolean {
		if (seqNum < this._seqNum) {
			return false;
		}
		if (value === null) {
			return false;
		}

		const seqNumEqual = this._seqNum === seqNum;

		// Reset if there is a gap in setting value
		if (seqNum - this._seqNum > game.runner().seqNumStep()) {
			this._consecutiveChanges = 0;
		}

		if (this.equals(value)) {
			if (!seqNumEqual) {
				this._consecutiveChanges = Math.min(-1, this._consecutiveChanges - 1);
			}
			return false;
		}

		this._value.set(value);
		this._seqNum = seqNum;
		// If seqnums are equal, either set to 1 or don't increment.
		this._consecutiveChanges = Math.max(1, this._consecutiveChanges + (seqNumEqual ? 0 : 1));
		this._lastChanged = this._seqNum;
		return true;
	}

	rollback(value : T, seqNum : number) : boolean {
		if (value === null) {
			return false;
		}

		this._value.set(value);
		this._seqNum = seqNum;

		// TODO: do I need to set any other properties?

		return true;
	}

	isOptional() : boolean { return this._optional; }

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
		} else if (this._conditionalInterval.has() && this._conditionalInterval.get()(this.get(), elapsed)) {
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