
import { ui } from 'ui'
import { Icon, IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { LabelWrapper } from 'ui/wrapper/label_wrapper'

type GetFn = () => number;
type ChangeFn = (current : number) => void;
type HTMLFn = (current : number) => string;

export type LabelNumberOptions = {
	label: string;
	value : number;

	plus: ChangeFn;
	minus: ChangeFn;
	get: GetFn;
	html? : HTMLFn;
}

export class LabelNumberWrapper extends LabelWrapper {

	private _settingElm : HTMLElement;
	private _numberElm : HTMLElement;
	private _number : number;
	private _plusFn : ChangeFn;
	private _minusFn : ChangeFn;
	private _getFn : GetFn;
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

		this._plusFn = options.plus;
		this._minusFn = options.minus;
		this._getFn = options.get;

		const buttons = Html.span();
		buttons.style.fontSize = "0.8em";

		const minus = new ButtonWrapper();
		minus.elm().appendChild(Icon.create(IconType.MINUS));
		minus.addOnClick(() => {
			this._minusFn(this.number())
			this.setNumber(this._getFn());
		});
		buttons.appendChild(minus.elm());

		const plus = new ButtonWrapper();
		plus.elm().appendChild(Icon.create(IconType.PLUS));
		plus.addOnClick(() => {
			this._plusFn(this.number())
			this.setNumber(this._getFn());
		});
		buttons.appendChild(plus.elm());

		this._settingElm.appendChild(buttons);

		this._htmlFn = options.html ? options.html : (current : number) => { return "" + current; }		

		this.setName(options.label);
		this.setNumber(options.value);
	}

	number() : number { return this._number; }

	refresh() : void {
		this.setNumber(this._getFn())
	}

	private setNumber(value : number) : void {
		this._numberElm.innerHTML = this._htmlFn(value);
		this._number = value;
	}
}