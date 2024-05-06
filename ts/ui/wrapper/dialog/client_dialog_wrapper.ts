
import { game } from 'game'

import { DialogMessage } from 'message/dialog_message'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'

import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'

export abstract class ClientDialogWrapper extends DialogWrapper {

	private _dialogType : DialogType;

	constructor(dialogType : DialogType) {
		super();

		this._dialogType = dialogType;

		this.addOnSubmit(() => {
			game.clientDialog().submit(this._dialogType);
		});
	}

	dialogMessage() : DialogMessage { return game.clientDialog().message(this.dialogType()); }
	dialogType() : DialogType { return this._dialogType; }
}