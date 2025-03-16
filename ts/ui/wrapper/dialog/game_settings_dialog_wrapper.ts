
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { LoginNames } from 'ui/common/login_names'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { DotsWrapper } from 'ui/wrapper/dots_wrapper'
import { LabelInputWrapper } from 'ui/wrapper/label/label_input_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

import { settings } from 'settings'

enum State {
	READY,
	PENDING,
	ERROR,
}

export class GameSettingsDialogWrapper extends DialogWrapper {

	private _state : State;
	private _statusWrapper : ButtonWrapper;
	private _dotsWrapper : DotsWrapper;
	private _isHost : boolean;
	private _maxPlayers : number;
	private _maxPlayersSetting : LabelNumberWrapper;
	private _passwordInput : LabelInputWrapper;
	private _roomInput : LabelInputWrapper;

	constructor(isHost : boolean) {
		super();

		this.shrink();

		this._state = State.READY;
		this._statusWrapper = new ButtonWrapper();
		this._statusWrapper.elm().style.float = "left";
		this._statusWrapper.elm().style.fontSize = "0.7em";
		this._dotsWrapper = new DotsWrapper();
		this._statusWrapper.elm().appendChild(this._dotsWrapper.elm());

		this.footerElm().appendChild(this._statusWrapper.elm());

		this._isHost = isHost;

		let pageWrapper = this.addPage();

		if (isHost) {
			this.setTitle("Host Game");
			this._maxPlayers = 16;
			this._maxPlayersSetting = new LabelNumberWrapper({
				label: "Max Players",
				value: this._maxPlayers,
				plus: (current : number) => {
					this._maxPlayers = Math.min(current + 1, 64);
				},
				minus: (current : number) => {
					this._maxPlayers = Math.max(1, current - 1);
				},
				get: () => { return this._maxPlayers; },
			});
			pageWrapper.elm().appendChild(this._maxPlayersSetting.elm());
		} else {
			this.setTitle("Join Game");
			this._roomInput = new LabelInputWrapper();
			this._roomInput.setName("Room");
			this._roomInput.inputElm().pattern = "[a-zA-Z0-9]+";
			this._roomInput.inputElm().maxLength = 10;
			this._roomInput.inputElm().required = true;

			pageWrapper.elm().appendChild(this._roomInput.elm());
		}

		this._passwordInput = new LabelInputWrapper();
		this._passwordInput.setName("Password");
		this._passwordInput.inputElm().maxLength = 10;
		pageWrapper.elm().appendChild(this._passwordInput.elm());

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.connect();
		});

		let cancelButton = this.addCancelButton();
		cancelButton.addOnClick(() => {
			this.hide();
		});

		document.addEventListener("keydown", (e : any) => {
			if (!this.visible()) {
				return;
			}

			if (e.keyCode === settings.chatKeyCode) {
				this.connect();
			}
		});
	}

	override onShow() : void {
		super.onShow();

		if (this._roomInput && this._roomInput.value() === "") {
			this._roomInput.inputElm().focus();
		}
	}

	setRoom(room : string) : void {
		this._roomInput.setValue(room);
	}
	setPassword(password : string) : void {
		this._passwordInput.setValue(password);
	}

	connect() : void {
		let room = this.getRoom();

		if (room.length <= 0) {
			this.setState(State.ERROR, "Room is invalid!");
			return;
		}

		let netcodeOptions;
		if (this._isHost) {
			this.setState(State.PENDING, "Hosting new room");
			netcodeOptions = {
				isHost: true,
				room: room,
				hostOptions: {
					password: this._passwordInput.value(),
					maxPlayers: this._maxPlayers,
				},
			}
		} else {
			this.setState(State.PENDING, "Joining game");
			netcodeOptions = {
				isHost: false,
				room: room,
				clientOptions: {
					password: this._passwordInput.value(),
				},
			}
		}

		game.initialize({
			netcodeOptions: netcodeOptions,
		    netcodeSuccess: () => {
		    	console.log("Successfully initialized netcode");

				const url = new URL(window.location.href);
				url.searchParams.set(UiGlobals.roomParam, room);
				window.history.replaceState(null, null, url);

				this.hide();
		    	ui.hideLogin();
		    },
		    netcodeError: () => {
		    	if (this._isHost) {
		    		this.setState(State.ERROR, "Failed to host! Please try again in a bit.");
		    	} else {
		    		this.setState(State.ERROR, "Failed to join! Please double check the room code.");
		    		this._roomInput.setValue(room);
		    	}
		    }
		});
	}

	private getRoom() : string {
		let room;
		if (this._isHost) {
			room = LoginNames.randomId(4);
		} else {
			room = this._roomInput.value();
		}
		return room.replace(/[^A-Za-z0-9]/g, "");
	}

	private setState(state : State, text? : string) : void {
		this._state = state;

		if (this._state === State.READY) {
			this._statusWrapper.hide();
		} else {
			this._statusWrapper.show();
		}

		if (this._state === State.ERROR) {
			this._statusWrapper.elm().style.color = "red";
			this._statusWrapper.setIcon(IconType.ERROR);
			this._statusWrapper.setText(text);
		} else if (this._state === State.PENDING) {
			this._statusWrapper.elm().style.color = "#f2f2f2";
			this._statusWrapper.setIcon(IconType.PENDING);
			this._statusWrapper.setText(text);
		}

		this.updateDots();
	}

	private updateDots() : void {

		if (this._state !== State.PENDING) {
			this._dotsWrapper.clear();
			return;
		}

		this._dotsWrapper.increment();
		setTimeout(() => {
			this.updateDots();
		}, 500);
	}
}