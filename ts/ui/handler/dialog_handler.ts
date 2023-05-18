
import { options } from 'options'

import { ui } from 'ui'
import { UiMode, DialogMsg } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'

export class DialogHandler extends HandlerBase implements Handler {

	private _dialogsElm : HTMLElement;
	private _dialogs : Array<DialogWrapper>;

	constructor() {
		super(HandlerType.DIALOGS);

		this._dialogsElm = Html.elm(Html.divDialogs);
		this._dialogs = new Array();
	}

	setup() : void {}

	reset() : void {}

	setMode(mode : UiMode) : void {}

	pushDialog(msg : DialogMsg) : void {
		const dialog = new DialogWrapper();

		dialog.setTitle("TITLE");
		dialog.setText("testing " + Math.floor(Math.random() * 999));

		if (msg.onSubmit) {
			dialog.onSubmit(msg.onSubmit);
		}

		dialog.onSubmit(() => {
			this.popDialog(dialog);
		});

		this._dialogs.push(dialog);

		dialog.hide();
		this._dialogsElm.appendChild(dialog.elm());

		this.showDialog();
	}

	popAll() : void {
		while(this._dialogs.length > 0) {
			this.popDialog(this._dialogs.pop());
		}
	}

	popDialog(dialog : DialogWrapper) : void {
		this._dialogsElm.removeChild(dialog.elm());
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