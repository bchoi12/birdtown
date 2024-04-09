
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export class LabelButtonWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _labelCss = `
    	max-width: 66%;
    	white-space: nowrap;
    	overflow-x: hidden;
    	float: left;
	`

	private static readonly _textCss = `
    	max-width: 33%;
    	white-space: nowrap;
    	overflow-x: hidden;
    	float: right;
	`

	protected _labelElm : HTMLElement;
	protected _textElm : HTMLElement;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classSetting);
		this.elm().classList.add(Html.classButton);
		this.elm().style.display = "block";

		this._labelElm = Html.div();
		this._labelElm.style.cssText = LabelButtonWrapper._labelCss;
		this.elm().appendChild(this._labelElm);

		this._textElm = Html.div();
		this._textElm.style.cssText = LabelButtonWrapper._textCss;
		this.elm().appendChild(this._textElm);
	}

	setLabel(name : string) : void { this._labelElm.textContent = name; }
	setText(text : string) : void { this._textElm.textContent = text; }
}