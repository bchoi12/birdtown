

type ChanceFn = (n : number, result? : boolean) => number;
type SwitchFn = [number, (n? : number) => void];

// Based on Mulberry32
export class SeededRandom {
	private _seed : number;
	private _current : number;
	private _chance : number;
	private _chanceFn : ChanceFn;

	constructor(seed : number) {
		this._seed = seed;
		this._current = this._seed;
		this._chance = 0;
		this._chanceFn = (n : number) => { return n; }
	}

	getSeed() : number { return this._seed; }

	seed(seed : number) : void {
		this._seed = seed;
		this._current = seed;
	}

	reset() : void { this._current = this._seed; }

	int(n : number) : number {
		return Math.floor(this.next() * n);
	}
	next() : number {
    	this._current |= 0;
    	this._current = this._current + 0x6D2B79F5 | 0;
    	let t = Math.imul(this._current ^ this._current >>> 15, 1 | this._current);
    	t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    	return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }

    setChance(chance : number, chanceFn : ChanceFn) : void {
    	this._chance = chance;
    	this._chanceFn = chanceFn;
    }
    testChance() : boolean {
    	const result = this.next() < this._chance;
    	this._chance = this._chanceFn(this._chance, result);
    	return result;
    }
    switch(sortedFns : Array<SwitchFn>) : number {
    	const num = this.next();

    	for (let i = 0; i < sortedFns.length; ++i) {
    		if (num < sortedFns[i][0]) {
    			sortedFns[i][1]();
    			break;
    		}
    	}

    	return num;
    }

    gt(test : number) : boolean { return this.next() > test; }
    ge(test : number) : boolean { return this.next() >= test; }
    lt(test : number) : boolean { return this.next() < test; }
    le(test : number) : boolean { return this.next() <= test; }
}