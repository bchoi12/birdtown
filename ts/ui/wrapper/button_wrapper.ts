
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

enum ButtonState {
	UNKNOWN,

	UNSPECIFIED,
	SELECTED,
	UNSELECTED,
}

type OnSelectFn = () => void;
type OnUnselectFn = () => void;

export class ButtonWrapper extends HtmlWrapper<HTMLElement> {

	private _group : number;
	private _id : number;
	private _state : ButtonState;
	private _onSelect : OnSelectFn;
	private _onUnselect : OnUnselectFn;

	constructor(id : number) {
		super(Html.button());

		this._id = id;
		this._state = ButtonState.UNSPECIFIED;
		this._onSelect = () => {};
		this._onUnselect = () => {};

		this.elm().onclick = (e) => {
			e.preventDefault();
			this.select();
		};
	}

	group() : number { return this._group; }
	id() : number { return this._id; }

	setOnSelect(fn : OnSelectFn) : void { this._onSelect = fn; }
	setOnUnselect(fn : OnUnselectFn) : void { this._onUnselect = fn; }

	select() : void {
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelect();
		this._state = ButtonState.SELECTED;
	}

	unselect() : void {
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselect();
		this._state = ButtonState.UNSELECTED;
	}
}