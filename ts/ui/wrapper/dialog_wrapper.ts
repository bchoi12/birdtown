
import { game } from 'game'

import { DialogMessage } from 'message/dialog_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
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

	private _onCancelFns : Array<OnSubmitFn>;
	private _onNextPageFns : Array<OnSubmitFn>;
	private _onSubmitFns : Array<OnSubmitFn>;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classDialog);
		this.elm().classList.add(Html.classPopup);

		this._containerElm = Html.div();
		this._containerElm.classList.add(Html.classDialogContainer);
		this.elm().appendChild(this._containerElm);

		this._titleElm = Html.div();
		this._titleElm.classList.add(Html.classDialogTitle);
		this._containerElm.appendChild(this._titleElm);

		this._contentElm = Html.div();
		this._contentElm.classList.add(Html.classDialogContent);
		this._containerElm.appendChild(this._contentElm);

		this._footer = new FooterWrapper();
		this._containerElm.appendChild(this._footer.elm());

		this._pages = new Array();
		this._pageIndex = 0;

		this._onCancelFns = new Array();
		this._onNextPageFns = new Array();
		this._onSubmitFns = new Array();
	}

	show() : void {
		setTimeout(() => {
			this.elm().classList.add(Html.classPopupShow);
		}, 5);
	}
	hide() : void {
		this.elm().classList.remove(Html.classPopupShow);
	}

	titleElm() : HTMLElement { return this._titleElm; }
	contentElm() : HTMLElement { return this._contentElm; }
	footerElm() : HTMLElement { return this._footer.elm(); }

	addPage() : PageWrapper {
		let page = new PageWrapper();

		this._pages.push(page);
		this._contentElm.appendChild(page.elm());

		if (this._pages.length > 1) {
			page.elm().style.visibility = "hidden";
		}
		return page;
	}

	addOKButton() : ButtonWrapper {
		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setIcon(IconType.CHECK);
		buttonWrapper.setText("OK");
		buttonWrapper.elm().style.float = "right";

		this.footerElm().appendChild(buttonWrapper.elm());

		return buttonWrapper;
	}
	addCancelButton() : ButtonWrapper {
		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setIcon(IconType.CANCEL);
		buttonWrapper.setText("Cancel");
		buttonWrapper.elm().style.float = "right";

		this.footerElm().appendChild(buttonWrapper.elm());

		return buttonWrapper;
	}

	addOnNextPage(fn : OnSubmitFn) : void { this._onNextPageFns.push(fn); }
	nextPage() : void {
		this._onNextPageFns.forEach((onNextPage : OnSubmitFn) => {
			onNextPage();
		});

		let currentPage = this._pages[this._pageIndex];
		currentPage.submit();
		currentPage.elm().style.visibility = "hidden";

		if (this._pageIndex >= this._pages.length - 1) {
			this.submit();
			return;
		}

		this._pageIndex++;
		this._pages[this._pageIndex].elm().style.visibility = "visible";
	}

	addOnSubmit(fn : OnSubmitFn) : void { this._onSubmitFns.push(fn); }
	submit() : void {
		this._onSubmitFns.forEach((onSubmit : OnSubmitFn) => {
			onSubmit();
		});
	}

	addOnCancel(fn : OnSubmitFn) : void { this._onCancelFns.push(fn); }
	cancel() : void {
		this._onCancelFns.forEach((onCancel : OnSubmitFn) => {
			onCancel();
		});
	}
}