
import { game } from 'game'
import { GameState } from 'game/api'

import { GameMessage, GameMessageType } from 'message/game_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { InfoType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { ScoreboardWrapper } from 'ui/wrapper/dialog/scoreboard_wrapper'

export class ScoreboardHandler extends HandlerBase implements Handler {

	private static readonly _width = "30%";
	private static readonly _hideWidth = "40%";

	private _scoreboardElm : HTMLElement;
	private _scoreboard : ScoreboardWrapper;
	private _stickyShow : boolean;

	constructor() {
		super(HandlerType.SCOREBOARD);

		this._scoreboardElm = Html.elm(Html.divScoreboard);
		this._scoreboard = new ScoreboardWrapper();
		this._stickyShow = false;

		this._scoreboardElm.appendChild(this._scoreboard.elm());
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			if (!this._stickyShow) {
				this.hide();
			}

			e.preventDefault();
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			this.show();
			e.preventDefault();
		});

		this._scoreboardElm.style.width = ScoreboardHandler._width;
		this._scoreboardElm.style.right = "-" + ScoreboardHandler._hideWidth;
		this._scoreboardElm.style.display = "block";
	}

	override handleClientMessage(msg : GameMessage) : void {
		super.handleClientMessage(msg);

		// TODO: fire onPlayerInitialized() from Tablet so color is guaranteed to exist
		if (msg.type() === GameMessageType.CLIENT_INIT) {
			this.addPlayer(msg.getClientId())
		} else if (msg.type() === GameMessageType.CLIENT_DISCONNECT) {
			this.removePlayer(msg.getClientId())
		}
	}

	addPlayer(id : number) : void {
		this._scoreboard.addPlayer(id);
	}
	removePlayer(id : number) : void {
		this._scoreboard.removePlayer(id);
	}
	updatePlayers() : void {
		this._scoreboard.updatePlayers();
	}
	updateInfo(id : number, type : InfoType, value : number) : void {
		this._scoreboard.updateInfo(id, type, value);
	}
	clearInfo(id : number, type : InfoType) : void {
		this._scoreboard.clearInfo(id, type);
	}

	show() : void {
		if (!game.initialized()) {
			return;
		}

		this._scoreboardElm.style.right = "0";
	}

	stickyShow() : void {
		this.show();
		this._stickyShow = true;
	}

	hide() : void {
		this._scoreboardElm.style.right = "-" + ScoreboardHandler._hideWidth;

		this._stickyShow = false;
	}
}