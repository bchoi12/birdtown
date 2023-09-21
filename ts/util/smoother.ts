

import { settings } from 'settings'

import { Optional } from 'util/optional'

export class Smoother {
	
	private _lastDiffTime : number;
	private _weight : number;
	private _smoothTime : Optional<number>;

	constructor(smoothTime? : number) {
		this._lastDiffTime = Date.now();
		this._weight = 0;
		this._smoothTime = new Optional();
		if (smoothTime) {
			this._smoothTime.set(smoothTime);
		}
	}

	setDiff(diff : number) : void {
		if (diff <= 0) {
			this._weight = 0;
			return;
		}

		if (this._weight <= 0) {
			this._lastDiffTime = Date.now();
		}
		this._weight = 1 - (Date.now() - this._lastDiffTime) / this.smoothTime();
	}

	weight() : number { return Math.max(0, this._weight); }
	smoothTime() : number { return this._smoothTime.has() ? this._smoothTime.get() : settings.predictionTime; }
}