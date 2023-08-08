
import { ui } from 'ui'
import { Html, HtmlWrapper } from 'ui/html'

import { PageWrapper } from 'ui/wrapper/page_wrapper'

type OnSubmitFn = () => void;

export class DialogWrapper extends HtmlWrapper<HTMLElement> {

	private _titleElm : HTMLElement;
	private _textElm : HTMLElement;
	private _pages : Array<PageWrapper>;
	private _pageIndex : number;

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

		this._pages = new Array();
		this._pageIndex = 0;

		this._onSubmitFns = new Array();
	}

	addPage(page : PageWrapper) : void {
		this._pages.push(page);
		this.elm().appendChild(page.elm());

		if (this._pages.length > 1) {
			page.elm().style.display = "none";
		}
	}
	nextPage() : void {
		if (this._pageIndex >= this._pages.length - 1) {
			this.submit();
			return;
		}

		let currentPage = this._pages[this._pageIndex];
		currentPage.elm().style.display = "none";

		this._pageIndex++;
		this._pages[this._pageIndex].elm().style.display = "block";
	}

	setTitle(title : string) : void { this._titleElm.innerHTML = title; }
	setText(text : string) : void { this._textElm.innerHTML = text; }

	addOnSubmit(fn : OnSubmitFn) : void { this._onSubmitFns.push(fn); }
	submit() : void {
		this._onSubmitFns.forEach((onSubmit) => {
			onSubmit();
		});
	}
}