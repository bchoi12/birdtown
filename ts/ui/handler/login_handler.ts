
import { game } from 'game'

import { ui, HandlerType, Mode } from 'ui'
import { Handler, HandlerBase } from 'ui/handler'
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

	setup() : void {
		this._loginInfoElm.style.display = "none";
		this._buttonJoinElm.style.display = "block";
		this._buttonHostElm.style.display = "block";

		this._nameInputElm.value = "b";
		this._roomInputElm.focus();

		this._buttonHostElm.onclick = () => {
			if (!this._enabled) {
				return;
			}

			const [name, room, success] = this.getInputs();

			game.initialize({
			    name: name,
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

			const [name, room, success] = this.getInputs();

			game.initialize({
			    name: name,
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