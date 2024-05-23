
import { defined } from 'util/common'

export class Optional<T> {

	private _has : boolean;
	private _value : T;

	constructor(value? : T) { this.set(value); }

	static empty<T>(value? : T) : Optional<T> {
		let empty = new Optional<T>();
		if (defined(value)) {
			empty._value = value;
		}
		return empty;
	}

	clear() : void { this._has = false; }
	set(value : T) : void {
		this._has = defined(value);
		if (this._has) {
			this._value = value;
		}
	}
	has() : boolean { return this._has; }
	get() : T { return this._value; }
	pop() : [T, boolean] {
		const ok = this.has();
		this.clear();
		return [this.get(), ok];
	}

	hasAnd(fn : (value : T) => boolean) : boolean {
		if (!this.has()) {
			return false;
		}

		return fn(this.get());
	}

	executeOr<U>(fn : (value : T) => U, u : U) : U {
		if (!this.has()) {
			return u;
		}
		return fn(this.get());
	}

	runIf(fn : (value : T) => void) : boolean {
		if (!this.has()) {
			return false;
		}

		fn(this.get());
		return true;
	}
}