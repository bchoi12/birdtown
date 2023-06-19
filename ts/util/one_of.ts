
import { defined } from 'util/common'

export class OneOf<T, U> {

	private _t : T;
	private _u : U;

	private constructor(t : T, u : U) {
		if (defined(t) && defined(u)) {
			console.error("Warning: both params defined in oneof, defaulting to first", t, u);
		}

		if (defined(t)) {
			this._t = t;
		} else if (defined(u)) {
			this._u = u;
		} else {
			console.error("Error: malformed oneof with two null parameters");
		}
	}

	static create<T, U>(t : T, u : U) {
		return new OneOf(t, u);
	}
	static left<T, U>(t : T) : OneOf<T, U> {
		return new OneOf(t, null);
	}
	static right<T, U>(u : U) : OneOf<T, U> {
		return new OneOf(null, u);
	}

	isLeft() : boolean { return defined(this._t); }
	isRight() : boolean { return defined(this._u); }

	get<V>(get1 : (t : T) => V, get2 : (u : U) => V) : V {
		if (defined(this._t)) {
			return get1(this._t);
		} else {
			return get2(this._u);
		}
	}
	getLeft() : T { return this._t; }
	getRight() : U { return this._u; }

	execute(f1 : (t : T) => void, f2 : (u : U) => void) : void {
		if (defined(this._t)) {
			f1(this._t);
		} else {
			f2(this._u);
		}
	}
}