
import { game } from 'game'

import { ui, HandlerType, Mode } from 'ui'
import { Handler, HandlerBase } from 'ui/handler'
import { Html } from 'ui/html'

export class Login extends HandlerBase implements Handler {

	private _loginElm : HTMLElement;
	private _legendElm : HTMLElement;
	private _loginInfoElm : HTMLElement;
	private _roomInputElm : HTMLInputElement;
	private _buttonHostElm : HTMLInputElement;
	private _buttonJoinElm : HTMLInputElement;

	private _enabled : boolean;

	constructor() {
		super(HandlerType.LOGIN);

		this._loginElm = Html.elm(Html.divLogin);
		this._legendElm = Html.elm(Html.legendLogin);
		this._loginInfoElm = Html.elm(Html.loginInfo);
		this._roomInputElm = Html.inputElm(Html.inputRoom);
		this._buttonHostElm = Html.inputElm(Html.buttonHost);
		this._buttonJoinElm = Html.inputElm(Html.buttonJoin);

		this._enabled = true;
	}

	setup() : void {
		this._loginInfoElm.style.display = "none";
		this._buttonJoinElm.style.display = "block";
		this._buttonHostElm.style.display = "block";

		this._roomInputElm.focus();

		this._buttonHostElm.onclick = () => {
			if (!this._enabled) {
				return;
			}

			const room = Html.trimmedValue(this._roomInputElm);
			if (room.length === 0) {
				return;
			}

			game.initialize({
			    name: "birdtown2-" + room,
			    hostName: "birdtown2-" + room,
			    host: true,
			});

			ui.setMode(Mode.GAME);
			this._loginElm.style.display = "none";
			this._enabled = false;
		};

		this._buttonJoinElm.onclick = () => {
			if (!this._enabled) {
				return;
			}

			const room = Html.trimmedValue(this._roomInputElm);
			if (room.length === 0) {
				return;
			}

			game.initialize({
			    name: "",
			    hostName: "birdtown2-" + room,
			    host: false,
			});

			ui.setMode(Mode.GAME);
			this._loginElm.style.display = "none";
			this._enabled = false;
		};

	}

	reset() : void {}

	setMode(mode : Mode) : void {}
}