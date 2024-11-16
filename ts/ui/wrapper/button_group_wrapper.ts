
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ButtonGroupWrapper<T extends ButtonWrapper> extends HtmlWrapper<HTMLElement> {

	private _buttons : Array<T>;

	constructor() {
		super(Html.div());

		this._buttons = new Array();
	}

	buttons() : Array<T> { return this._buttons; }

	addButton(button : T) : T {
		button.addOnSelect(() => {
			this._buttons.forEach((button : T) => {
				button.unselect();
			});
		});
		this._buttons.push(button);
		this.elm().appendChild(button.elm());
		return button;
	}
}