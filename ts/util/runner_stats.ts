
import { StepData } from 'game/game_object'
import { Optional } from 'util/optional'

export class RunnerStats {

	private _targetRate : number;

	private _rate : number;
	private _tickTime : number;
	private _maxTickTime : Optional<number>;
	private _minTickTime : Optional<number>;
	private _interval : number;
	private _maxMillis : Optional<number>;
	private _minMillis : Optional<number>;
	private _millisRatio : number;

	constructor(target : number) {
		this._targetRate = target;

		this._rate = this._targetRate;
		this._tickTime = 1000 / this._targetRate;
		this._maxTickTime = new Optional();
		this._minTickTime = new Optional();
		this._interval = 1000 / this._targetRate;
		this._maxMillis = new Optional();
		this._minMillis = new Optional();
	}

	rate() : number { return this._rate; }
	tickTime() : number { return this._tickTime; }
	minTickTime() : number { return this._minTickTime.or(0); }
	maxTickTime() : number { return this._maxTickTime.or(999);}
	averageInterval() : number { return this._interval; }
	maxMillis() : number { return this._maxMillis.or(999); }
	minMillis() : number { return this._minMillis.or(0);}
	millisRatio() : number { return this._millisRatio; }

	logTick(interval : number, tickTime : number, stepData? : StepData) : void {
		this._rate = this.average(this._rate, 1000 / interval);
		this._tickTime = this.average(this._tickTime, tickTime);
		this._maxTickTime.set(Math.max(this._maxTickTime.or(0), tickTime));
		this._minTickTime.set(Math.min(this._minTickTime.or(999), tickTime));		
		this._interval = this.average(this._interval, interval);

		if (stepData) {
			this._maxMillis.set(Math.max(this._maxMillis.or(0), stepData.millis));
			this._minMillis.set(Math.min(this._minMillis.or(999), stepData.millis));
			this._millisRatio = this.average(this._millisRatio, stepData.millis / interval);
		}
	}

	resetMinMax() : void {
		this._minTickTime.clear();
		this._maxTickTime.clear();
		this._minMillis.clear();
		this._maxMillis.clear();
	}

	private average(current : number, value : number) : number {
		return ((this._targetRate - 1) * current + value) / this._targetRate;
	}
}