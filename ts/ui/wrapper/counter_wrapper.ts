
import { ui } from 'ui'
import { CounterType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/util/icon'

import { defined } from 'util/common'

export class CounterWrapper extends HtmlWrapper {

	private static readonly _iconMapping = new Map<CounterType, IconType>([
		[CounterType.HEALTH, IconType.HEART],
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
		this._iconElm = Icon.create(CounterWrapper._iconMapping.get(this._type));
		this._iconElm.classList.add(Html.classSpaced);

		this.elm().classList.add(Html.classCounter);

		this.elm().appendChild(this._counterElm);
		this.elm().appendChild(this._iconElm);
	}

	setCounter(count : number) : void {
		this._lastCount = count;
		this._count = count;
		this._lastUpdateTime = Date.now();

		this._counterElm.textContent = "" + this._count;
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

		const elapsed = Date.now() - this._lastUpdateTime;
		const displayCount = Math.floor(this._lastCount + Math.min(1, elapsed / 250) * (this._count - this._lastCount));
		this._counterElm.textContent = "" + displayCount;
	}

	delete(onDelete : () => void) : void {
		this.elm().parentNode.removeChild(this.elm());
		onDelete();
	}
}