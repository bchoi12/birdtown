
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export abstract class LabelWrapper extends HtmlWrapper<HTMLElement> {

	protected _labelElm : HTMLElement;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classSetting);
		this.elm().classList.add(Html.classButton);
		this.elm().style.display = "block";

		this._labelElm = Html.div();
		this._labelElm.classList.add(Html.classSettingLabel);
		this.elm().appendChild(this._labelElm);
	}

	setLabel(name : string) : void { this._labelElm.textContent = name; }
}