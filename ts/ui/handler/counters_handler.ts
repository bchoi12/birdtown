import { game } from 'game'

import { ui } from 'ui'
import { HudType, HudOptions } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { CounterWrapper } from 'ui/wrapper/counter_wrapper'

export class CountersHandler extends HandlerBase implements Handler {
	private _countersElm : HTMLElement;
	private _containerElm : HTMLElement;
	private _counters : Map<HudType, CounterWrapper>;

	constructor() {
		super(HandlerType.COUNTERS);

		this._countersElm = Html.elm(Html.divCounters);
		this._containerElm = Html.elm(Html.divCountersContainer);
		this._counters = new Map();
	}

	override reset() : void {
		super.reset();

		this._counters.forEach((wrapper : CounterWrapper, type : HudType) => {
			wrapper.delete(() => {
				this._counters.delete(type);
			});
		});
	}

	updateCounters(counters : Map<HudType, HudOptions>) : void {
		let currentTypes = new Set<HudType>();
		counters.forEach((options : HudOptions, type : HudType) => {
			let counter = this.getOrAddCounter(type);
			counter.updateCounter(options);
			currentTypes.add(type);
		});
		this.removeOthers(currentTypes);
	}

	private getOrAddCounter(type : HudType) : CounterWrapper {
		if (this._counters.has(type)) {
			return this._counters.get(type);
		}

		let wrapper = new CounterWrapper(type);
		this._counters.set(type, wrapper);
		this._containerElm.appendChild(wrapper.elm());
		return wrapper;
	}

	private removeOthers(types : Set<HudType>) : void {
		this._counters.forEach((wrapper : CounterWrapper, type : HudType) => {
			if (!types.has(type)) {
				this._containerElm.removeChild(wrapper.elm());
				this._counters.delete(type);
			}
		});
	}
}