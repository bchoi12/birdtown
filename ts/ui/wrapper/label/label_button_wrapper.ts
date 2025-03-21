
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'
import { LabelWrapper } from 'ui/wrapper/label_wrapper'

export class LabelButtonWrapper extends LabelWrapper {

	protected _buttonTextElm : HTMLElement;

	constructor() {
		super();

		this.elm().classList.add(Html.classButton);

		this._buttonTextElm = this.addValueElm();
		this.elm().appendChild(this._buttonTextElm);
	}

	setButtonText(text : string) : void { this._buttonTextElm.textContent = text; }
	setButtonHTML(html : string) : void { this._buttonTextElm.innerHTML = html; }
}