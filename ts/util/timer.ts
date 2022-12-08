export class Timer {

	private _enabled : boolean;
	private _totalMillis : number;
	private _millisLeft : number;

	constructor() {
		this._enabled = false;
		this._totalMillis = 0;
		this._millisLeft = 0;
	}

	start(millis : number) : void {
		if (millis <= 0) {
			console.error("Error: timer duration should be positive.");
			return;
		}	

		this._enabled = true;
		this._totalMillis = millis;
		this._millisLeft = millis;
	}

	stop() : void {
		this._enabled = false;
	}

	elapse(millis : number) : void {
		if (!this._enabled) {
			return;
		}

		this._millisLeft -= millis;

		if (this._millisLeft < 0) {
			this._millisLeft = 0;
		}
	}

	on() : boolean {
		return this._enabled && this._millisLeft > 0;
	}

	finished() : boolean {
		return this._enabled && this._millisLeft <= 0;
	}
}