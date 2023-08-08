
import { ui } from 'ui'
import { DialogButton, DialogButtonType, DialogButtonAction } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

type OnSubmitFn = () => void;

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

	addButton(group : number, button : DialogButton) : ButtonWrapper {
		if (!this._buttonGroups.has(group)) {
			console.error("Error: skipping attempt to add button to nonexistent group", group);
			return;
		}

		let buttonWrapper = new ButtonWrapper(button.type, this._buttonGroups.get(group).length + 1);

		if (button.action === DialogButtonAction.UNSELECT_GROUP) {
			buttonWrapper.addOnSelect(() => {
				this._buttonGroups.get(group).forEach((otherWrapper : ButtonWrapper) => {
					if (buttonWrapper.id() === otherWrapper.id()) {
						return;
					}
					otherWrapper.unselect();
				});
			});
		} else if (button.action === DialogButtonAction.SUBMIT) {
			buttonWrapper.addOnSelect(() => {
				this.submit();
			});
		}

		this._buttonGroups.get(group).push(buttonWrapper);
		this.elm().appendChild(buttonWrapper.elm());

		return buttonWrapper;
	}
}