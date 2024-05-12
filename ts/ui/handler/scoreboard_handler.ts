
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { ScoreWrapper } from 'ui/wrapper/score_wrapper'

export class ScoreboardHandler extends HandlerBase implements Handler {

	private _scoreboardElm : HTMLElement;

	private _tempElm : HTMLElement;

	constructor() {
		super(HandlerType.SCOREBOARD);

		this._scoreboardElm = Html.elm(Html.divScoreboard);

		this._tempElm = Html.div();
		this._scoreboardElm.appendChild(this._tempElm);
	}

	override setup() : void {
		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			e.preventDefault();
			this.hideScores();
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.scoreboardKeyCode) return;

			e.preventDefault();

			// TODO: only show during GameState.GAME
			this.showScores();
		})
	}

	private showScores() : void {
		if (!game.initialized()) {
			return;
		}

		if (this._scoreboardElm.style.visibility === "visible") {
			return;
		}

		// TODO: use ScoreWrapper, this sucks
		// TODO: have tablet update this directly
		this._tempElm.textContent = "";
		for (const score of game.tablets().scores()) {
			this._tempElm.textContent += "\t" + score.displayName + ": " + score.roundScore + "\r\n";
		}
		this._scoreboardElm.style.visibility = "visible";
	}

	private hideScores() : void {
		this._scoreboardElm.style.visibility = "hidden";
	}
}