
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { IdGen } from 'network/id_gen'
import { NetcodeOptions } from 'network/netcode'

import { settings } from 'settings'

import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { InitGameDialogWrapper } from 'ui/wrapper/dialog/init_game_dialog_wrapper'
import { LabelInputWrapper } from 'ui/wrapper/label/label_input_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class JoinGameDialogWrapper extends InitGameDialogWrapper {

	private _passwordInput : LabelInputWrapper;
	private _roomInput : LabelInputWrapper;

	constructor() {
		super();

		let pageWrapper = this.addPage();
		pageWrapper.elm().style.fontSize = InitGameDialogWrapper._fontSize;

		this.setTitle("Join Game");
		this._roomInput = new LabelInputWrapper();
		this._roomInput.setName("Room");
		this._roomInput.inputElm().pattern = InitGameDialogWrapper._pattern;
		this._roomInput.inputElm().maxLength = InitGameDialogWrapper._roomLength;
		this._roomInput.inputElm().required = true;

		pageWrapper.elm().appendChild(this._roomInput.elm());

		this._passwordInput = new LabelInputWrapper();
		this._passwordInput.setName("Password");
		this._passwordInput.inputElm().pattern = InitGameDialogWrapper._pattern;
		this._passwordInput.inputElm().maxLength = InitGameDialogWrapper._passwordLength;
		pageWrapper.elm().appendChild(this._passwordInput.elm());
	}

	override onShow() : void {
		super.onShow();

		if (this._roomInput.value() === "") {
			this._roomInput.inputElm().focus();
		}
	}

	setRoom(room : string) : void {
		this._roomInput.setValue(room);
	}
	setPassword(password : string) : void {
		this._passwordInput.setValue(password);
	}

	override connectMessage() : string { return "Joining game"; }
	override connectErrorMessage() : string { return "Failed to join, please double check your settings"; }
	override getNetcodeOptions() : NetcodeOptions {
		return {
			isHost: false,
			room: this.getRoom(),
			password: this.getPassword(),
			clientOptions: {},
		};
	}

	private getRoom() : string {
		return this._roomInput.value().trim().replace(/[^A-Za-z0-9]/g, "");
	}
	private getPassword() : string {
		return this._passwordInput.value();
	}
}