
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

enum ButtonState {
	UNKNOWN,

	SELECTED,
	UNSELECTED,
}

type OnSelectFn = () => void;
type OnUnselectFn = () => void;

export class ButtonWrapper extends HtmlWrapper<HTMLElement> {

	private _id : number;
	private _state : ButtonState;
	private _onSelectFns : Array<OnSelectFn>;
	private _onUnselectFns : Array<OnUnselectFn>;

	constructor(id : number) {
		super(Html.button());

		this._id = id;
		this._state = ButtonState.UNKNOWN;
		this._onSelectFns = new Array();
		this._onUnselectFns = new Array();

		this.elm().onclick = (e) => {
			e.preventDefault();
			this.select();
		};
	}

	id() : number { return this._id; }

	addOnSelect(fn : OnSelectFn) : void { this._onSelectFns.push(fn); }
	addOnUnselect(fn : OnUnselectFn) : void { this._onUnselectFns.push(fn); }

	select() : void {
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelectFns.forEach((fn : OnSelectFn) => {
			fn();
		});
		this._state = ButtonState.SELECTED;
	}

	unselect() : void {
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselectFns.forEach((fn : OnUnselectFn) => {
			fn();
		});
		this._state = ButtonState.UNSELECTED;
	}
}