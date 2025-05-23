
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export abstract class LabelWrapper extends HtmlWrapper<HTMLElement> {

	protected _nameElm : HTMLElement;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classLabel);
		this.elm().classList.add(Html.classNoSelect);

		this._nameElm = Html.div();
		this._nameElm.classList.add(Html.classLabelName);
		this.elm().appendChild(this._nameElm);
	}

	setName(name : string) : void { this._nameElm.textContent = name; }
	setNameHTML(html : string) : void { this._nameElm.innerHTML = html; }
	addValueElm() : HTMLElement {
		let elm = Html.div();
		elm.classList.add(Html.classLabelValue);
		this.elm().appendChild(elm);
		return elm;
	}

	addInputElm() : HTMLInputElement {
		let elm = Html.input();
		elm.classList.add(Html.classLabelInput);
		this.elm().appendChild(elm);
		return elm;
	}
}