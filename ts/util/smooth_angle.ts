
import { Fns } from 'util/fns'

// Basic class that clamps angle to some tolerance
export class SmoothAngle {

	// Approx 3 deg
	private static readonly _tolerance = 0.05;

	private _has : boolean;
	private _base : number;
	private _predict : number;

	constructor() {
		this._has = false;
		this._base = 0;
		this._predict = 0;
	}

	has() : boolean { return this._has; }
	get() : number { return this._predict; }
	set(rad : number) {
		this._base = Fns.normalizeRad(rad);
		this._predict = this._base;

		this._has = true;
	}
	predict(rad : number) {
		if (this._has) {
			this._predict = Fns.normalizeRad(rad);
			return;
		}

		this._predict = Fns.clamp(this._base - SmoothAngle._tolerance, Fns.normalizeRad(rad), this._base + SmoothAngle._tolerance);
		this._predict = Fns.normalizeRad(this._predict);
	}
}