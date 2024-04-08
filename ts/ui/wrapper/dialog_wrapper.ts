
import { game } from 'game'

import { DialogMessage } from 'message/dialog_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { FooterWrapper } from 'ui/wrapper/footer_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

type OnSubmitFn = () => void;

export class DialogWrapper extends HtmlWrapper<HTMLElement> {

	private _containerElm : HTMLElement;
	private _titleElm : HTMLElement;
	private _contentElm : HTMLElement;

	private _pages : Array<PageWrapper>;
	private _pageIndex : number;
	private _footer : FooterWrapper;

	private _onSubmitFns : Array<OnSubmitFn>;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classDialog);

		this._containerElm = Html.div();
		this._containerElm.classList.add(Html.classDialogContainer);
		this.elm().appendChild(this._containerElm);

		this._titleElm = Html.div();
		this._titleElm.classList.add(Html.classDialogTitle);
		this._containerElm.appendChild(this._titleElm);

		this._contentElm = Html.div();
		this._containerElm.appendChild(this._contentElm);

		this._footer = new FooterWrapper();
		this._containerElm.appendChild(this._footer.elm());

		this._pages = new Array();
		this._pageIndex = 0;

		this._onSubmitFns = new Array();
	}

	titleElm() : HTMLElement { return this._titleElm; }
	contentElm() : HTMLElement { return this._contentElm; }
	footer() : FooterWrapper { return this._footer; }

	addPage() : PageWrapper {
		let page = new PageWrapper();

		if (this._pages.length > 0) {
			this._pages[this._pages.length - 1].setOnSubmit(() => { this.nextPage(); });
		}

		page.setOnSubmit(() => { this.submit(); });
		this._pages.push(page);
		this._contentElm.appendChild(page.elm());

		if (this._pages.length > 1) {
			page.elm().style.display = "none";
		}
		return page;
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

	addOnSubmit(fn : OnSubmitFn) : void { this._onSubmitFns.push(fn); }
	submit() : void {
		this._onSubmitFns.forEach((onSubmit) => {
			onSubmit();
		});
	}
}