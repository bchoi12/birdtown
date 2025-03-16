
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { LabelWrapper } from 'ui/wrapper/label_wrapper'

export class LabelInputWrapper extends LabelWrapper {

	protected _inputElm : HTMLInputElement;

	constructor() {
		super();

		this._inputElm = this.addInputElm();
		this._inputElm.type = "text";
		this.elm().appendChild(this._inputElm);
	}

	inputElm() : HTMLInputElement { return this._inputElm; }
	setValue(value : string) : void { this._inputElm.value = value; }
	value() : string { return this._inputElm.value; }
	clear() : void { this._inputElm.value = ""; }
}