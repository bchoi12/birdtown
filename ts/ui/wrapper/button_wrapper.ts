
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { Optional } from 'util/optional'

enum ButtonState {
	UNKNOWN,

	SELECTED,
	UNSELECTED,
}

type OnEventFn = () => void;

export class ButtonWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _defaultHoverColor = "#555";

	private _state : ButtonState;
	private _onClickFns : Array<OnEventFn>;
	private _onMouseEnterFns : Array<OnEventFn>;
	private _onMouseLeaveFns : Array<OnEventFn>;
	private _onSelectFns : Array<OnEventFn>;
	private _onUnselectFns : Array<OnEventFn>;
	private _iconElm : Optional<HTMLElement>;
	private _textElm : HTMLElement;
	private _hoverColor : string;

	constructor() {
		super(Html.div());

		this._state = ButtonState.UNKNOWN;
		this._onClickFns = new Array();
		this._onMouseEnterFns = new Array();
		this._onMouseLeaveFns = new Array();
		this._onSelectFns = new Array();
		this._onUnselectFns = new Array();
		this._iconElm = new Optional();
		this._textElm = Html.span();
		this._hoverColor = ButtonWrapper._defaultHoverColor;

		this.elm().appendChild(this._textElm);

		this.elm().classList.add(Html.classButton);
		this.elm().classList.add(Html.classNoSelect);
		this.elm().style.cursor = "auto";
		this.elm().onclick = (e) => {
			e.stopPropagation();
			e.preventDefault();
			this.click();
			this.select();
		};

		this.elm().onmouseenter = (e) => {
			e.preventDefault();
			this.mouseEnter();
		}

		this.elm().onmouseleave = (e) => {
			e.preventDefault();
			this.mouseLeave();
		}
	}

	icon() : HTMLElement { return this._iconElm.get(); }
	hasIcon() : boolean { return this._iconElm.has(); }
	setIcon(type : IconType) : void {
		let icon = Icon.create(type);

		if (this._textElm.textContent.length > 0) {
			icon.style.paddingRight = "0.2em";
		}

		if (!this._iconElm.has()) {
			this.elm().prepend(icon);
			this._iconElm.set(icon);
			return;
		}
		this._iconElm.get().innerHTML = icon.innerHTML;
	}
	clearIcon() : void {
		if (!this._iconElm.has()) {
			return;
		}
		this.elm().removeChild(this._iconElm.get());
		this._iconElm.clear();
	}
	overwriteHTML(html : string ) : void { this.elm().innerHTML = html; }
	setText(text : string) : void {
		this._textElm.textContent = text;

		if (this._textElm.textContent.length > 0 && this._iconElm.has()) {
			this._iconElm.get().style.paddingRight = "0.2em";
		}
	}
	setTextHTML(html : string) : void {
		this._textElm.innerHTML = html;

		if (this._textElm.textContent.length > 0 && this._iconElm.has()) {
			this._iconElm.get().style.paddingRight = "0.2em";
		}
	}

	addOnClick(fn : OnEventFn) : void {
		this.elm().style.cursor = "pointer";
		this._onClickFns.push(fn);
	}
	addOnMouseEnter(fn : OnEventFn) : void { this._onMouseEnterFns.push(fn); }
	addOnMouseLeave(fn : OnEventFn) : void { this._onMouseLeaveFns.push(fn); }
	addOnSelect(fn : OnEventFn) : void {
		this.elm().style.cursor = "pointer";
		this._onSelectFns.push(fn);
	}
	addOnUnselect(fn : OnEventFn) : void { this._onUnselectFns.push(fn); }

	click() : void {
		this._onClickFns.forEach((fn : OnEventFn) => {
			fn();
		});
	}
	setHoverColor(color : string) : void { this._hoverColor = color; }
	mouseEnter() : void {
	    this.elm().style.background = this._hoverColor;

		this._onMouseEnterFns.forEach((fn : OnEventFn) => {
			fn();
		});
	}
	mouseLeave() : void {
	    this.elm().style.background = "";

		this._onMouseLeaveFns.forEach((fn : OnEventFn) => {
			fn();
		})
	}

	selected() : boolean { return this._state === ButtonState.SELECTED; }
	select() : void {
		if (this._onSelectFns.length === 0 && this._onUnselectFns.length === 0) {
			return;
		}
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelectFns.forEach((fn : OnEventFn) => {
			fn();
		});
		this._state = ButtonState.SELECTED;
		this.elm().classList.add(Html.classButtonSelected);
	}

	unselect() : void {
		if (this._onSelectFns.length === 0 && this._onUnselectFns.length === 0) {
			return;
		}
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselectFns.forEach((fn : OnEventFn) => {
			fn();
		});
		this._state = ButtonState.UNSELECTED;
		this.elm().classList.remove(Html.classButtonSelected);
	}
}