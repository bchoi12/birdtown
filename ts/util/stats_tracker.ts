export class StatsTracker {

	private _values : Map<number, number>;
	private _lastFlushes : Map<number, number>;

	private _value : number;
	private _lastFlush : number;

	constructor() {
		this._values = new Map();
		this._lastFlushes = new Map();
	}

	reset(key : number) : void {
		this._values.set(key, 0);
		this._lastFlushes.set(key, Date.now());
	}

	add(key : number, value : number) : void {
		if (!this._values.has(key)) {
			this._values.set(key, 0);
		}

		this._values.set(key, this._values.get(key) + value);
	}

	flush(key : number) : number {
		if (!this._values.has(key)) { return 0; }

		const time = this.secondsElapsed(key);
		if (time === 0) {
			this.reset(key);
			return 0;
		}

		let temp = this._values.get(key) / time;
		this.reset(key);
		return temp;
	}

	secondsElapsed(key : number) : number {
		return (Date.now() - this._lastFlushes.get(key)) / 1000;
	}
}