
import { game } from 'game'

import { Flags } from 'global/flags'
import { GameGlobals } from 'global/game_globals'

import { perch } from 'perch'

import { ui } from 'ui'
import { UiMode, DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { HostGameDialogWrapper } from 'ui/wrapper/dialog/init_game/host_game_dialog_wrapper'
import { JoinGameDialogWrapper } from 'ui/wrapper/dialog/init_game/join_game_dialog_wrapper'

import { Optional } from 'util/optional'

enum LoginType {
	UNKNOWN,

	HOST,
	JOIN,
}

export class LoginHandler extends HandlerBase implements Handler {

	private _splashElm : HTMLElement;

	private _loginElm : HTMLElement;
	private _legendElm : HTMLElement;

	private _hostButton : HTMLInputElement;
	private _joinButton : HTMLInputElement;

	private _hostWrapper : HostGameDialogWrapper;
	private _clientWrapper : JoinGameDialogWrapper;

	private _timeoutId : Optional<number>;

	constructor() {
		super(HandlerType.LOGIN, {
			mode: UiMode.LOGIN,
		});

		this._splashElm = Html.elm(Html.divSplash);
		this._loginElm = Html.elm(Html.divLogin);
		this._legendElm = Html.elm(Html.loginLegend);

		this._hostButton = Html.inputElm(Html.buttonHost);
		this._joinButton = Html.inputElm(Html.buttonJoin);

		this._hostWrapper = new HostGameDialogWrapper();
		this._clientWrapper = new JoinGameDialogWrapper();
		this._splashElm.appendChild(this._hostWrapper.elm());
		this._splashElm.appendChild(this._clientWrapper.elm());

		this._timeoutId = new Optional();
	}

	override setup() : void {	
		super.setup();

		this._splashElm.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
		this._loginElm.style.display = "block";

		this._hostButton.onclick = () => {
			this.hostGame();
		};
		this._joinButton.onclick = () => {
			this.joinGame();
		};

		this.enable();
	}

	override onEnable() : void {
		super.onEnable();

		this._legendElm.textContent = GameGlobals.version;

		const urlParams = new URLSearchParams(window.location.search);
		const room = Flags.room.get();
		if (room.length > 0) {
			const password = Flags.password.get();
			this._clientWrapper.prefill(room, password);		
			this.joinGame();
		}
	}

	override onDisable() : void {
		super.onDisable();

		this._splashElm.style.display = "none";
		document.body.style.background = "black";
	}

	setJoinParams(room : string, password : string) : void {
		this._clientWrapper.setParams(room, password);
	}

	hideLogin() : void { this.disable(); }

	hostGame() : void {
		if (!this.enabled()) {
			console.error("Error: tried to host game when login is not enabled");
			return;
		}

		this._clientWrapper.hide();
		this._hostWrapper.show();
	}

	joinGame() : void {
		if (!this.enabled()) {
			console.error("Error: tried to join game when login is not enabled");
			return;
		}

		this._hostWrapper.hide();
		this._clientWrapper.show();
	}
}