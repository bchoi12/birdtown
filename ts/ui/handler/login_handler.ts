
import { game } from 'game'

import { UiMessage, UiMessageType } from 'message/ui_message'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'

export class LoginHandler extends HandlerBase implements Handler {

	private _loginElm : HTMLElement;
	private _legendElm : HTMLElement;
	private _loginInfoElm : HTMLElement;
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
		this._roomInputElm = Html.inputElm(Html.inputRoom);
		this._loginButtonsElm = Html.elm(Html.divLoginButtons);
		this._buttonHostElm = Html.inputElm(Html.buttonHost);
		this._buttonJoinElm = Html.inputElm(Html.buttonJoin);
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

		this.enable();
	}

	override onEnable() : void {
		super.onEnable();

		this._loginInfoElm.style.display = "none";
		this._roomInputElm.style.display = "block";
		this._loginButtonsElm.style.display = "block";
		this._roomInputElm.focus();

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

		game.initialize({
		    room: room,
		    isHost: isHost,
		});

		this.disable();
	}
}