

export class PredictWeight {
	
	private _weight : number;

	constructor() {
		this._weight = 0;
	}

	setDiff(diff : number) : void {
		if (diff <= 0) {
			this._weight = 0;
			return;
		}

		// TODO: make 10 configurable or automatically adjusting?
		this._weight = Math.max(0, 1 - diff / 10);
	}

	weight() : number { return this._weight; }
}