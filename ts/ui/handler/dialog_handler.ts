
import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, DialogButtonAction, DialogPage } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
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

	override clear() : void {
		super.clear();

		while(this._dialogs.length > 0) {
			this.popDialog(this._dialogs.pop());
		}
	}

	override handleMessage(msg : UiMessage) : void {
		super.handleMessage(msg);

		if (msg.type() !== UiMessageType.DIALOG) {
			return;
		}

		const dialogWrapper = new DialogWrapper();

		dialogWrapper.setTitle("Message");
		if (msg.hasPages()) {
			const dialogPages = msg.getPages();

			for (let i = 0; i < dialogPages.length; ++i) {
				let page = dialogPages[i];
				let pageWrapper = new PageWrapper();
				let groupIndex = pageWrapper.addGroup();
				for (let button of page.buttons) {

					let buttonWrapper = pageWrapper.addButton(groupIndex, button);
					buttonWrapper.elm().textContent = button.title;

					if (defined(button.onSelect)) {
						buttonWrapper.addOnSelect(button.onSelect);
					}
					if (defined(button.onUnselect)) {
						buttonWrapper.addOnUnselect(button.onUnselect);
					}

					if (button.action === DialogButtonAction.UNSELECT_GROUP) {
						buttonWrapper.addOnSelect(() => {
							pageWrapper.getGroup(groupIndex).forEach((otherWrapper : ButtonWrapper) => {
								if (buttonWrapper.id() === otherWrapper.id()) {
									return;
								}
								otherWrapper.unselect();
							});
						});
					} else if (button.action === DialogButtonAction.SUBMIT) {
						buttonWrapper.addOnSelect(() => {
							pageWrapper.submit();
						});
					}
				}
				dialogWrapper.addPage(pageWrapper);

				// Submit dialog after last page is submitted.
				pageWrapper.addOnSubmit(() => {
					dialogWrapper.nextPage();
				});
			}

			if (msg.hasOnSubmit()) {
				dialogWrapper.addOnSubmit(msg.getOnSubmit());
			}
		}

		dialogWrapper.addOnSubmit(() => {
			this.popDialog(dialogWrapper);
		});

		this._dialogs.push(dialogWrapper);

		dialogWrapper.display("none");
		this._dialogsElm.appendChild(dialogWrapper.elm());

		this.showDialog();
	}

	popDialog(dialogWrapper : DialogWrapper) : void {
		if (this._dialogsElm.contains(dialogWrapper.elm())) {
			this._dialogsElm.removeChild(dialogWrapper.elm());
		}
		this._dialogs.pop();
		this.showDialog();
	}

	showDialog() : void {
		if (this._dialogs.length === 0) {
			return;
		}

		this._dialogs[this._dialogs.length - 1].display("block");
	}
}