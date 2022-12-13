
import { defined } from 'util/common'

export class ChangeTracker<T> {

	private _getValue : () => T;

	private _value : T;
	private _onChange : (value : T, oldValue? : T) => void;

	constructor(getValue : () => T, onChange : (value : T, oldValue? : T) => void) {
		this._getValue = getValue;
		if (defined(onChange)) {
			this._onChange = onChange;
		}
	}

	check() : boolean {
		const value = this._getValue();
		if (!defined(this._value)) {
			this._value = value;
			return false;
		}

		if (this._value !== value) {
			this._onChange(value, this._value);
			this._value = value;
			return true;
		}

		return false;
	}

	set(value : T) {
		this._value = value;
	}

	value() : T {
		return this._value;
	}
}