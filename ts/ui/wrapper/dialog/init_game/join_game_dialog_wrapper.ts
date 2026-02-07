
import { game } from 'game'

import { Flags } from 'global/flags'

import { IdGen } from 'network/id_gen'
import { NetcodeOptions } from 'network/netcode'

import { settings } from 'settings'

import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { ColumnsWrapper } from 'ui/wrapper/columns_wrapper'
import { InitGameDialogWrapper } from 'ui/wrapper/dialog/init_game_dialog_wrapper'
import { LabelInputWrapper } from 'ui/wrapper/label/label_input_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'
import { ServerWrapper } from 'ui/wrapper/server_wrapper'

export class JoinGameDialogWrapper extends InitGameDialogWrapper {
	
	private _autoJoin : boolean;
	private _passwordInput : LabelInputWrapper;
	private _roomInput : LabelInputWrapper;
	private _serverWrapper : ServerWrapper;

	constructor() {
		super();

		this.setTitle("Join Game");

		this._autoJoin = false;

		let columnsWrapper = ColumnsWrapper.withWeights([6, 4]);
		this.form().appendChild(columnsWrapper.elm());
		let servers = columnsWrapper.column(0);

		let serverCategory = new CategoryWrapper();
		serverCategory.setTitle("Birdtown Servers");
		serverCategory.setAlwaysExpand(true);
		servers.contentElm().appendChild(serverCategory.elm());

		this._serverWrapper = new ServerWrapper();
		serverCategory.contentElm().appendChild(this._serverWrapper.elm());

		let inputs = columnsWrapper.column(1);
		let inputCategory = new CategoryWrapper();
		inputCategory.setTitle("Join");
		inputCategory.setAlwaysExpand(true);
		inputs.contentElm().appendChild(inputCategory.elm());

		this._roomInput = new LabelInputWrapper();
		this._roomInput.setName("Room");
		this._roomInput.inputElm().pattern = InitGameDialogWrapper._pattern;
		this._roomInput.inputElm().maxLength = InitGameDialogWrapper._roomLength;
		this._roomInput.inputElm().required = true;
		inputCategory.contentElm().appendChild(this._roomInput.elm());

		this._passwordInput = new LabelInputWrapper();
		this._passwordInput.setName("Password");
		this._passwordInput.inputElm().pattern = InitGameDialogWrapper._pattern;
		this._passwordInput.inputElm().maxLength = InitGameDialogWrapper._passwordLength;
		inputCategory.contentElm().appendChild(this._passwordInput.elm());
	}

	override onShow() : void {
		super.onShow();

		if (this._autoJoin) {
			this.connect();
			return;
		}

		if (this._roomInput.value() === "") {
			this._roomInput.inputElm().focus();
		}
		this.refreshServers();
	}

	override hide() : void {
		super.hide();

		// not sure if needed...
		this._autoJoin = false;
	}

	protected override onNetcodeError(room : string) : void {
		super.onNetcodeError(room);

		if (this._autoJoin) {
			this._serverWrapper.autoJoinFailed();
		} else {
			this.silentRefreshServers();
		}
		this._autoJoin = false;
	}

	private refreshServers() : void {
		this.setPendingMessage("Location is used for approximating distance to public games")
		this._serverWrapper.refresh(() => {
			this.setReady();
		});
	}

	private silentRefreshServers() : void {
		if (ui.hasLatLng()) {
			this._serverWrapper.refresh(() => {});
		}
	}

	prefill(room : string, password : string) : void {
		this.setParams(room, password);
		this._autoJoin = true;
	}

	setParams(room : string, password : string) : void {
		this._roomInput.setValue(room);
		this._passwordInput.setValue(password);

		if (this.visible() && password === "") {
			this._passwordInput.inputElm().focus();
		}
	}

	override connectMessage(room : string) : string { return `Joining ${room}`; }
	override connectErrorMessage(room : string) : string { return `Failed to join ${room}`; }
	override getNetcodeOptions() : NetcodeOptions {
		return {
			isHost: false,
			room: this.getRoom(),
			password: this.getPassword(),
			offline: false,
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