
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
	private _nameInputElm : HTMLInputElement;
	private _roomInputElm : HTMLInputElement;
	private _buttonHostElm : HTMLInputElement;
	private _buttonJoinElm : HTMLInputElement;

	private _enabled : boolean;

	constructor() {
		super(HandlerType.LOGIN);

		this._loginElm = Html.elm(Html.divLogin);
		this._legendElm = Html.elm(Html.legendLogin);
		this._loginInfoElm = Html.elm(Html.loginInfo);
		this._nameInputElm = Html.inputElm(Html.inputName);
		this._roomInputElm = Html.inputElm(Html.inputRoom);
		this._buttonHostElm = Html.inputElm(Html.buttonHost);
		this._buttonJoinElm = Html.inputElm(Html.buttonJoin);

		this._enabled = true;
	}

	override setup() : void {
		this._loginInfoElm.style.display = "none";
		this._buttonJoinElm.style.display = "block";
		this._buttonHostElm.style.display = "block";

		this._nameInputElm.value = "b";
		this._roomInputElm.focus();

		this._buttonHostElm.onclick = () => {
			this.createRoom(/*host=*/true);
		};
		this._buttonJoinElm.onclick = () => {
			this.createRoom(/*host=*/false);
		};

	}

	private createRoom(host : boolean) : void {
			if (!this._enabled) {
				return;
			}

			const [displayName, room, success] = this.getInputs();
			if (!success) {
				return;
			}

			game.initialize({
			    displayName: displayName,
			    hostName: "birdtown2-" + room,
			    host: host,
			});

			ui.setMode(UiMode.GAME);
			this._loginElm.style.display = "none";
			this._enabled = false;
	}

	private getInputs() : [string, string, boolean] {
		const name = Html.trimmedValue(this._nameInputElm);
		if (name.length === 0) {
			return ["", "", false];
		}

		const room = Html.trimmedValue(this._roomInputElm);
		if (room.length === 0) {
			return ["", "", false];
		}

		return [name, room, true];
	}
}