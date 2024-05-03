

export class RateLimiter {
	
	private _current : number;
	private _limit : number;

	constructor(limit : number) {
		this._current = 0;
		this._limit = limit;
	}

	setLimit(limit : number) : void { this._limit = limit; }
	reset() : void { this._current = this._limit; }

	check(num : number) : boolean {
		this._current += num;

		if (this._current >= this._limit) {
			this._current = 0;
			return true;
		}
		return false;
	}
}