
// Based on Mulberry32
export class SeededRandom {
	private _seed : number;
	private _current : number;

	constructor(seed : number) {
		this._seed = seed;
		this._current = this._seed;
	}

	getSeed() : number { return this._seed; }

	seed(seed : number) : void {
		this._seed = seed;
		this._current = seed;
	}

	reset() : void { this._current = this._seed; }

	next() : number {
    	this._current |= 0;
    	this._current = this._current + 0x6D2B79F5 | 0;
    	let t = Math.imul(this._current ^ this._current >>> 15, 1 | this._current);
    	t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    	return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

}