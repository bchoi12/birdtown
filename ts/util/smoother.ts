

import { settings } from 'settings'

import { Optional } from 'util/optional'

export class Smoother {
	
	private _lastDiffTime : number;
	private _weight : number;
	private _smoothTime : number;

	constructor(smoothTime? : number) {
		this._lastDiffTime = 0
		this._weight = 0;
		this._smoothTime = smoothTime ? smoothTime : settings.predictionTime;
	}

	setDiff(diff : number) : void {
		// Nothing to smooth
		if (this.smoothTime() <= 0) {
			this._weight = 0;
			return;
		}
		if (this._weight <= 0 && diff <= 0) {
			return;
		}

		// Diff !== 0, start smoothing
		if (this._weight <= 0) {
			this._lastDiffTime = Date.now();
		}
		this._weight = Math.max(0, 1 - (Date.now() - this._lastDiffTime) / this.smoothTime());
	}

	weight() : number { return Math.min(1, Math.max(0, this._weight)); }
	smoothTime() : number { return this._smoothTime; }
}