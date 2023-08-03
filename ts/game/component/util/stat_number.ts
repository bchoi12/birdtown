
import { BoostType } from 'game/component/api'

type BoostFn = (value : number) => number;

export class StatNumber {

	private static readonly _boostOrder = [BoostType.ADD, BoostType.MULT, BoostType.FINAL];

	private _default : number;
	private _current : number;

	private _boosts : Map<BoostType, Array<BoostFn>>;

	constructor(value : number) {
		this._default = value;
		this._current = value;

		this._boosts = new Map();
	}

	reset() : void { this._current = this._default; }
	boost() : void {
		for (let type of StatNumber._boostOrder) {
			if (!this._boosts.has(type)) {
				continue;
			}
			this._boosts.get(type).forEach((fn : BoostFn) => {
				this._current = fn(this._current);
			});
		}
	}

	setDefault(value : number) : void { this._default = value; }
	setCurrent(value : number) : void { this._current = value; }

	get() : number { return this._current; }
	set(value : number) : void { this._current = value; }
	add(value : number) : void { this._current += value; }

	clearBoosts() : void { this._boosts = new Map(); }
	addBoost(type : BoostType, fn : BoostFn) : void {
		if (!this._boosts.has(type)) {
			this._boosts.set(type, new Array());
		}
		this._boosts.get(type).push(fn);
	}
}