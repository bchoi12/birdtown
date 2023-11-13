import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { CounterType, UiMode } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { CounterWrapper } from 'ui/wrapper/counter_wrapper'

export class CountersHandler extends HandlerBase implements Handler {
	private _countersElm : HTMLElement;
	private _counters : Map<CounterType, CounterWrapper>;

	constructor() {
		super(HandlerType.COUNTERS);

		this._countersElm = Html.elm(Html.divCounters);
		this._counters = new Map();
	}

	override reset() : void {
		this._counters.forEach((wrapper : CounterWrapper, type : CounterType) => {
			wrapper.delete(() => {
				this._counters.delete(type);
			});
		});
	}

	updateCounters(counters : Map<CounterType, number>) : void {
		let currentTypes = new Set<CounterType>();
		counters.forEach((count : number, type : CounterType) => {
			let counter = this.getOrAddCounter(type);
			counter.updateCounter(count);
			currentTypes.add(type);
		});
		this.removeOthers(currentTypes);
	}

	private setCounter(type : CounterType, count : number) : void {
		let counter = this.getOrAddCounter(type);
		counter.setCounter(count);
	}

	private updateCounter(type : CounterType, count : number) : void {
		let counter = this.getOrAddCounter(type);
		counter.updateCounter(count);
	}

	private getOrAddCounter(type : CounterType) : CounterWrapper {
		if (this._counters.has(type)) {
			return this._counters.get(type);
		}

		let wrapper = new CounterWrapper(type);
		this._counters.set(type, wrapper);
		this._countersElm.appendChild(wrapper.elm());
		return wrapper;
	}

	private removeOthers(types : Set<CounterType>) : void {
		this._counters.forEach((wrapper : CounterWrapper, type : CounterType) => {
			if (!types.has(type)) {
				this._countersElm.removeChild(wrapper.elm());
				this._counters.delete(type);
			}
		});
	}
}