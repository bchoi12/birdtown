
import { GameMessage } from 'message/game_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, DialogType, TooltipType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { DisconnectedDialogWrapper } from 'ui/wrapper/dialog/disconnected_dialog_wrapper'
import { InitDialogWrapper } from 'ui/wrapper/dialog/client/init_dialog_wrapper'
import { LoadoutDialogWrapper } from 'ui/wrapper/dialog/client/loadout_dialog_wrapper'
import { ReturnToLobbyDialogWrapper } from 'ui/wrapper/dialog/return_to_lobby_dialog_wrapper'
import { StartGameDialogWrapper } from 'ui/wrapper/dialog/start_game_dialog_wrapper'
import { QuitDialogWrapper } from 'ui/wrapper/dialog/quit_dialog_wrapper'
import { VersionMismatchDialogWrapper } from 'ui/wrapper/dialog/version_mismatch_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { Optional } from 'util/optional'

export class DialogHandler extends HandlerBase implements Handler {

	private static readonly _createDialogFns = new Map<DialogType, () => DialogWrapper>([
		[DialogType.DISCONNECTED, () => { return new DisconnectedDialogWrapper()}],
		[DialogType.INIT, () => { return new InitDialogWrapper()}],
		[DialogType.LOADOUT, () => { return new LoadoutDialogWrapper()}],
		[DialogType.RETURN_TO_LOBBY, () => { return new ReturnToLobbyDialogWrapper()}],
		[DialogType.START_GAME, () => { return new StartGameDialogWrapper()}],
		[DialogType.QUIT, () => { return new QuitDialogWrapper()}],
		[DialogType.VERSION_MISMATCH, () => { return new VersionMismatchDialogWrapper()}],
	]);

	private _dialogsElm : HTMLElement;
	private _dialogQueue : Array<DialogType>;
	private _dialogs : Map<DialogType, DialogWrapper>;

	constructor() {
		super(HandlerType.DIALOGS, {
			mode: UiMode.DIALOG,
		});

		this._dialogsElm = Html.elm(Html.divDialogs);
		this._dialogQueue = new Array();
		this._dialogs = new Map();
	}

	override handleClientMessage(msg : GameMessage) : void {
		super.handleClientMessage(msg);

		this._dialogs.forEach((wrapper : DialogWrapper) => {
			wrapper.handleClientMessage(msg);
		});
	}

	override clear() : void {
		super.clear();

		this._dialogQueue = [];
		this._dialogs.forEach((wrapper : DialogWrapper, type : DialogType) => {
			this.removeWrapper(type, wrapper);
		});
	}

	pushDialog<T extends DialogWrapper>(type : DialogType) : T {
		if (!DialogHandler._createDialogFns.has(type)) {
			console.error("Error: not queuing unknown dialog type", DialogType[type]);
			return;
		}
		if (this._dialogs.has(type)) {
			console.error("Error: dialog queue already contains", DialogType[type]);
			return;
		}

		let dialogWrapper = <T>DialogHandler._createDialogFns.get(type)();
		dialogWrapper.addOnSubmit(() => {
			this.removeDialog(type);
		});
		dialogWrapper.addOnCancel(() => {
			this.removeDialog(type);
		});
		dialogWrapper.hide();

		this._dialogs.set(type, dialogWrapper);
		this._dialogQueue.push(type);
		this._dialogsElm.prepend(dialogWrapper.elm());

		this.updateDialog();

		return dialogWrapper;
	}
	forceSubmitDialog(type : DialogType) : void {
		if (!this._dialogs.has(type)) {
			return;
		}

		let wrapper = this._dialogs.get(type);
		wrapper.forceSubmit();

		this.removeDialog(type);
	}
	private removeDialog(type : DialogType) : void {
		if (!this._dialogs.has(type)) {
			return;
		}

		const wrapper = this._dialogs.get(type);
		this.removeWrapper(type, wrapper);
		this._dialogs.delete(type);

		if (wrapper.visible()) {
			this.updateDialog();
		}
	}

	private removeWrapper(type : DialogType, wrapper : DialogWrapper) : void {
		if (this._dialogsElm.contains(wrapper.elm())) {
			this._dialogsElm.removeChild(wrapper.elm());
		}
	}

	private updateDialog() : void {
		if (this._dialogQueue.length === 0) {
			this.disable();
			return;
		}

		const type = this._dialogQueue.pop();
		if (!this._dialogs.has(type)) {
			console.error("Warning: missing dialog %s", DialogType[type]);
			this.updateDialog();
			return;
		}

		this._dialogs.get(type).show();
		this.enable();
	}
}