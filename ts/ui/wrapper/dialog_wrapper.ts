
import { ColorType } from 'game/factory/api'
import { ColorFactory } from 'game/factory/color_factory'

import { DialogMessage } from 'message/dialog_message'
import { GameMessage } from 'message/game_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { FooterWrapper } from 'ui/wrapper/footer_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { Optional } from 'util/optional'

type OnSubmitFn = () => void;

export abstract class DialogWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _submitTimeBuffer = 1500;

	private _visible : boolean;

	private _containerElm : HTMLElement;
	private _titleElm : HTMLElement;
	private _contentElm : HTMLElement;

	private _pages : Array<PageWrapper>;
	private _pageIndex : number;
	private _footer : FooterWrapper;

	private _submitted : boolean;
	private _submitTime : Optional<number>;
	private _onCancelFns : Array<OnSubmitFn>;
	private _onNextPageFns : Array<OnSubmitFn>;
	private _onSubmitFns : Array<OnSubmitFn>;

	constructor() {
		super(Html.div());

		this.elm().classList.add(Html.classDialog);
		this.elm().classList.add(Html.classDialogHide);
		this.elm().classList.add(Html.classPopup);
		this.elm().classList.add(Html.classPopupShow);

		this._visible = false;

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

		this._submitted = false;
		this._submitTime = new Optional();
		this._onCancelFns = new Array();
		this._onNextPageFns = new Array();
		this._onSubmitFns = new Array();
	}

	handleClientMessage(msg : GameMessage) : void {}

	show() : void {
		this._visible = true;
		setTimeout(() => {
			if (this._visible) {
				this.elm().classList.remove(Html.classDialogHide);
			}
			this.onShow();
		}, 5);
	}
	onShow() : void {}
	shrink() : void {
		this.elm().classList.add(Html.classDialogSmall);
	}
	hide() : void {
		this._visible = false;
		this.elm().classList.add(Html.classDialogHide);
	}
	visible() : boolean { return this._visible; }

	setTitle(text : string) : void {
		this._titleElm.textContent = text;
	}

	contentElm() : HTMLElement { return this._contentElm; }
	footerElm() : HTMLElement { return this._footer.elm(); }

	addPage() : PageWrapper {
		let page = new PageWrapper();

		this._pages.push(page);
		this._contentElm.appendChild(page.elm());

		if (this._pages.length > 1) {
			page.elm().style.display = "none";
		}
		return page;
	}

	addSubmitTimer(millis : number) : void {
		if (this._submitTime.has() || millis <= 0 || millis >= 999 * 1000) {
			return;
		}

		let timer = new ButtonWrapper();
		timer.setIcon(IconType.TIMER);
		timer.elm().style.float = "left";
		this.footerElm().appendChild(timer.elm());

		this._submitTime.set(Date.now() + millis);
		this.updateTimer(timer);
	}
	private updateTimer(timer : ButtonWrapper) : void {
		if (!this._submitTime.has()) {
			this.footerElm().removeChild(timer.elm());
			return;
		}

		const timeLeft = this._submitTime.get() - Date.now();
		timer.setText(Math.max(0, Math.ceil(timeLeft / 1000)) + "s");

		if (timeLeft <= -DialogWrapper._submitTimeBuffer) {
			this.forceSubmit();
			return;
		}

		setTimeout(() => {
			this.updateTimer(timer);
		}, 1000);
	}

	allowKeyboardSubmit() : void {
		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode === settings.chatKeyCode) {
				this.nextPage();
			}
		});
	}
	addOKButton() : ButtonWrapper {
		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setIcon(IconType.CHECK_CIRCLE);
		buttonWrapper.setText("OK");
		buttonWrapper.elm().style.float = "right";
		buttonWrapper.setHoverColor(ColorFactory.toString(ColorType.UI_GREEN));

		this.footerElm().appendChild(buttonWrapper.elm());
		return buttonWrapper;
	}
	addCancelButton() : ButtonWrapper {
		let buttonWrapper = new ButtonWrapper();
		buttonWrapper.setIcon(IconType.CANCEL);
		buttonWrapper.setText("Cancel");
		buttonWrapper.elm().style.float = "right";
		buttonWrapper.setHoverColor(ColorFactory.toString(ColorType.UI_RED));

		this.footerElm().appendChild(buttonWrapper.elm());

		return buttonWrapper;
	}

	addOnNextPage(fn : OnSubmitFn) : void { this._onNextPageFns.push(fn); }
	nextPage() : void {
		let currentPage = this._pages[this._pageIndex];

		if (!currentPage.canSubmit()) {
			return;
		}

		this._onNextPageFns.forEach((onNextPage : OnSubmitFn) => {
			onNextPage();
		});

		currentPage.submit();
		currentPage.elm().style.display = "none";

		if (this._pageIndex >= this._pages.length - 1) {
			this.submit();
			return;
		}

		this._pageIndex++;
		this._pages[this._pageIndex].elm().style.display = "block";
	}

	addOnSubmit(fn : OnSubmitFn) : void { this._onSubmitFns.push(fn); }
	submit() : void {
		if (this._submitted) {
			return;
		}

		this._submitTime.clear();
		this._onSubmitFns.forEach((onSubmit : OnSubmitFn) => {
			onSubmit();
		});
		this._submitted = true;
	}
	forceSubmit() : void {
		ui.showTooltip(TooltipType.FORCE_SUBMIT, {
			ttl: 3000,
		});
		this.submit();
	}

	addOnCancel(fn : OnSubmitFn) : void { this._onCancelFns.push(fn); }
	cancel() : void {
		this._onCancelFns.forEach((onCancel : OnSubmitFn) => {
			onCancel();
		});
	}
}