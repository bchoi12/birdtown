
import { CounterType } from 'game/component/api'

import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { defined } from 'util/common'

enum DisplayType {
	UNKNOWN,

	COOLDOWN,
	INTEGER,
	PERCENT,
}
type IconMetadata = {
	iconType : IconType;
	displayType : DisplayType;
	delay : number;
}

export class CounterWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _iconMetadata = new Map<CounterType, IconMetadata>([
		[CounterType.CHARGE, {
			iconType: IconType.BOLT,
			displayType: DisplayType.INTEGER,
			delay: 0,
		}],
		[CounterType.HEALTH, {
			iconType: IconType.HEART,
			displayType: DisplayType.INTEGER,
			delay: 250,
		}],
		[CounterType.JUICE, {
			iconType: IconType.TRUCK_FAST,
			displayType: DisplayType.PERCENT,
			delay: 0,
		}],
		[CounterType.ROCKET, {
			iconType: IconType.ROCKET,
			displayType: DisplayType.COOLDOWN,
			delay: 0,
		}],
	])

	private _type : CounterType;
	private _counterElm : HTMLElement;
	private _iconElm : HTMLElement;

	private _lastCount : number;
	private _count : number;
	private _lastUpdateTime : number;

	constructor(type : CounterType) {
		super(Html.div());

		this._type = type;
		this._counterElm = Html.span();
		this._counterElm.classList.add(Html.classSpaced);
		this._counterElm.textContent = "?";
		this._iconElm = Icon.create(this.iconType());
		this._iconElm.classList.add(Html.classSpaced);

		this.elm().classList.add(Html.classCounter);

		this.elm().appendChild(this._counterElm);
		this.elm().appendChild(this._iconElm);
	}

	iconType() : IconType { return CounterWrapper._iconMetadata.get(this._type).iconType; }
	private displayType() : DisplayType { return CounterWrapper._iconMetadata.get(this._type).displayType; }
	private delay() : number { return CounterWrapper._iconMetadata.get(this._type).delay; }

	setCounter(count : number) : void {
		this._lastCount = count;
		this._count = count;
		this._lastUpdateTime = Date.now();
		this._counterElm.textContent = this.getDisplayText(this._count);
	}

	updateCounter(count : number) : void {
		if (!defined(this._count)) {
			this.setCounter(count);
			return;
		}

		if (this._count !== count) {
			this._lastCount = this._count;
			this._count = count;
			this._lastUpdateTime = Date.now();
		}


		const delay = this.delay();
		const elapsed = Date.now() - this._lastUpdateTime;
		let displayCount = delay > 0 ?
			Math.floor(this._lastCount + Math.min(1, elapsed / delay) * (this._count - this._lastCount)) :
			this._count;

		this._counterElm.textContent = this.getDisplayText(displayCount);
	}

	delete(onDelete : () => void) : void {
		this.elm().parentNode.removeChild(this.elm());
		onDelete();
	}

	private getDisplayText(count : number) : string {
		switch (this.displayType()) {
		case DisplayType.COOLDOWN:
			let disp = Math.ceil(10 * count) / 10;
			if (disp > 0) {
				return "" + disp;
			} else {
				return "RDY"
			}
			break;
		case DisplayType.INTEGER:
			return "" + Math.ceil(count);
		case DisplayType.PERCENT:
			return Math.ceil(count) + "%";
		}
		return "";
	}
}