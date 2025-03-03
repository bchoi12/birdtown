
import { game } from 'game'
import { GameData, DataFilter } from 'game/game_data'

import { assignOr } from 'util/common'
import { Optional } from 'util/optional'

export type GamePropOptions<T extends Object> = {
	conditionalInterval? : IntervalFn<T>;
	minInterval? : number;
	refreshInterval? : number;
	equals? : (oldValue : T, newValue : T) => boolean;
	clearAfterPublish? : boolean;
	onPublishFn? : () => void;

	filters? : Set<DataFilter>;
}

type IntervalFn<T extends Object> = (t : T, elapsed : number) => boolean;
type EqualsFn<T extends Object> = (a : T, b : T) => boolean;
type PublishInfo<T extends Object> = {
	seqNum : number;
	millis : number;
}

export class GameProp<T extends Object> {

	private static readonly _udpRedundancies = 1;
	private static readonly numberEpsilon = 1e-2;

	private _value : Optional<T>;
	private _lastPublished : Map<DataFilter, PublishInfo<T>>;

	private _seqNum : number;
	private _importSeqNum : number;
	private _consecutiveChanges : number;
	private _lastChanged : number;

	private _minInterval : number;
	private _conditionalInterval : Optional<IntervalFn<T>>;
	private _refreshInterval : Optional<number>;
	private _equals : EqualsFn<T>;
	private _clearAfterPublish : boolean;
	private _onPublishFn : () => void;

	private _filters : Set<DataFilter>;

	constructor(propOptions : GamePropOptions<T>) {
		this._value = new Optional();
		this._lastPublished = new Map();

		this._seqNum = 0;
		this._importSeqNum = 0;
		this._consecutiveChanges = 0;
		this._lastChanged = 0;

		this._minInterval = assignOr(propOptions.minInterval, 0);
		this._refreshInterval = new Optional(assignOr(propOptions.refreshInterval, null));
		this._conditionalInterval = new Optional(assignOr(propOptions.conditionalInterval, null));
		this._clearAfterPublish = assignOr(propOptions.clearAfterPublish, false);
		this._onPublishFn = assignOr(propOptions.onPublishFn, null);
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
	clear() : void {
		this._consecutiveChanges = 0;
		this._value.clear();
	}

	equals(value : T) : boolean {
		if (!this.has()) {
			return false;
		}
		return this._equals(value, this._value.get());
	}

	import(value : T, seqNum : number) : boolean {
		if (seqNum < this._importSeqNum || value === null) {
			return false;
		}

		this._value.set(value);
		this._importSeqNum = seqNum;
		return true;
	}
	relay(value : T, seqNum : number) : boolean {
		if (seqNum < this._importSeqNum || value === null) {
			return false;
		}

		// Reset if there is a gap in setting value or if value was cleared
		if (seqNum - this._importSeqNum > game.runner().lastStep()) {
			this._consecutiveChanges = 0;
		}

		const seqNumEqual = this._importSeqNum === seqNum;
		if (this.equals(value)) {
			if (!seqNumEqual) {
				this._consecutiveChanges = Math.min(-1, this._consecutiveChanges - 1);
			}
			return false;
		}

		this._value.set(value);
		this._importSeqNum = seqNum;
		// If seqnums are equal, either set to 1 or don't increment.
		this._consecutiveChanges = Math.max(1, this._consecutiveChanges + (seqNumEqual ? 0 : 1));
		this._lastChanged = seqNum;
		return true;
	}
	update(value : T, seqNum : number) : boolean {
		if (seqNum < this._seqNum || value === null) {
			return false;
		}

		// Reset if there is a gap in setting value or if value was cleared
		if (seqNum - this._seqNum > game.runner().lastStep()) {
			this._consecutiveChanges = 0;
		}

		const seqNumEqual = this._seqNum === seqNum;
		if (this.equals(value)) {
			if (!seqNumEqual) {
				this._consecutiveChanges = Math.min(-1, this._consecutiveChanges - 1);
			}
			return false;
		}

		this.import(value, seqNum);
		// If seqnums are equal, either set to 1 or don't increment.
		this._consecutiveChanges = Math.max(1, this._consecutiveChanges + (seqNumEqual ? 0 : 1));
		this._lastChanged = seqNum;
		return true;
	}

	rollback(value : T, seqNum : number) : boolean {
		if (value === null) {
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

		// Send it since we don't have publishing metadata
		if (!this._lastPublished.has(filter)) {
			return true;
		}

		// Resend all non-expired data during init
		if (filter === DataFilter.INIT) {
			return true;
		}

		if (filter === DataFilter.UDP && seqNum - this._lastChanged <= GameProp._udpRedundancies) {
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

		if (this._clearAfterPublish) {
			this.clear();
		}

		if (this._onPublishFn !== null) {
			this._onPublishFn();
		}

		return [value, true];
	}
}