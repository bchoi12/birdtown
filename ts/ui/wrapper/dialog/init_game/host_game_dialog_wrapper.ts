
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { IdGen } from 'network/id_gen'
import { NetcodeOptions } from 'network/netcode'

import { settings } from 'settings'

import { ui } from 'ui'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { CategoryWrapper } from 'ui/wrapper/category_wrapper'
import { InitGameDialogWrapper } from 'ui/wrapper/dialog/init_game_dialog_wrapper'
import { LabelInputWrapper } from 'ui/wrapper/label/label_input_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { SettingWrapper } from 'ui/wrapper/label/setting_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { Fns } from 'util/fns'
import { LatLng } from 'util/lat_lng'

export class HostGameDialogWrapper extends InitGameDialogWrapper {

	private static readonly _defaultMaxPlayers = 16;
	private static readonly _maxMaxPlayers = 64;

	private _maxPlayers : number;
	private _maxPlayersSetting : LabelNumberWrapper;
	private _publicRoom : number;
	private _privacySetting : LabelNumberWrapper;
	private _name : string;
	private _nameInput : LabelInputWrapper;
	private _passwordInput : LabelInputWrapper;

	private _settingsCategory : CategoryWrapper;
	private _advancedCategory : CategoryWrapper;

	private _latlng : string;

	constructor() {
		super();

		this.shrink();
		this.setTitle("Host Game");

		this._settingsCategory = new CategoryWrapper();
		this._settingsCategory.setTitle("Settings");
		this._settingsCategory.setAlwaysExpand(true);
		this.form().appendChild(this._settingsCategory.elm());

		this._name = "Birdtown" + IdGen.randomNum(InitGameDialogWrapper._roomLength)

		this._nameInput = new LabelInputWrapper();
		this._nameInput.setName("Game Name");
		this._nameInput.inputElm().maxLength = InitGameDialogWrapper._nameLength;
		this._nameInput.inputElm().pattern = InitGameDialogWrapper._pattern;
		this._nameInput.inputElm().placeholder = this._name;
		this._settingsCategory.contentElm().appendChild(this._nameInput.elm());

		this._passwordInput = new LabelInputWrapper();
		this._passwordInput.setName("Password (optional)");
		this._passwordInput.inputElm().maxLength = InitGameDialogWrapper._passwordLength;
		this._passwordInput.inputElm().pattern = InitGameDialogWrapper._pattern;
		this._settingsCategory.contentElm().appendChild(this._passwordInput.elm());

		this.form().appendChild(Html.br());

		this._advancedCategory = new CategoryWrapper();
		this._advancedCategory.setTitle("Advanced Settings");
		this._advancedCategory.setExpanded(true);
		this.form().appendChild(this._advancedCategory.elm());

		this._publicRoom = 1;
		this._privacySetting = new LabelNumberWrapper({
			label: "Allow anyone to join",
			value: this._publicRoom,
			plus: (current : number) => {
				this._publicRoom = 1;
			},
			minus: (current : number) => {
				this._publicRoom = 0;
			},
			get: () => { return this._publicRoom; },
			html: (current : number) => {
				return this._publicRoom === 1 ? "Yes" : "No";
			}
		});
		this._advancedCategory.contentElm().appendChild(this._privacySetting.elm());

		this._maxPlayers = HostGameDialogWrapper._defaultMaxPlayers;
		this._maxPlayersSetting = new LabelNumberWrapper({
			label: "Max Players",
			value: this._maxPlayers,
			plus: (current : number) => {
				this._maxPlayers = Math.min(current + 1, HostGameDialogWrapper._maxMaxPlayers);
			},
			minus: (current : number) => {
				this._maxPlayers = Math.max(1, current - 1);
			},
			get: () => { return this._maxPlayers; },
		});
		this._advancedCategory.contentElm().appendChild(this._maxPlayersSetting.elm());

		// Resist urge to use ? in the HTTP request
		this._latlng = "unk,unk";
	}

	override onShow() : void {
		super.onShow();

		if (this._nameInput.value() === "") {
			this._nameInput.inputElm().focus();
		}
	}

	override connectMessage(room : string) : string { return `Hosting new room ${room}`; }
	override connectErrorMessage(room : string) : string { return "Failed to host, please try again in a bit"; }
	override getNetcodeOptions() : NetcodeOptions {
		return {
			isHost: true,
			room: IdGen.randomId(InitGameDialogWrapper._roomLength),
			password: this.getPassword(),
			hostOptions: {
				maxPlayers: this._maxPlayers,
				publicRoom: this._publicRoom === 1,
				name: this.getName(),
				latlng: this._latlng,
			},
		};
	}

	override connect() : void {
		if (this.pending()) {
			return;
		}

		if (this.getPassword().length > 0) {
			super.connect();
			return;
		}

		if (!navigator.geolocation) {
			console.error("Warning: location not supported, hosting anyway");
			super.connect();
			return;
		}

		this.setPendingMessage("Hosting public game - querying approximate location")
		ui.queryLatLng((loc : LatLng) => {
			this._latlng = ["" + Fns.roundTo(loc.lat(), 2), "" + Fns.roundTo(loc.lng(), 2)].join(",");
			this.setReady();
			super.connect();
		}, () => {
			console.error("Warning: failed to obtain location, hosting anyway");
			this.setReady();
			super.connect();
		});
	}

	private getName() : string {
		const value = this._nameInput.value();
		return value.length > 0 ? value : this._name;
	}
	private getPassword() : string {
		return this._passwordInput.value();
	}
}