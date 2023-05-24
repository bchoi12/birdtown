
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

type OnSubmitFn = () => void;

export class DialogWrapper extends HtmlWrapper {

	private _titleElm : HTMLElement;
	private _textElm : HTMLElement;

	private _onSubmitFns : Array<OnSubmitFn>;

	constructor() {
		super(Html.div());

		this.elm().classList.add("dialog");

		this._titleElm = Html.div();
		this._titleElm.classList.add("dialog-title");
		this.elm().appendChild(this._titleElm);

		this._textElm = Html.div();
		this._textElm.classList.add("dialog-text");
		this.elm().appendChild(this._textElm);

		this._onSubmitFns = new Array();

		this.elm().onclick = (e) => {
			this._onSubmitFns.forEach((onSubmit) => {
				onSubmit();
			});
		};
	}

	setTitle(title : string) : void { this._titleElm.innerHTML = title; }
	setText(text : string) : void { this._textElm.innerHTML = text; }

	onSubmit(fn : OnSubmitFn) : void { this._onSubmitFns.push(fn); }
}