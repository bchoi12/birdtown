
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

export type DialogWrapperOptions = {
	titleHtml : string;
	textHtml : string;

	onSubmit: Array<(dialog : DialogWrapper) => void>;
}

export class DialogWrapper extends HtmlWrapper {

	private _titleElm : HTMLElement;
	private _textElm : HTMLElement;

	constructor(options : DialogWrapperOptions) {
		super(Html.div());

		this.elm().classList.add("dialog");

		this._titleElm = Html.div();
		this._titleElm.classList.add("dialog-title");
		this._titleElm.innerHTML = options.titleHtml;
		this.elm().appendChild(this._titleElm);

		this._textElm = Html.div();
		this._textElm.classList.add("dialog-text");
		this._textElm.innerHTML = options.textHtml;
		this.elm().appendChild(this._textElm);

		this.elm().onclick = (e) => {
			options.onSubmit.forEach((fn) => {
				fn(this);
			});
		};
	}

	show() : void {
		this.elm().style.display = "block";
	}
}