
import { StepData } from 'game/game_object'

import { Optional } from 'util/optional'
import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'
import { SavedCounter } from 'util/saved_counter'

export type StepperStats = {
	stepsPerSecond: number;
	stepsPerSecondMin : number;
	stepsPerSecondMax : number;
	stepTime : number;
	stepTimeMin : number;
	stepTimeMax : number;
	stepInterval : number;
	stepIntervalMin : number;
	stepIntervalMax : number;
}

export class Stepper {

	// Used to evaluate current step
	private _seqNum : number;
	private _updateSpeed : number;

	// Stats
	private _lastStep : number;
	private _stepsCounter : SavedCounter;
	private _stepsPerSecond : NumberRingBuffer;
	private _stepTimes : NumberRingBuffer;
	private _stepIntervals : NumberRingBuffer;
	private _beginStepTime : number;
	private _endStepTime : number;

	constructor() {	
		this._seqNum = 0;
		this._updateSpeed = 1;

		this._lastStep = 0;
		this._stepsCounter = new SavedCounter();;
		this._stepsPerSecond = new NumberRingBuffer(2);
		this._stepTimes = new NumberRingBuffer(30);
		this._stepIntervals = new NumberRingBuffer(30);
		this._beginStepTime = Date.now();
		this._endStepTime = Date.now();
	}

	seqNum() : number { return this._seqNum; }
	setSeqNum(seqNum : number) : void { this._seqNum = seqNum; }
	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }

	lastStepsPerSecond() : number { return this._stepsCounter.saved(); }
	lastStep() : number { return this._lastStep; }
	lastStepTime() : number { return this._endStepTime - this._beginStepTime; }
	timeSinceBeginStep() : number { return Date.now() - this._beginStepTime; }
	timeSinceEndStep() : number { return Date.now() - this._endStepTime; }

	stats() : StepperStats {
		const stats = {
			stepsPerSecond: this._stepsPerSecond.average(),
			stepsPerSecondMin: this._stepsPerSecond.min(),
			stepsPerSecondMax: this._stepsPerSecond.max(),
			stepTime: this._stepTimes.average(),
			stepTimeMin: this._stepTimes.min(),
			stepTimeMax: this._stepTimes.max(),
			stepInterval: this._stepIntervals.average(),
			stepIntervalMin: this._stepIntervals.min(),
			stepIntervalMax: this._stepIntervals.max(),
		};

		this._stepsPerSecond.flushStats();
		this._stepTimes.flushStats();
		this._stepIntervals.flushStats();

		return stats;
	}

	beginStep(currentStep : number) : void {
		const now = Date.now();

		this._stepIntervals.push(now - this._beginStepTime);

		this._lastStep = currentStep;
		this._seqNum += this._lastStep;

		if (Math.floor(now / 1000) > Math.floor(this._beginStepTime / 1000)) {
			this._stepsCounter.save();
			this._stepsPerSecond.push(this._stepsCounter.saved());
			this._stepsCounter.reset();
		}

		this._beginStepTime = now;
	}
	getStepData() : StepData {
		return {
			millis: this._updateSpeed * this._lastStep,
			realMillis: this._stepIntervals.peek(),
			seqNum: this.seqNum(),
		};
	}
	endStep() : void {
		this._endStepTime = Date.now();
		this._stepsCounter.add(1);
    	this._stepTimes.push(this._endStepTime - this._beginStepTime);
	}
}