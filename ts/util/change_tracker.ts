
import { defined } from 'util/common'
import { Optional } from 'util/optional'

type ChangeFn<T> = (value : T, oldValue? : T) => void;

export class ChangeTracker<T> {

	private _getValue : () => T;
	private _value : Optional<T>;
	private _onChange : Optional<ChangeFn<T>>;
	private _lastChange : number;

	constructor(getValue : () => T, onChange? : ChangeFn<T>) {
		this._getValue = getValue;
		this._value = new Optional();
		this._onChange = new Optional();
		if (defined(onChange)) {
			this._onChange.set(onChange);
		}
		this._lastChange = Date.now();
	}

	check() : boolean {
		const value = this._getValue();

		if (!this._value.has()) {
			this.set(value);
			return false;
		}

		if (this._value.get() !== value) {
			if (this._onChange.has()) {
				this._onChange.get()(value, this._value.get());
			}

			this.set(value);
			return true;
		}

		return false;
	}

	timeSinceChange() : number { return Date.now() - this._lastChange; }

	private set(value : T) {
		this._value.set(value);
		this._lastChange = Date.now();
	}
}