
import { ui } from 'ui'
import { DialogButtonType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

type OnSubmitFn = () => {};

export class PageWrapper extends HtmlWrapper<HTMLElement> {

	private _buttonGroups : Map<number, Array<ButtonWrapper>>;
	private _lastGroupId : number;
	private _onSubmit : Array<OnSubmitFn>;

	constructor() {
		super(Html.div());

		this._buttonGroups = new Map();
		this._lastGroupId = 0;
		this._onSubmit = new Array();
	}

	addOnSubmit(fn : OnSubmitFn) : void {
		this._onSubmit.push(fn);
	}
	submit() : void {
		this._onSubmit.forEach((fn) => {
			fn();
		});
	}

	addGroup() : number {
		this._lastGroupId++;
		this._buttonGroups.set(this._lastGroupId, new Array())
		return this._lastGroupId;
	}

	addButton(group : number) : ButtonWrapper {
		if (!this._buttonGroups.has(group)) {
			console.error("Error: skipping attempt to add button to nonexistent group", group);
			return;
		}

		let button = new ButtonWrapper(DialogButtonType.SUBMIT, this._buttonGroups.get(group).length + 1);
		button.addOnSelect(() => {
			this._buttonGroups.get(group).forEach((otherButton : ButtonWrapper) => {
				if (button.id() === otherButton.id()) {
					return;
				}
				otherButton.unselect();
			});
		});

		this._buttonGroups.get(group).push(button);
		this.elm().appendChild(button.elm());

		return button;
	}
}