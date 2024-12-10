
import { game } from 'game'

import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'

import { Fns } from 'util/fns'

type StatOptions = {
	icon: IconType;
	iconOnly? : boolean;

	goodPercent: number;
	badPercent: number;
	suffix: string;

	get: () => number;
	getTarget: () => number;
}

export class StatWrapper extends HtmlWrapper<HTMLElement> {

	private _iconElm : HTMLElement;
	private _textElm : HTMLElement;
	private _suffixElm : HTMLElement;
	private _iconOnly : boolean;
	private _goodPercent : number;
	private _badPercent : number;
	private _get : () => number;
	private _getTarget : () => number;

	constructor(options : StatOptions) {
		super(Html.span());

		this.elm().classList.add(Html.classStat);

		this._iconElm = Icon.create(options.icon);
		this._textElm = Html.span();
		this._suffixElm = Html.span();
		this._iconOnly = options.iconOnly;
		this._goodPercent = options.goodPercent;
		this._badPercent = options.badPercent;
		this._get = options.get;
		this._getTarget = options.getTarget;

		this._suffixElm.textContent = options.suffix;

		this.elm().appendChild(this._iconElm);
		this.elm().appendChild(this._textElm);
		this.elm().appendChild(this._suffixElm);
	}

	refresh() : void {
		const value = this._get();

		if (!this._iconOnly) {
			this._textElm.textContent = " " + value + " ";
		}

		const target = this._getTarget();

		if (target === 0) {
			return;
		}

		// #46b351 to #b34646
		const percent = Fns.normalizeRange(this._badPercent, value / target, this._goodPercent);
		const r = Math.round(Fns.lerpRange(0xb3, percent, 0x46));
		const g = Math.round(Fns.lerpRange(0x46, percent, 0xb3));
		const b = Math.round(Fns.lerpRange(0x46, percent, 0x51));

		this.elm().style.backgroundColor = `rgb(${r.toString()}, ${g.toString()}, ${b.toString()})`;
	}
}