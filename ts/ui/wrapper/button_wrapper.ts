
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

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

	constructor() {
		super(Html.div());

		this._state = ButtonState.UNKNOWN;
		this._onClickFns = new Array();
		this._onSelectFns = new Array();
		this._onUnselectFns = new Array();

		this.elm().classList.add(Html.classButton);
		this.elm().onclick = (e) => {
			e.preventDefault();
			this.click();
			this.select();
		};
	}

	setText(text : string) : void {
		this.elm().textContent = "[" + text + "]";
	}

	addOnClick(fn : OnClickFn) : void { this._onClickFns.push(fn); }
	addOnSelect(fn : OnClickFn) : void { this._onSelectFns.push(fn); }
	addOnUnselect(fn : OnClickFn) : void { this._onUnselectFns.push(fn); }

	click() : void {
		this._onClickFns.forEach((fn : OnClickFn) => {
			fn();
		});
	}

	select() : void {
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelectFns.forEach((fn : OnClickFn) => {
			fn();
		});
		this._state = ButtonState.SELECTED;
	}

	unselect() : void {
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselectFns.forEach((fn : OnClickFn) => {
			fn();
		});
		this._state = ButtonState.UNSELECTED;
	}
}