
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { LabelWrapper } from 'ui/wrapper/label_wrapper'

type HTMLFn = (current : number) => string;

export type LabelNumberOptions = {
	label: string;
	value : number;

	plus: (current : number) => void;
	minus: (current : number) => void;
	get: () => number;
	html? : HTMLFn;
}

export class LabelNumberWrapper extends LabelWrapper {

	private _settingElm : HTMLElement;
	private _numberElm : HTMLElement;
	private _number : number;
	private _htmlFn : HTMLFn;

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

		const plus = new ButtonWrapper();
		plus.elm().appendChild(Icon.create(IconType.ARROW_UP));
		plus.addOnClick(() => {
			options.plus(this.number())
			this.setNumber(options.get());
		});
		buttons.appendChild(plus.elm());

		const minus = new ButtonWrapper();
		minus.elm().appendChild(Icon.create(IconType.ARROW_DOWN));
		minus.addOnClick(() => {
			options.minus(this.number())
			this.setNumber(options.get());
		});
		buttons.appendChild(minus.elm());

		this._settingElm.appendChild(buttons);

		this._htmlFn = options.html ? options.html : (current : number) => { return "" + current; }		

		this.setName(options.label);
		this.setNumber(options.value);
	}

	number() : number { return this._number; }

	private setNumber(value : number) : void {
		this._numberElm.innerHTML = this._htmlFn(value);
		this._number = value;
	}
}