
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { Icon, IconType } from 'ui/common/icon'

import { Optional } from 'util/optional'

enum ButtonState {
	UNKNOWN,

	SELECTED,
	UNSELECTED,
}

type OnClickFn = () => void;

export class ButtonWrapper extends HtmlWrapper<HTMLElement> {

	private _state : ButtonState;
	private _onClickFns : Array<OnClickFn>;
	private _onSelectFns : Array<OnClickFn>;
	private _onUnselectFns : Array<OnClickFn>;
	private _iconElm : Optional<HTMLElement>;
	private _textElm : HTMLElement;

	constructor() {
		super(Html.div());

		this._state = ButtonState.UNKNOWN;
		this._onClickFns = new Array();
		this._onSelectFns = new Array();
		this._onUnselectFns = new Array();
		this._iconElm = new Optional();
		this._textElm = Html.span();

		this.elm().appendChild(this._textElm);

		this.elm().classList.add(Html.classButton);
		this.elm().classList.add(Html.classNoSelect);
		this.elm().onclick = (e) => {
			e.preventDefault();
			this.click();
			this.select();
		};
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
	setHtml(html : string ) : void { this.elm().innerHTML = html; }
	setText(text : string) : void {
		this._textElm.textContent = text;

		if (this._textElm.textContent.length > 0 && this._iconElm.has()) {
			this._iconElm.get().style.paddingRight = "0.2em";
		}
	}

	addOnClick(fn : OnClickFn) : void { this._onClickFns.push(fn); }
	addOnSelect(fn : OnClickFn) : void { this._onSelectFns.push(fn); }
	addOnUnselect(fn : OnClickFn) : void { this._onUnselectFns.push(fn); }

	click() : void {
		this._onClickFns.forEach((fn : OnClickFn) => {
			fn();
		});
	}

	selected() : boolean { return this._state === ButtonState.SELECTED; }
	select() : void {
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelectFns.forEach((fn : OnClickFn) => {
			fn();
		});
		this._state = ButtonState.SELECTED;
		this.elm().classList.add(Html.classButtonSelected);
	}

	unselect() : void {
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselectFns.forEach((fn : OnClickFn) => {
			fn();
		});
		this._state = ButtonState.UNSELECTED;
		this.elm().classList.remove(Html.classButtonSelected);
	}
}