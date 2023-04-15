
import { options } from 'options'

import { ui } from 'ui'
import { HandlerType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { DialogWrapper, DialogWrapperOptions } from 'ui/wrapper/dialog_wrapper'

export class DialogHandler extends HandlerBase implements Handler {

	private _dialogsElm : HTMLElement;
	private _dialogs : Array<DialogWrapper>;
	private _dialogCounter : number;

	constructor() {
		super(HandlerType.DIALOGS);

		this._dialogsElm = Html.elm(Html.divDialogs);
		this._dialogs = new Array();
		this._dialogCounter = 0;
	}

	setup() : void {}

	reset() : void {}

	setMode(mode : UiMode) : void {}

	pushDialog(dialogOptions : DialogWrapperOptions) : number {
		dialogOptions.onSubmit.push((dialog : DialogWrapper) => {
			this.popDialog(dialog);
		});

		const dialog = new DialogWrapper(dialogOptions);

		this._dialogs = [];
		this._dialogs.push(dialog);

		this.showDialog();

		this._dialogCounter++;
		return this._dialogCounter;
	}

	popAll() : void {
		while(this._dialogs.length > 0) {
			this.popDialog(this._dialogs.pop());
		}
	}

	popDialog(dialog : DialogWrapper) : void {
		this._dialogsElm.removeChild(dialog.elm());
	}

	showDialog() : void {
		if (this._dialogs.length === 0) {
			return;
		}

		this._dialogs[0].show();
		this._dialogsElm.appendChild(this._dialogs[0].elm());
	}
}