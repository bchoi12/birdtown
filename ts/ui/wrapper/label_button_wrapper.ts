
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { LabelWrapper } from 'ui/wrapper/label_wrapper'

export class LabelButtonWrapper extends LabelWrapper {

	protected _textElm : HTMLElement;

	constructor() {
		super();

		this._textElm = Html.div();
		this._textElm.classList.add(Html.classSettingValue);
		this.elm().appendChild(this._textElm);
	}
	setText(text : string) : void { this._textElm.textContent = text; }
}