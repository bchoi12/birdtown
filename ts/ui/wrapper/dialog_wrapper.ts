
import { game } from 'game'

import { DialogMessage } from 'message/dialog_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { PageWrapper } from 'ui/wrapper/page_wrapper'

type OnSubmitFn = () => void;

export abstract class DialogWrapper extends HtmlWrapper<HTMLElement> {

	private _dialogType : DialogType;
	private _titleElm : HTMLElement;
	private _textElm : HTMLElement;
	private _pages : Array<PageWrapper>;
	private _pageIndex : number;

	private _onSubmitFns : Array<OnSubmitFn>;

	constructor(dialogType : DialogType) {
		super(Html.div());

		this._dialogType = dialogType;

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

		this.addOnSubmit(() => {
			game.clientDialog().submit(this._dialogType);
		});
	}

	protected dialogMessage() : DialogMessage { return game.clientDialog().message(this.dialogType()); }
	dialogType() : DialogType { return this._dialogType; }

	addPage() : PageWrapper {
		let page = new PageWrapper();

		if (this._pages.length > 0) {
			this._pages[this._pages.length - 1].setOnSubmit(() => { this.nextPage(); });
		}

		page.setOnSubmit(() => { this.submit(); });
		this._pages.push(page);
		this.elm().appendChild(page.elm());

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

	setTitle(title : string) : void { this._titleElm.innerHTML = title; }
	setText(text : string) : void { this._textElm.innerHTML = text; }

	addOnSubmit(fn : OnSubmitFn) : void { this._onSubmitFns.push(fn); }
	submit() : void {
		this._onSubmitFns.forEach((onSubmit) => {
			onSubmit();
		});
	}
}