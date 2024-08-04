

export class Stopwatch {
	
	private _millis : number;

	constructor() {
		this._millis = 0;
	}

	elapse(millis : number) : void { this._millis += millis; }
	reset() : void { this._millis = 0;}
	millis() : number { return this._millis; }
	seconds() : number { return Math.floor(this._millis / 1000); }
}