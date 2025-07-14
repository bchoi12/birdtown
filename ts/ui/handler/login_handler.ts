
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
import { NewVersionDialogWrapper } from 'ui/wrapper/dialog/new_version_dialog_wrapper'
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
	private _quitButton : HTMLInputElement;

	private _hostWrapper : HostGameDialogWrapper;
	private _joinWrapper : JoinGameDialogWrapper;
	private _newVersionWrapper : NewVersionDialogWrapper;

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
		this._quitButton = Html.inputElm(Html.buttonQuit);

		this._hostWrapper = new HostGameDialogWrapper();
		this._joinWrapper = new JoinGameDialogWrapper();
		this._newVersionWrapper = new NewVersionDialogWrapper();
		this._splashElm.appendChild(this._hostWrapper.elm());
		this._splashElm.appendChild(this._joinWrapper.elm());
		this._splashElm.appendChild(this._newVersionWrapper.elm());

		this._timeoutId = new Optional();
	}

	override setup() : void {	
		super.setup();

		this._hostButton.onclick = () => {
			this.hostGame();
		};
		this._joinButton.onclick = () => {
			this.browseGames();
		};

		this._legendElm.textContent = GameGlobals.version;

		const urlParams = new URLSearchParams(window.location.search);
		const room = Flags.room.get();
		if (room.length > 0) {
			const password = Flags.password.get();
			this.joinGame(room, password);
		}

		if (Flags.showQuitButton.get()) {
			this._quitButton.style.display = "revert";
		}

		this.enable();
	}

	override onGameInitialized() : void {
		super.onGameInitialized();

		this.hideLogin();
	}

	override onEnable() : void {
		super.onEnable();

		this._splashElm.style.display = "block";
		this._splashElm.style.backgroundColor = "rgba(0, 0, 0, 0.3)";
		this._loginElm.style.display = "block";

		perch.getStats((data) => {
			if (!data) {
				return;
			}
			if (Flags.checkNewVersion.get() && data.hasOwnProperty("latest") && data["latest"] > GameGlobals.latest) {
				this._newVersionWrapper.show();
			}
		}, () => {
			console.error("Error: failed to query Perch for latest version");
		});
	}

	override onDisable() : void {
		super.onDisable();
	}

	setJoinParams(room : string, password : string) : void {
		this._joinWrapper.setParams(room, password);
	}

	hideLogin() : void {
		this._splashElm.style.display = "none";
		document.body.style.background = "black";

		this.disable();
	}

	hostGame() : void {
		if (game.initialized()) {
			console.error("Error: tried to host game when game is initialized. Mode:", UiMode[ui.mode()]);
			return;
		}

		this._joinWrapper.hide();
		this._hostWrapper.show();
	}

	browseGames() : void {
		if (game.initialized()) {
			console.error("Error: tried to join game when game is initialized. Mode:", UiMode[ui.mode()]);
			return;
		}

		this._hostWrapper.hide();
		this._joinWrapper.show();
	}

	joinGame(room : string, password : string) : void {
		if (game.initialized()) {
			console.error("Error: tried to join game when game is initialized. Mode:", UiMode[ui.mode()]);
			return;
		}

		this._hostWrapper.hide();

		this._joinWrapper.prefill(room, password);
		if (this._joinWrapper.visible()) {
			this._joinWrapper.connect();
		} else {
			this._joinWrapper.show();
		}
	}
}