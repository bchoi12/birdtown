
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { IdGen } from 'network/id_gen'
import { NetcodeOptions } from 'network/netcode'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { DotsWrapper } from 'ui/wrapper/dots_wrapper'
import { LabelInputWrapper } from 'ui/wrapper/label/label_input_wrapper'
import { LabelNumberWrapper } from 'ui/wrapper/label/label_number_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

enum State {
	READY,
	PENDING,
	ERROR,
}

export abstract class InitGameDialogWrapper extends DialogWrapper {

	protected static readonly _pattern = "[a-zA-Z0-9\s]+";
	protected static readonly _nameLength = 16;
	protected static readonly _passwordLength = 10;
	protected static readonly _roomLength = 4;	
	protected static readonly _fontSize = "0.8em";

	protected _state : State;
	protected _stateChangeTime : number;
	protected _form : HTMLFormElement;
	protected _statusWrapper : ButtonWrapper;
	protected _dotsWrapper : DotsWrapper;

	constructor() {
		super();

		this.setOpaque(true);
		this.shrink();

		this._state = State.READY;
		this._stateChangeTime = Date.now();
		this._form = Html.form();
		this._statusWrapper = new ButtonWrapper();
		this._statusWrapper.elm().style.float = "left";
		this._statusWrapper.elm().style.fontSize = "0.6em";
		this._dotsWrapper = new DotsWrapper();
		this._statusWrapper.elm().appendChild(this._dotsWrapper.elm());

		this.footerElm().appendChild(this._statusWrapper.elm());

		let pageWrapper = this.addPage();
		pageWrapper.elm().style.fontSize = InitGameDialogWrapper._fontSize;

		pageWrapper.elm().appendChild(this._form);

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

	abstract connectMessage() : string;
	abstract connectErrorMessage() : string;
	abstract getNetcodeOptions() : NetcodeOptions;

	protected form() : HTMLFormElement { return this._form; }

	protected pending() : boolean { return this._state === State.PENDING; }
	protected setReady() : void { this.setState(State.READY, ""); }
	connect() : void {
		if (this.pending()) {
			return;
		}

		if (!this.form().checkValidity()) {
			this.form().reportValidity();
			return;
		}

		const netcodeOptions = this.getNetcodeOptions();
		const room = netcodeOptions.room;

		if (room.length <= 0) {
			this.setErrorMessage("Room is invalid!");
			return;
		}

		this.setPendingMessage(this.connectMessage());
		game.initialize({
			netcodeOptions: netcodeOptions,
		    netcodeSuccess: () => {
		    	console.log("Successfully initialized netcode");

				const url = new URL(window.location.href);
				url.searchParams.set(UiGlobals.roomParam, room);
				window.history.replaceState(null, null, url);

				this.hide();
		    	ui.hideLogin();
		    	this.setReady();
		    },
		    netcodeError: () => {
		    	this.setErrorMessage(this.connectErrorMessage());
		    }
		});
	}

	private timeSinceStateChange() : number { return Date.now() - this._stateChangeTime; }
	private setState(state : State, text : string) : void {
		this._statusWrapper.setText(text);

		if (this._state === state) {
			return;
		}

		this._state = state;
		this._stateChangeTime = Date.now();

		if (this._state === State.READY) {
			this._statusWrapper.hide();
			return;
		} else {
			this._statusWrapper.show();
		}

		if (this._state === State.ERROR) {
			this._statusWrapper.elm().style.color = "red";
			this._statusWrapper.setIcon(IconType.ERROR);
		} else if (this._state === State.PENDING) {
			this._statusWrapper.elm().style.color = "#f2f2f2";
			this._statusWrapper.setIcon(IconType.PENDING);
		}

		this.updateDots();
	}

	protected setErrorMessage(text : string) : void {
		this.setState(State.ERROR, text);
	}
	protected setPendingMessage(text : string) : void {
		if (this._state === State.PENDING) {
			return;
		}

		this.setState(State.PENDING, text);
	}
	protected setInfoText(text : string) : void {
		if (this._state === State.PENDING) {
			return;
		}
		if (this._state === State.ERROR && this.timeSinceStateChange() < 3000) {
			return;
		}

		this.setState(State.READY, text);
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