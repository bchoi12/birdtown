
import { Fns } from 'util/fns'

export type TimerOptions = {
	canInterrupt: boolean;
}

export class Timer {

	private _options : TimerOptions;
	private _enabled : boolean;
	private _totalMillis : number;
	private _millisLeft : number;

	private _onComplete : () => void;

	constructor(options : TimerOptions) {
		this._options = options;
		this._enabled = false;
		this._totalMillis = 0;
		this._millisLeft = 0;
		this._onComplete = () => {};
	}

	// TODO: parametrize, add default timer value
	start(millis : number, onComplete? : () => void) : void {
		if (millis <= 0) {
			console.error("Error: timer duration should be positive.");
			return;
		}

		if (!this._options.canInterrupt && this.hasTimeLeft()) {
			return;
		}

		this._enabled = true;
		this._totalMillis = millis;
		this._millisLeft = millis;

		if (onComplete) {
			this._onComplete = onComplete;
		} else {
			this._onComplete = () => {};
		}
	}

	stop() : void {
		this._enabled = false;
	}

	elapse(millis : number) : void {
		if (!this._enabled) {
			return;
		}

		this._millisLeft -= millis;
		if (this._millisLeft <= 0) {
			this._onComplete();
			this._enabled = false;
		}
	}

	hasTimeLeft() : boolean { return this._enabled && this._millisLeft > 0; }
	timeLeft() : number { return this.hasTimeLeft() ? this._millisLeft : 0; }
	percentElapsed() : number { return this._enabled ? Fns.clamp(0, this._totalMillis > 0 ? 1 - this._millisLeft / this._totalMillis : 0, 1) : 0; }
}