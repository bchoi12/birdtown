export class Timer {

	private _enabled : boolean;
	private _totalMillis : number;
	private _millisLeft : number;
	private _finished : boolean;

	private _onComplete : () => void;

	constructor() {
		this._enabled = false;
		this._totalMillis = 0;
		this._millisLeft = 0;
		this._finished = false;
		this._onComplete = () => {};
	}

	start(millis : number, onComplete? : () => void) : void {
		if (millis <= 0) {
			console.error("Error: timer duration should be positive.");
			return;
		}	

		this._enabled = true;
		this._totalMillis = millis;
		this._millisLeft = millis;
		this._finished = false;

		if (onComplete) {
			this._onComplete = onComplete;
		} else {
			this._onComplete = () => {};
		}
	}

	stop() : void {
		this._enabled = false;
		this._finished = false;
	}

	elapse(millis : number) : void {
		if (!this._enabled) {
			return;
		}

		this._millisLeft -= millis;
		if (this._millisLeft <= 0 && !this._finished) {
			this._onComplete();
			this._finished = true;
		}
	}

	hasTimeLeft() : boolean {
		return this._enabled && this._millisLeft > 0;
	}

	finished() : boolean {
		return this._finished;
	}
}