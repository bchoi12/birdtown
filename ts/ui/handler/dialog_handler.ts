
import { UiMessage, UiMessageType } from 'message/ui_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, DialogType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { LoadoutDialogWrapper } from 'ui/wrapper/dialog/loadout_dialog_wrapper'
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

		let dialogWrapper;

		switch (msg.getDialogType()) {
		case DialogType.LOADOUT:
			dialogWrapper = new LoadoutDialogWrapper();
			dialogWrapper.setTitle("Pick Your Loadout");
			break;
		default:
			console.error("Error: not showing unknown dialog type", DialogType[msg.getDialogType()], msg);
			return;
		}

		dialogWrapper.addOnSubmit(() => {
			this.popDialog(dialogWrapper);
		});
		dialogWrapper.display("none");

		this._dialogs.push(dialogWrapper);
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