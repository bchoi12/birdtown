
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
	private _valueElm : HTMLElement;
	private _value : number;

	constructor(options : LabelNumberOptions) {
		super();

		this._settingElm = Html.div();
		this._settingElm.classList.add(Html.classSettingValue);
		this.elm().appendChild(this._settingElm);

		this._valueElm = Html.span();
		this._settingElm.appendChild(this._valueElm);

		const separator = Html.span();
		separator.innerHTML = "&nbsp;&nbsp;|&nbsp;";
		this._settingElm.appendChild(separator);

		const buttons = Html.span();
		buttons.style.fontSize = "0.8em";

		const minus = new ButtonWrapper();
		minus.elm().appendChild(Icon.create(IconType.MINUS));
		minus.addOnClick(() => {
			this.setValue(options.minus(this.value()));
		});
		buttons.appendChild(minus.elm());

		const plus = new ButtonWrapper();
		plus.elm().appendChild(Icon.create(IconType.PLUS));
		plus.addOnClick(() => {
			this.setValue(options.plus(this.value()));
		});
		buttons.appendChild(plus.elm());

		this._settingElm.appendChild(buttons);

		this.setLabel(options.label);
		this.setValue(options.value);
	}

	value() : number { return this._value; }
	setValue(value : number) : void {
		this._valueElm.textContent = "" + value;
		this._value = value;
	}
}