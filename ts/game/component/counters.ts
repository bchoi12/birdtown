
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType, CounterType } from 'game/component/api'

export type CountersInitOptions = {
	counters? : Map<CounterType, number>;
}

export class Counters extends ComponentBase implements Component {

	private _counters : Map<CounterType, number>;

	constructor(init? : CountersInitOptions) {
		super(ComponentType.COUNTERS);

		this._counters = new Map();

		if (init && init.counters) {
			init.counters.forEach((value, key) => {
				this.setCounter(key, value);
			})
		}

		for (const stringCounter in CounterType) {
			const counter = Number(CounterType[stringCounter]);
			if (Number.isNaN(counter) || counter <= 0) {
				continue;
			}

			this.addProp<number>({
				has: () => { return this.hasCounter(counter); },
				export: () => { return this.getCounter(counter); },
				import: (obj : number) => { this.setCounter(counter, obj); },
			})
		}
	}

	hasCounter(counter : CounterType) : boolean { return this._counters.has(counter); }
	getCounter(counter : CounterType) : number {
		if (!this.hasCounter(counter)) {
			return 0;
		}
		return this._counters.get(counter);
	}
	addCounter(counter : CounterType, value : number) : void { this._counters.set(counter, this.getCounter(counter) + value); }
	setCounter(counter : CounterType, value : number) : void { this._counters.set(counter, value); }
}