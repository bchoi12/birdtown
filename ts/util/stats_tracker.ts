export class StatsTracker {
	private _value : number;
	private _lastFlush : number;

	constructor() {
		this.reset();
	}

	reset() : void {
		this._value = 0;
		this._lastFlush = Date.now();
	}

	add(value : number) : void {
		this._value += value;
	}

	flush() : number {
		let temp = this._value / this.secondsElapsed();
		this.reset();
		return temp;
	}

	secondsElapsed() : number {
		return (Date.now() - this._lastFlush) / 1000;
	}
}