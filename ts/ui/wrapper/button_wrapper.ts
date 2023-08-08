
import { ui } from 'ui'
import { DialogButtonType, DialogButtonAction, DialogButtonOnSelectFn, DialogButtonOnUnselectFn } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

export type ButtonWrapperOptions = {
	type : DialogButtonType;
}

enum ButtonState {
	UNKNOWN,

	UNSPECIFIED,
	SELECTED,
	UNSELECTED,
}

export class ButtonWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _defaultText = new Map<DialogButtonType, string>([
		[DialogButtonType.IMAGE, "Image Button"],
	]);

	private _type : DialogButtonType;
	private _group : number;
	private _id : number;
	private _state : ButtonState;
	private _onSelect : Array<DialogButtonOnSelectFn>;
	private _onUnselect : Array<DialogButtonOnUnselectFn>;

	constructor(type : DialogButtonType, id : number) {
		super(Html.button());

		this._type = type;
		this._id = id;
		this._state = ButtonState.UNSPECIFIED;
		this._onSelect = new Array();
		this._onUnselect = new Array();

		if (ButtonWrapper._defaultText.has(this._type)) {
			this.elm().textContent = ButtonWrapper._defaultText.get(this._type);
		}

		this.elm().onclick = (e) => {
			this.select();
		};
	}

	group() : number { return this._group; }
	id() : number { return this._id; }

	addOnSelect(fn : DialogButtonOnSelectFn) : void {
		this._onSelect.push(fn);
	}

	addOnUnselect(fn : DialogButtonOnUnselectFn) : void {
		this._onUnselect.push(fn);
	}

	select() : void {
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelect.forEach((fn : DialogButtonOnSelectFn) => {
			fn();
		});
		this._state = ButtonState.SELECTED;
	}

	unselect() : void {
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselect.forEach((fn : DialogButtonOnUnselectFn) => {
			fn();
		});

		this._state = ButtonState.UNSELECTED;
	}
}