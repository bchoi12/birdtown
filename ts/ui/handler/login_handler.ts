
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { UiMode, DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'

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
	private _roomInputElm : HTMLInputElement;
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
		this._roomInputElm = Html.inputElm(Html.inputRoom);
		this._loginButtonsElm = Html.elm(Html.divLoginButtons);
		this._buttonHostElm = Html.inputElm(Html.buttonHost);
		this._buttonJoinElm = Html.inputElm(Html.buttonJoin);

		this._timeoutId = new Optional();

		this._loginInfoElm.appendChild(this._infoTextElm);
		this._loginInfoElm.appendChild(this._infoDotsElm);
	}

	override setup() : void {	
		this._buttonHostElm.onclick = () => {
			let room = Html.trimmedValue(this._roomInputElm);
			if (room.length === 0) {
				room = LoginNames.randomRoom();

				// Avoid browser validation nag
				this._roomInputElm.value = room;
			}

			this.startGame(room, /*isHost=*/true);
		};
		this._buttonJoinElm.onclick = () => {
			const room = Html.trimmedValue(this._roomInputElm);
			this.startGame(room, /*isHost=*/false);
		};

		this.showInfo("Loading");
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
				this._roomInputElm.value = room;
				this.startGame(room, /*isHost=*/false);
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
		this._roomInputElm.style.display = "none";
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
		this._roomInputElm.style.display = "block";
		this._loginButtonsElm.style.display = "block";
		this._roomInputElm.focus();

		this._infoTextElm.textContent = "";
	}

	private handleError(error : string) : void {
		this._loginErrorElm.style.display = "block";
		this._loginErrorElm.textContent = error;
	}

	private hideError() : void {
		this._loginErrorElm.style.display = "none";
	}

	private startGame(room : string, isHost : boolean) : void {
		if (!this.enabled()) {
			console.error("Error: tried to start/join %s when not enabled", room);
			return;
		}

		if (room.length === 0) {
			console.error("Error: room should not be empty");
			return;
		}

		this.initializeGame(room, isHost ? CreateMode.HOST : CreateMode.JOIN);
	}

	private initializeGame(room : string, mode : CreateMode) : void {
		let isHost = false;
		switch (mode) {
		case CreateMode.HOST:
			isHost = true;
			this.showInfo("Creating new room " + room)
			break;
		case CreateMode.JOIN:
			isHost = false;
			this.showInfo("Connecting to room " + room);
			break;
		case CreateMode.HOST_AFTER_JOIN:
			isHost = true;
			this.showInfo("Failed to join " + room + ", creating a new room");
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

		    	ui.pushDialog(DialogType.INIT);
		    },
		    netcodeError: () => {
				if (mode === CreateMode.JOIN) {
		    		this.initializeGame(room, CreateMode.HOST_AFTER_JOIN);
		    		return;
		    	}

		    	if (mode === CreateMode.HOST) {
		    		this.handleError(`Failed to create room ${room}. Please try again later with a different code.`);
					this._roomInputElm.value = "";
		    	} else if (mode === CreateMode.HOST_AFTER_JOIN) {
		    		this.handleError(`Failed to either join or create room ${room}. Please try again in a few minutes.`);
					this._roomInputElm.value = "";
		    	}
		    	this.showLogin();
		    }
		});
	}
}