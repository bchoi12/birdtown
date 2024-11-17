
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { UiMode, DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'

import { isLocalhost } from 'util/common'
import { Optional } from 'util/optional'

enum CreateMode {
	UNKNOWN,

	HOST,
	JOIN,

	// Joining failed, so try hosting
	HOST_AFTER_JOIN,
}

export class LoginHandler extends HandlerBase implements Handler {

	private _loginElm : HTMLElement;
	private _legendElm : HTMLElement;
	private _loginInfoElm : HTMLElement;
	private _infoTextElm : HTMLElement;
	private _infoDotsElm : HTMLElement;
	private _loginErrorElm : HTMLElement;
	private _joinInputElm : HTMLInputElement;
	private _loginButtonsElm : HTMLElement;
	private _buttonHostElm : HTMLInputElement;
	private _buttonJoinElm : HTMLInputElement;

	private _timeoutId : Optional<number>;

	constructor() {
		super(HandlerType.LOGIN, {
			mode: UiMode.LOGIN,
		});

		this._loginElm = Html.elm(Html.divLogin);
		this._legendElm = Html.elm(Html.legendLogin);
		this._loginInfoElm = Html.elm(Html.loginInfo);
		this._infoTextElm = Html.span();
		this._infoDotsElm = Html.span();
		this._loginErrorElm = Html.elm(Html.loginError);
		this._joinInputElm = Html.inputElm(Html.inputRoom);
		this._loginButtonsElm = Html.elm(Html.divLoginButtons);
		this._buttonHostElm = Html.inputElm(Html.buttonHost);
		this._buttonJoinElm = Html.inputElm(Html.buttonJoin);

		this._timeoutId = new Optional();

		this._loginInfoElm.appendChild(this._infoTextElm);
		this._loginInfoElm.appendChild(this._infoDotsElm);
	}

	override setup() : void {	
		this._buttonHostElm.onclick = () => {
			let room = LoginNames.randomRoom();
			this.startGame(room, CreateMode.HOST);
		};
		this._buttonJoinElm.onclick = () => {
			const room = Html.trimmedValue(this._joinInputElm);
			this.startGame(room, CreateMode.JOIN);
		};

		this.showInfo("Loading...");
		this.enable();
	}

	override onEnable() : void {
		super.onEnable();

		this._legendElm.textContent = UiGlobals.versionString;

		this.showLogin();

		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has(UiGlobals.roomParam)) {
			const room = urlParams.get(UiGlobals.roomParam);
			if (room.length > 0) {
				this._joinInputElm.value = room;

				const mode = isLocalhost() ? CreateMode.HOST_AFTER_JOIN : CreateMode.JOIN;
				this.startGame(room, mode);
			}
		}
	}

	override onDisable() : void {
		super.onDisable();

		this._loginElm.style.display = "none";
		document.body.style.background = "black";
	}

	private showInfo(info : string) : void {
		this._loginInfoElm.style.display = "block";
		this._joinInputElm.style.display = "none";
		this._loginButtonsElm.style.display = "none";

		this._infoTextElm.textContent = info;
		this._infoDotsElm.textContent = "";

		if (this._timeoutId.has()) {
			window.clearTimeout(this._timeoutId.get());
		}

		this._timeoutId.set(window.setInterval(() => {
			if (this._loginInfoElm.style.display === "none") {
				return;
			}
			if (this._infoDotsElm.textContent.length >= 3) {
				this._infoDotsElm.textContent = ".";
			} else {
				this._infoDotsElm.textContent += ".";
			}
		}, 500));
	}
	private showLogin() : void {
		this._loginInfoElm.style.display = "none";
		this._joinInputElm.style.display = "block";
		this._loginButtonsElm.style.display = "block";
		this._joinInputElm.focus();

		this._infoTextElm.textContent = "";
	}

	private handleError(error : string) : void {
		this._loginErrorElm.style.display = "block";
		this._loginErrorElm.textContent = error;
	}

	private hideError() : void {
		this._loginErrorElm.style.display = "none";
	}

	private startGame(room : string, mode : CreateMode) : void {
		room = room.toUpperCase();

		if (!this.enabled()) {
			console.error("Error: tried to start/join %s when not enabled", room);
			return;
		}

		if (room.length === 0) {
			console.error("Error: room should not be empty");
			return;
		}

		room = room.replace(/[^A-Za-z0-9]/g, "");
		if (room.length === 0) {
			this.handleError("Only alphanumeric characters are supported.");
			return;
		}

		this.initializeGame(room, mode);
	}

	private initializeGame(room : string, mode : CreateMode) : void {
		let isHost = false;
		switch (mode) {
		case CreateMode.HOST:
			isHost = true;
			this.showInfo("Creating new room " + room)
			break;
		case CreateMode.JOIN:
		case CreateMode.HOST_AFTER_JOIN:
			isHost = false;
			this.showInfo("Connecting to room " + room);
			break;
		default:
			console.error("Unknown mode!", CreateMode[mode]);
			return;
		}

		this.hideError();

		game.initialize({
		    room: room,
		    isHost: isHost,
		    netcodeSuccess: () => {
		    	console.log("Successfully initialized netcode");

				const url = new URL(window.location.href);
				url.searchParams.set(UiGlobals.roomParam, room);
				window.history.replaceState(null, null, url);

		    	this.disable();
		    },
		    netcodeError: () => {
				if (mode === CreateMode.HOST_AFTER_JOIN) {
		    		this.initializeGame(room, CreateMode.HOST);
		    		return;
		    	}

		    	if (mode === CreateMode.HOST) {
		    		this.handleError(`Failed to create room ${room}. Please try again in a few moments.`);
					this._joinInputElm.value = "";
		    	} else if (mode === CreateMode.JOIN) {
		    		this.handleError(`Failed to join room ${room}. The room may not exist or you may need to try again.`);
		    		this._joinInputElm.value = room;
		    	}
		    	this.showLogin();
		    }
		});
	}
}