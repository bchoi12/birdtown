
import { UiMessage, UiMessageType, UiProp } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, DialogPage } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { defined } from 'util/common'

export class DialogHandler extends HandlerBase implements Handler {

	private _dialogsElm : HTMLElement;
	private _dialogs : Array<DialogWrapper>;

	constructor() {
		super(HandlerType.DIALOGS);

		this._dialogsElm = Html.elm(Html.divDialogs);
		this._dialogs = new Array();
	}

	override handleMessage(msg : UiMessage) : void {
		if (msg.type() !== UiMessageType.DIALOG) {
			return;
		}

		const dialogWrapper = new DialogWrapper();

		dialogWrapper.setTitle("Message");
		if (msg.hasProp(UiProp.PAGES)) {
			for (let page of msg.getProp<Array<DialogPage>>(UiProp.PAGES)) {
				let pageWrapper = new PageWrapper();

				let group = pageWrapper.addGroup();
				for (let button of page.buttons) {
					let buttonWrapper = pageWrapper.addButton(group);
					buttonWrapper.elm().textContent = "button";

					if (defined(button.onSelect)) {
						buttonWrapper.addOnSelect(button.onSelect);
					}
					if (defined(button.onUnselect)) {
						buttonWrapper.addOnUnselect(button.onUnselect);
					}
				}

				dialogWrapper.addPage(pageWrapper);
			}

			if (msg.hasProp(UiProp.ON_SUBMIT)) {
				dialogWrapper.addOnSubmit(msg.getProp(UiProp.ON_SUBMIT));
			}
		}

		dialogWrapper.addOnSubmit(() => {
			this.popDialog(dialogWrapper);
		});

		this._dialogs.push(dialogWrapper);

		dialogWrapper.hide();
		this._dialogsElm.appendChild(dialogWrapper.elm());

		this.showDialog();
	}

	popAll() : void {
		while(this._dialogs.length > 0) {
			this.popDialog(this._dialogs.pop());
		}
	}

	popDialog(dialogWrapper : DialogWrapper) : void {
		this._dialogsElm.removeChild(dialogWrapper.elm());
		this._dialogs.pop();

		this.showDialog();
	}

	showDialog() : void {
		if (this._dialogs.length === 0) {
			return;
		}

		this._dialogs[this._dialogs.length - 1].show();
	}
}