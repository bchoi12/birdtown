
import { Optional } from 'util/optional'

export class RateLimiter {
	
	private _current : number;
	private _limit : number;

	private _lastTimestamp : Optional<number>;

	constructor(limit : number) {
		this._current = 0;
		this._limit = limit;

		this._lastTimestamp = new Optional();
	}

	setLimit(limit : number) : void { this._limit = limit; }
	reset() : void {
		this._lastTimestamp.set(Date.now());
		this._current = 0;
	}
	prime() : void {
		this._lastTimestamp.set(Date.now() - this._limit);
		this._current = this._limit;
	}

	check(num : number) : boolean {
		return this.checkPercent(num, 1);
	}
	checkPercent(num : number, ratio : number) : boolean {
		this._current += num;

		if (this._current >= ratio * this._limit) {
			this.reset();
			return true;
		}
		return false;
	}

	checkTime() : boolean {
		if (!this._lastTimestamp.has()) {
			this._lastTimestamp.set(Date.now());
		}

		if (Date.now() - this._lastTimestamp.get() >= this._limit) {
			this.reset();
			return true;
		}
		return false;
	}
}