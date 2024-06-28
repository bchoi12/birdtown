
import { game } from 'game'
import { GameState } from 'game/api'

import { settings } from 'settings'

import { ui } from 'ui'
import { InfoType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardHandler extends HandlerBase implements Handler {

	private _scoreboardElm : HTMLElement;
	private _containerElm : HTMLElement;
	private _infoWrapper : InfoWrapper;

	constructor() {
		super(HandlerType.SCOREBOARD);

		this._scoreboardElm = Html.elm(Html.divScoreboard);

		this._containerElm = Html.div();
		this._containerElm.classList.add(Html.classDialogContainer);
		this._scoreboardElm.appendChild(this._containerElm);

		this._infoWrapper = new InfoWrapper();
		this._containerElm.appendChild(this._infoWrapper.elm());
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
		this._infoWrapper.updateInfo(id, type, value);
	}
	clearInfo(id : number, type : InfoType) : void {
		this._infoWrapper.clearInfo(id, type);
	}

	private show() : void {
		if (!game.initialized()) {
			return;
		}
		this._scoreboardElm.style.visibility = "visible";
	}

	private hide() : void {
		this._scoreboardElm.style.visibility = "hidden";
	}
}