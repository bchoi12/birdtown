
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

export class RoundFinishHandler extends HandlerBase implements Handler {

	private _scoreboardElm : HTMLElement;
	private _scoreboard : ScoreboardWrapper;

	constructor() {
		super(HandlerType.GAME_FINISH);

		this._scoreboardElm = Html.elm(Html.divScoreboard);
		this._scoreboard = new ScoreboardWrapper();

		this._scoreboardElm.appendChild(this._scoreboard.elm());
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			e.preventDefault();
			this.hide();
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			e.preventDefault();

			this.show();
		})
	}

	updateInfo(id : number, type : InfoType, value : number | string) : void {
		this._scoreboard.infoWrapper().updateInfo(id, type, value);
	}
	clearInfo(id : number, type : InfoType) : void {
		this._scoreboard.infoWrapper().clearInfo(id, type);
	}

	private show() : void {
		if (!game.initialized()) {
			return;
		}

		this._scoreboard.show();
	}

	private hide() : void {
		this._scoreboard.hide();	
	}
}