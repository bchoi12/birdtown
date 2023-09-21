

export class Smoother {
	
	private _smoothTime : number;
	private _lastDiffTime : number;
	private _weight : number;

	constructor(time : number) {
		this._smoothTime = time;
		this._lastDiffTime = Date.now();
		this._weight = 0;
	}

	setDiff(diff : number) : void {
		if (diff <= 0) {
			this._weight = 0;
			return;
		}

		if (this._weight <= 0) {
			this._lastDiffTime = Date.now();
		}
		this._weight = 1 - (Date.now() - this._lastDiffTime) / this._smoothTime;
	}

	weight() : number { return Math.max(0, this._weight); }
}