

type OnSetFn<T extends number> = (prev : T) => void;
type OnUnsetFn<T extends number> = (next : T) => void;
type StateFns<T extends number> = {
	onSet? : OnSetFn<T>;
	onUnset? : OnUnsetFn<T>;
}

export class StateMachine<T extends number> {
	
	private _state : T;
	private _stateFns : Map<T, StateFns<T>>;

	constructor(states : T[]) {
		this._state = <T>0;
		this._stateFns = new Map();

		states.forEach((state : T) => {
			this._stateFns.set(state, {});
		});
	}

	setState(state : T) : void {
		if (!this._stateFns.has(state)) {
			console.error("Error: trying to set invalid state %d, all states:", state, this._stateFns.keys())
			return;
		}

		if (state === this._state) {
			return;
		}

		if (this._stateFns.has(this._state) && this._stateFns.get(this._state).onUnset) {
			this._stateFns.get(this._state).onUnset(state);
		}
		if (this._stateFns.get(state).onSet) {
			this._stateFns.get(state).onSet(this._state);
		}

		this._state = state;
	}

	addOnSet(state : T, fn : OnSetFn<T>) : void {
		if (!this._stateFns.has(state)) {
			console.error("Error: trying to add onSet for invalid state %d, all states:", state, this._stateFns.keys())
			return;
		}

		this._stateFns.get(state).onSet = fn;
	}

	addOnUnset(state : T, fn : OnUnsetFn<T>) : void {
		if (!this._stateFns.has(state)) {
			console.error("Error: trying to add onUnset for invalid state %d, all states:", state, this._stateFns.keys())
			return;
		}

		this._stateFns.get(state).onUnset = fn;
	}
}