
import { defined } from 'util/common'

export class Optional<T> {

	private _has : boolean;
	private _value : T;

	constructor(value? : T) { this.set(value); }

	clear() : void { this._has = false; }
	set(value : T) : void {
		if (defined(value)) {
			this._value = value;
			this._has = true;
		}
	}
	has() : boolean { return this._has; }
	get() : T { return this._value; }
}