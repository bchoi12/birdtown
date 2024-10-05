
import { Optional } from 'util/optional'

export class StatNumber {

	private _base : number;
	private _current : number;

	constructor(value : number) {
		this._base = value;
		this._current = value;
	}

	reset() : void { this._current = this._base; }

	base() : number { return this._base; }
	setBase(value : number) : void { this._base = value; }
	get() : number { return this._current; }
	set(value : number) : void { this._current = value; }
	add(value : number) : void { this._current += value; }
}