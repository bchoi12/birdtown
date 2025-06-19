
import { GameMessage } from 'message/game_message'

import { Flags } from 'global/flags'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode, DialogType, TooltipType } from 'ui/api'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { DisconnectedDialogWrapper } from 'ui/wrapper/dialog/disconnected_dialog_wrapper'
import { FailedConnectDialogWrapper } from 'ui/wrapper/dialog/failed_connect_dialog_wrapper'
import { FailedCopyDialogWrapper } from 'ui/wrapper/dialog/failed_copy_dialog_wrapper'
import { InitDialogWrapper } from 'ui/wrapper/dialog/client/init_dialog_wrapper'
import { LoadoutDialogWrapper } from 'ui/wrapper/dialog/client/loadout_dialog_wrapper'
import { RematchDialogWrapper } from 'ui/wrapper/dialog/rematch_dialog_wrapper'
import { ReturnToLobbyDialogWrapper } from 'ui/wrapper/dialog/return_to_lobby_dialog_wrapper'
import { StartGameDialogWrapper } from 'ui/wrapper/dialog/start_game_dialog_wrapper'
import { QueryLocationDialogWrapper } from 'ui/wrapper/dialog/query_location_dialog_wrapper'
import { QuitDialogWrapper } from 'ui/wrapper/dialog/quit_dialog_wrapper'
import { ResetSettingsDialogWrapper } from 'ui/wrapper/dialog/reset_settings_dialog_wrapper'
import { VersionMismatchDialogWrapper } from 'ui/wrapper/dialog/version_mismatch_dialog_wrapper'
import { YourRoomDialogWrapper } from 'ui/wrapper/dialog/your_room_dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { Optional } from 'util/optional'

export class DialogHandler extends HandlerBase implements Handler {

	private static readonly _createDialogFns = new Map<DialogType, () => DialogWrapper>([
		[DialogType.DISCONNECTED, () => { return new DisconnectedDialogWrapper()}],
		[DialogType.FAILED_CONNECT, () => { return new FailedConnectDialogWrapper()}],
		[DialogType.FAILED_COPY, () => { return new FailedCopyDialogWrapper()}],
		[DialogType.INIT, () => { return new InitDialogWrapper()}],
		[DialogType.LOADOUT, () => { return new LoadoutDialogWrapper()}],
		[DialogType.RETURN_TO_LOBBY, () => { return new ReturnToLobbyDialogWrapper()}],
		[DialogType.START_GAME, () => { return new StartGameDialogWrapper()}],
		[DialogType.QUERY_LOCATION, () => { return new QueryLocationDialogWrapper()}],
		[DialogType.QUIT, () => { return new QuitDialogWrapper()}],
		[DialogType.REMATCH, () => { return new RematchDialogWrapper()}],
		[DialogType.RESET_SETTINGS, () => { return new ResetSettingsDialogWrapper()}],
		[DialogType.VERSION_MISMATCH, () => { return new VersionMismatchDialogWrapper()}],
		[DialogType.YOUR_ROOM, () => { return new YourRoomDialogWrapper()}],
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

	override onEnable() : void {
		super.onEnable();

		this._dialogsElm.style.display = "block";
	}

	override onDisable() : void {
		super.onDisable();

		this._dialogsElm.style.display = "none";
	}

	override onGameInitialized() : void {
		super.onGameInitialized();

    	this.pushDialog(DialogType.INIT);
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

	// Use with caution
	forceDialog<T extends DialogWrapper>(type : DialogType) : T {
		this.clear();
		return this.pushDialog(type);
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
		this._dialogsElm.appendChild(dialogWrapper.elm());

		this.updateDialog();

		if (Flags.printDebug.get()) {
			console.log("Pushed dialog", DialogType[type]);
		}
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

		if (wrapper.visible()) {
			this.updateDialog();
		}

		if (Flags.printDebug.get()) {
			console.log("Removed dialog", DialogType[type]);
		}
	}

	private removeWrapper(type : DialogType, wrapper : DialogWrapper) : void {
		if (this._dialogsElm.contains(wrapper.elm())) {
			this._dialogsElm.removeChild(wrapper.elm());
		}
		this._dialogs.delete(type);
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