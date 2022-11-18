import { defined } from 'util/common'

export class Timer {

	private _enabled : boolean;
	private _reversed : boolean;

	private _started : number;
	private _duration : number;
	private _fullDuration : number;

	constructor(duration : number) {
		this._enabled = false;
		this._reversed = false;
		this._started = 0;

		this._duration = 0;
		this._fullDuration = duration;
	}

	start(speed? : number) : void {
		this._started = Date.now();
		this._duration = this._fullDuration;

		if (defined(speed) && speed > 0) {
			this._duration /= speed;
		}

		this._enabled = true;
		this._reversed = false;
	}

	reverse(speed? : number) : void {
		if (this._reversed) {
			return
		}

		this._duration = Math.min(this.timeElapsed(), this._fullDuration);
		if (defined(speed) && speed > 0) {
			this._duration /= speed;
		}

		if (this._duration > 0) {
			this._started = Date.now();
			this._enabled = true;
			this._reversed = true;
		}
	}

	stop() : void {
		this._enabled = false;
	}

	enabled() : boolean {
		return this._enabled && this.weight() > 0;
	}

	timeElapsed() : number {
		if (!this._enabled) {
			return 0;
		}

		return Date.now() - this._started;
	}

	weight() : number {
		if (!this._enabled) {
			return 0;
		}

		const weight = Math.min(1, (Date.now() - this._started) / this._duration);
		if (this._reversed) {
			return 1 - weight;
		}
		return weight;
	}
}