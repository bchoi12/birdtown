
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { LabelWrapper } from 'ui/wrapper/label_wrapper'

export type LabelNumberOptions = {
	label: string;
	value : number;

	plus: (current : number) => number;
	minus: (current : number) => number;
}

export class LabelNumberWrapper extends LabelWrapper {

	private _settingElm : HTMLElement;
	private _numberElm : HTMLElement;
	private _number : number;

	constructor(options : LabelNumberOptions) {
		super();

		this._settingElm = this.addValueElm();
		this.elm().appendChild(this._settingElm);

		this._numberElm = Html.span();
		this._settingElm.appendChild(this._numberElm);

		const separator = Html.span();
		separator.innerHTML = "&nbsp;&nbsp;|&nbsp;";
		this._settingElm.appendChild(separator);

		const buttons = Html.span();
		buttons.style.fontSize = "0.8em";

		const minus = new ButtonWrapper();
		minus.elm().appendChild(Icon.create(IconType.MINUS));
		minus.addOnClick(() => {
			this.setNumber(options.minus(this.number()));
		});
		buttons.appendChild(minus.elm());

		const plus = new ButtonWrapper();
		plus.elm().appendChild(Icon.create(IconType.PLUS));
		plus.addOnClick(() => {
			this.setNumber(options.plus(this.number()));
		});
		buttons.appendChild(plus.elm());

		this._settingElm.appendChild(buttons);

		this.setName(options.label);
		this.setNumber(options.value);
	}

	number() : number { return this._number; }
	setNumber(value : number) : void {
		this._numberElm.textContent = "" + value;
		this._number = value;
	}
}