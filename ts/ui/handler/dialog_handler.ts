
import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, DialogType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { InitDialogWrapper } from 'ui/wrapper/dialog/client/init_dialog_wrapper'
import { LoadoutDialogWrapper } from 'ui/wrapper/dialog/client/loadout_dialog_wrapper'
import { StartGameDialogWrapper } from 'ui/wrapper/dialog/start_game_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class DialogHandler extends HandlerBase implements Handler {

	private static readonly _createDialogFns = new Map<DialogType, () => DialogWrapper>([
		[DialogType.INIT, () => { return new InitDialogWrapper()}],
		[DialogType.LOADOUT, () => { return new LoadoutDialogWrapper()}],
		[DialogType.START_GAME, () => { return new StartGameDialogWrapper()}],
	]);

	private _dialogsElm : HTMLElement;
	private _dialogs : Array<DialogWrapper>;

	constructor() {
		super(HandlerType.DIALOGS, {
			mode: UiMode.DIALOG,
		});

		this._dialogsElm = Html.elm(Html.divDialogs);
		this._dialogs = new Array();
	}

	override clear() : void {
		super.clear();

		while(this._dialogs.length > 0) {
			this.popDialog(this._dialogs.pop());
		}
	}

	pushDialog(type : DialogType) : void {
		if (!DialogHandler._createDialogFns.has(type)) {
			console.error("Error: not showing unknown dialog type", DialogType[type]);
			return;
		}

		let dialogWrapper = DialogHandler._createDialogFns.get(type)();
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
			this.disable();
			return;
		}

		this.enable();
		this._dialogs[this._dialogs.length - 1].display("block");
	}
}