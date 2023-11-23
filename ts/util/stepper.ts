
import { StepData } from 'game/game_object'

import { Optional } from 'util/optional'
import { NumberRingBuffer } from 'util/buffer/number_ring_buffer'
import { SavedCounter } from 'util/saved_counter'

type StepperOptions = {
	timePerStep : number;
}

export type StepperStats = {
	stepsPerSecond: number;
	stepTime : number;
	stepInterval : number;
}

export class Stepper {

	// From Options
	private _timePerStep : number;

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

	constructor(options : StepperOptions) {
		this.setFromOptions(options);

		this._seqNum = 0;
		this._updateSpeed = 1;

		this._lastStep = 0;
		this._stepsCounter = new SavedCounter();;
		this._stepsPerSecond = new NumberRingBuffer(30);
		this._stepTimes = new NumberRingBuffer(30);
		this._stepIntervals = new NumberRingBuffer(30);
		this._beginStepTime = Date.now();
		this._endStepTime = Date.now();
	}

	setFromOptions(options : StepperOptions) : void { this._timePerStep = options.timePerStep; }

	timePerStep() : number { return this._timePerStep; }
	seqNum() : number { return this._seqNum; }
	setSeqNum(seqNum : number) : void { this._seqNum = seqNum; }
	private updateSpeed() : number { return this._updateSpeed; }
	setUpdateSpeed(speed : number) : void { this._updateSpeed = speed; }

	lastStepsPerSecond() : number { return this._stepsCounter.saved(); }
	lastStep() : number { return this._lastStep; }
	lastStepTime() : number { return this._endStepTime - this._beginStepTime; }
	lastStepInterval() : number { return Date.now() - this._beginStepTime; }
	timeSinceLastStep() : number { return Date.now() - this._endStepTime; }
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

	prepareStep(currentStep : number) : void {
		this._stepIntervals.push(Date.now() - this._beginStepTime);
		this._beginStepTime = Date.now();

		this._lastStep = currentStep;
		this._seqNum += this._lastStep;

		if (this._beginStepTime % 1000 < this._endStepTime % 1000) {
			this._stepsCounter.save();
			this._stepsPerSecond.push(this._stepsCounter.saved());
			this._stepsCounter.reset();
		}
	}
	getStepData() : StepData {
		return {
			millis: this.updateSpeed() * this.lastStep() * this.timePerStep(),
			realMillis: this.timeSinceLastStep(),
			seqNum: this.seqNum(),
		};
	}
	endStep() : void {
		this._endStepTime = Date.now();
		this._stepsCounter.add(1);
    	this._stepTimes.push(this._endStepTime - this._beginStepTime);
	}
}