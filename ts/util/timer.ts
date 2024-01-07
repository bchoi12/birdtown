
import { Fns } from 'util/fns'

export type TimerOptions = {
	canInterrupt: boolean;
}

enum TimerState {
	UNKNOWN,

	NOT_STARTED,
	RUNNING,
	DONE,
}

export class Timer {

	private _options : TimerOptions;
	private _state : TimerState;
	private _totalMillis : number;
	private _millisLeft : number;

	private _onComplete : () => void;

	constructor(options : TimerOptions) {
		this._options = options;
		this._state = TimerState.NOT_STARTED;
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

		this._state = TimerState.RUNNING;
		this._totalMillis = millis;
		this._millisLeft = millis;

		if (onComplete) {
			this._onComplete = onComplete;
		} else {
			this._onComplete = () => {};
		}
	}

	reset() : void { this._state = TimerState.NOT_STARTED; }
	finish() : void {
		this._onComplete();
		this._state = TimerState.DONE;
	}

	elapse(millis : number) : void {
		if (this._state !== TimerState.RUNNING) {
			return;
		}

		this._millisLeft -= millis;
		if (this._millisLeft <= 0) {
			this.finish();
		}
	}

	hasTimeLeft() : boolean { return this._state === TimerState.RUNNING && this._millisLeft > 0; }
	timeLeft() : number { return this.hasTimeLeft() ? this._millisLeft : 0; }
	percentElapsed() : number {
		if (this._state === TimerState.NOT_STARTED) {
			return 0;
		}
		if (this._state === TimerState.DONE) {
			return 1;
		}
		return Fns.clamp(0, this._totalMillis > 0 ? 1 - this.timeLeft() / this._totalMillis : 0, 1);
	}
}