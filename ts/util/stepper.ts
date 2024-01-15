
import { StepData } from 'game/game_object'

import { Optional } from 'util/optional'
import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'
import { SavedCounter } from 'util/saved_counter'

export type StepperStats = {
	stepsPerSecond: number;
	stepTime : number;
	stepInterval : number;
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
	averageStepsPerSecond() : number { return this._stepsPerSecond.average(); }
	averageStepTime() : number { return this._stepTimes.average(); }
	averageStepInterval() : number { return this._stepIntervals.average(); }

	stats() : StepperStats {
		return {
			stepsPerSecond: this.averageStepsPerSecond(),
			stepTime: this.averageStepTime(),
			stepInterval: this.averageStepInterval(),
		}
	}

	beginStep(currentStep : number) : void {
		this._stepIntervals.push(Date.now() - this._beginStepTime);

		this._lastStep = currentStep;
		this._seqNum += this._lastStep;

		if (Math.floor(Date.now() / 1000) > Math.floor(this._beginStepTime / 1000)) {
			this._stepsCounter.save();
			this._stepsPerSecond.push(this._stepsCounter.saved());
			this._stepsCounter.reset();
		}

		this._beginStepTime = Date.now();
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