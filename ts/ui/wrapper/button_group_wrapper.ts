
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { ButtonSelectWrapper } from 'ui/wrapper/button/button_select_wrapper'

export class ButtonGroupWrapper extends HtmlWrapper<HTMLElement> {

	private _buttonSelectWrappers : Array<ButtonSelectWrapper>;

	constructor() {
		super(Html.div());

		this._buttonSelectWrappers = new Array();
	}

	addButton() : ButtonWrapper {
		let button = new ButtonWrapper();
		this.elm().appendChild(button.elm());
		return button;
	}

	addButtonSelect() : ButtonSelectWrapper {
		let button = new ButtonSelectWrapper();

		button.addOnSelect(() => {
			this._buttonSelectWrappers.forEach((button : ButtonSelectWrapper) => {
				button.unselect();
			});
		});
		this._buttonSelectWrappers.push(button);
		this.elm().appendChild(button.elm());
		return button;
	}
}