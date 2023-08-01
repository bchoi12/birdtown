
import { ui } from 'ui'
import { DialogButtonType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

export type ButtonWrapperOptions = {
	type : DialogButtonType;
}

type OnSelectFn = () => void;
type OnUnselectFn = () => void;

enum ButtonState {
	UNKNOWN,

	UNSPECIFIED,
	SELECTED,
	UNSELECTED,
}

export class ButtonWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _defaultText = new Map<DialogButtonType, string>([
		[DialogButtonType.BACK, "Back"],
		[DialogButtonType.NEXT, "Next"],
		[DialogButtonType.SUBMIT, "Submit"],
	]);

	private _type : DialogButtonType;
	private _id : number;
	private _state : ButtonState;
	private _onSelect : Array<OnSelectFn>;
	private _onUnselect : Array<OnUnselectFn>;

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

	id() : number { return this._id; }

	addOnSelect(fn : OnSelectFn) : void {
		this._onSelect.push(fn);
	}

	addOnUnselect(fn : OnUnselectFn) : void {
		this._onUnselect.push(fn);
	}

	select() : void {
		if (this._state === ButtonState.SELECTED) {
			return;
		}

		this._onSelect.forEach((fn : OnSelectFn) => {
			fn();
		});
		this._state = ButtonState.SELECTED;
	}

	unselect() : void {
		if (this._state !== ButtonState.SELECTED) {
			return;
		}

		this._onUnselect.forEach((fn : OnUnselectFn) => {
			fn();
		});

		this._state = ButtonState.UNSELECTED;
	}
}