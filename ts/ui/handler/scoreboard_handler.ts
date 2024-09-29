
import { game } from 'game'
import { GameState } from 'game/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { InfoType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { ScoreboardWrapper } from 'ui/wrapper/dialog/scoreboard_wrapper'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardHandler extends HandlerBase implements Handler {

	private static readonly _width = "20%";

	private _scoreboardElm : HTMLElement;
	private _scoreboard : ScoreboardWrapper;

	constructor() {
		super(HandlerType.SCOREBOARD);

		this._scoreboardElm = Html.elm(Html.divScoreboard);
		this._scoreboard = new ScoreboardWrapper();

		this._scoreboardElm.appendChild(this._scoreboard.elm());
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			this.hide();
			e.preventDefault();
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			this.show();
			e.preventDefault();
		});

		this._scoreboardElm.style.width = ScoreboardHandler._width;
		this._scoreboardElm.style.right = "-" + ScoreboardHandler._width;
		this._scoreboardElm.style.display = "block";
	}

	updateInfo(id : number, type : InfoType, value : number) : void {
		this._scoreboard.infoWrapper().updateInfo(id, type, value);
	}
	clearInfo(id : number, type : InfoType) : void {
		this._scoreboard.infoWrapper().clearInfo(id, type);
	}

	private show() : void {
		if (!game.initialized()) {
			return;
		}

		this._scoreboardElm.style.right = "0";
	}

	private hide() : void {
		this._scoreboardElm.style.right = "-" + ScoreboardHandler._width;
	}
}