
import { game } from 'game'

import { versionString } from 'index'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'

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

		this._loginInfoElm.appendChild(this._infoTextElm);
		this._loginInfoElm.appendChild(this._infoDotsElm);
	}

	override setup() : void {	
		this._buttonHostElm.onclick = () => {
			const room = Html.trimmedValue(this._roomInputElm);
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

		this._legendElm.textContent = versionString;

		this.showLogin();

		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.has("r")) {
			const room = urlParams.get("r");
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

		// TODO: ensure 1 interval
		setInterval(() => {
			if (this._loginInfoElm.style.display === "none") {
				return;
			}
			if (this._infoDotsElm.textContent.length >= 3) {
				this._infoDotsElm.textContent = ".";
			} else {
				this._infoDotsElm.textContent += ".";
			}
		}, 1000);
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

		this.hideError();
		this.showInfo("Connecting");
		game.initialize({
		    room: room,
		    isHost: isHost,
		    netcodeSuccess: () => {
		    	console.log("Successfully initialized netcode");
		    	this.disable();
		    },
		    netcodeError: () => {
		    	if (isHost) {
		    		this.handleError(`Failed to create room ${room}. Please try again later with a different code.`);
		    	} else {
		    		this.handleError(`Failed to connect to ${room}. Please double check the code and try again.`);
		    	}
		    	this.showLogin();
		    }
		});
	}
}