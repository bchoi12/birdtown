
import { game } from 'game'

import { GameGlobals } from 'global/game_globals'
import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { UiMode, DialogType } from 'ui/api'
import { LoginNames } from 'ui/common/login_names'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { Html } from 'ui/html'
import { GameSettingsDialogWrapper } from 'ui/wrapper/dialog/game_settings_dialog_wrapper'

import { Optional } from 'util/optional'

enum LoginType {
	UNKNOWN,

	HOST,
	JOIN,
	AUTO_JOIN,
}

export class LoginHandler extends HandlerBase implements Handler {

	private _splashElm : HTMLElement;

	private _loginElm : HTMLElement;
	private _legendElm : HTMLElement;

	private _hostButton : HTMLInputElement;
	private _joinButton : HTMLInputElement;

	private _hostWrapper : GameSettingsDialogWrapper;
	private _clientWrapper : GameSettingsDialogWrapper;

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

		this._hostWrapper = new GameSettingsDialogWrapper(true);
		this._clientWrapper = new GameSettingsDialogWrapper(false);
		this._splashElm.appendChild(this._hostWrapper.elm());
		this._splashElm.appendChild(this._clientWrapper.elm());

		this._timeoutId = new Optional();
	}

	override setup() : void {	
		super.setup();

		this._splashElm.style.backgroundColor = "rgba(0, 0, 0, 0.5)";
		this._loginElm.style.display = "block";

		this._hostButton.onclick = () => {
			this.startGame(LoginType.HOST);
		};
		this._joinButton.onclick = () => {
			this.startGame(LoginType.JOIN);
		};

		this.enable();
	}

	override onEnable() : void {
		super.onEnable();

		this._legendElm.textContent = GameGlobals.version;

		const urlParams = new URLSearchParams(window.location.search);
		const room = urlParams.get(UiGlobals.roomParam);
		if (room && room.length > 0) {
			const password = urlParams.get(UiGlobals.passwordParam);
			if (password && password.length > 0) {
				this._clientWrapper.setPassword(password);
			}
			this._clientWrapper.setRoom(room);
			this.startGame(LoginType.AUTO_JOIN);
		}
	}

	override onDisable() : void {
		super.onDisable();

		this._splashElm.style.display = "none";
		document.body.style.background = "black";
	}

	hideLogin() : void { this.disable(); }

	private startGame(mode : LoginType) : void {
		if (!this.enabled()) {
			console.error("Error: tried to start game when login is not enabled");
			return;
		}

		switch (mode) {
		case LoginType.HOST:
			this._hostWrapper.show();
			break;
		case LoginType.AUTO_JOIN:
			this._clientWrapper.show();
			break;
		case LoginType.JOIN:
			this._clientWrapper.show();
			break;
		default:
			console.error("Unknown mode!", LoginType[mode]);
			return;
		}
	}
}