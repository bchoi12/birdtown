
import { ui } from 'ui'
import { CounterType, CounterOptions } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { Fns } from 'util/fns'
import { Optional } from 'util/optional'

type IconMetadata = {
	iconType : IconType;
	delay : number;
}

export class CounterWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _minPercent = 20;
	private static readonly _maxPercent = 80;
	private static readonly _iconMetadata = new Map<CounterType, IconMetadata>([
		[CounterType.CHARGE, {
			iconType: IconType.BOLT,
			delay: 0,
		}],
		[CounterType.DASH, {
			iconType: IconType.DASH,
			delay: 0,
		}],
		[CounterType.BLACK_HOLE, {
			iconType: IconType.EARTH,
			delay: 0,
		}],		
		[CounterType.BULLETS, {
			iconType: IconType.GATLING,
			delay: 0,
		}],
		[CounterType.HEALTH, {
			iconType: IconType.HEART,
			delay: 250,
		}],
		[CounterType.JETPACK, {
			iconType: IconType.JET,
			delay: 0,
		}],
		[CounterType.JUICE, {
			iconType: IconType.TELEKENESIS,
			delay: 0,
		}],
		[CounterType.ROCKET, {
			iconType: IconType.ROCKET,
			delay: 0,
		}],
		[CounterType.ROLL, {
			iconType: IconType.ROLL,
			delay: 0,
		}],
	])

	private _type : CounterType;
	private _textElm : HTMLElement;
	private _iconElm : HTMLElement;

	private _count : number;
	private _initialized : boolean;
	private _lastCount : Optional<number>;
	private _countUpdateTime : number;

	constructor(type : CounterType) {
		super(Html.div());

		this._type = type;

		this._textElm = Html.span();
		this._textElm.classList.add(Html.classSpaced);
		this._textElm.textContent = "?";

		this._iconElm = Icon.create(this.iconType());
		this._iconElm.style.paddingLeft = "0.2em";
		this._iconElm.style.paddingRight = "0.2em";

		this._count = 0;
		this._lastCount = Optional.empty(0);
		this._countUpdateTime = Date.now();

		this.elm().classList.add(Html.classCounter);

		this.elm().appendChild(this._textElm);
		this.elm().appendChild(this._iconElm);
	}

	private iconType() : IconType { return CounterWrapper._iconMetadata.get(this._type).iconType; }
	private delay() : number { return CounterWrapper._iconMetadata.get(this._type).delay; }

	updateCounter(options : CounterOptions) : void {
		if (this._count !== options.count) {
			if (this._lastCount.has()) {
				this._lastCount.set(this._count);
			} else {
				this._lastCount.set(options.count);
			}
			this._count = options.count;
			this._countUpdateTime = Date.now();
		}

		let color = options.color ? options.color : "#000000";
		this.elm().style.background = this.getBackgroundCss(options.percentGone, color);

		if (this._lastCount.has()) {
			const delay = this.delay();
			const elapsed = Date.now() - this._countUpdateTime;
			this._textElm.textContent = "" + Math.ceil(delay > 0 ?
				Math.floor(this._lastCount.get() + Math.min(1, elapsed / delay) * (this._count - this._lastCount.get())) :
				this._count);
		} else {
			this._textElm.textContent = options.text ? options.text : "?";
		}
	}

	delete(onDelete : () => void) : void {
		this.elm().parentNode.removeChild(this.elm());
		onDelete();
	}

	private getBackgroundCss(percentGone : number, color : string) : string {
		percentGone = Fns.clamp(0, percentGone, 1);
		let lerp = Math.ceil(Fns.lerpRange(CounterWrapper._minPercent, percentGone, CounterWrapper._maxPercent));

		return `linear-gradient(to right, #00000000, #00000064 ${lerp}%, #000000b4 96%, ${color}bb 96%, ${color}bb 100%)`;
	}
}