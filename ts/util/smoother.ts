

import { settings } from 'settings'

import { Optional } from 'util/optional'

export class Smoother {
	
	private _lastDiffTime : number;
	private _weight : number;
	private _canSmooth : boolean;
	private _smoothTime : Optional<number>;

	constructor(smoothTime? : number) {
		this._lastDiffTime = 0
		this._weight = 0;
		this._canSmooth = true;
		this._smoothTime = new Optional();

		if (smoothTime) {
			this._smoothTime.set(smoothTime);
		}
	}

	setDiff(diff : number) : void {
		// Nothing to smooth
		if (this.smoothTime() <= 0) {
			this._weight = 0;
			return;
		}

		if (this._weight <= 0 && diff <= 0) {
			// In sync now so allow smoothing
			this._canSmooth = true;
			return;
		}

		// Diff !== 0, start smoothing
		if (this._weight <= 0 && this._canSmooth) {
			this._lastDiffTime = Date.now();
			this._canSmooth = false;
		}
		this._weight = Math.max(0, 1 - (Date.now() - this._lastDiffTime) / this.smoothTime());
	}

	weight() : number { return Math.min(1, Math.max(0, this._weight)); }
	smoothTime() : number { return this._smoothTime.has() ? this._smoothTime.get() : settings.predictionTime(); }
}