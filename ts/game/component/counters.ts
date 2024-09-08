
import { game } from 'game'
import { Component, ComponentBase } from 'game/component'
import { ComponentType } from 'game/component/api'

import { HudType } from 'ui/api'

export type CountersInitOptions = {
	counters? : Map<HudType, number>;
}

export class Counters extends ComponentBase implements Component {

	private _counters : Map<HudType, number>;

	constructor(init? : CountersInitOptions) {
		super(ComponentType.COUNTERS);

		this._counters = new Map();

		if (init && init.counters) {
			init.counters.forEach((value, key) => {
				this.setCounter(key, value);
			})
		}

		for (const stringCounter in HudType) {
			const counter = Number(HudType[stringCounter]);
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

	hasCounter(counter : HudType) : boolean { return this._counters.has(counter); }
	getCounter(counter : HudType) : number {
		if (!this.hasCounter(counter)) {
			return 0;
		}
		return this._counters.get(counter);
	}
	addCounter(counter : HudType, value : number) : void { this._counters.set(counter, this.getCounter(counter) + value); }
	setCounter(counter : HudType, value : number) : void { this._counters.set(counter, value); }
}