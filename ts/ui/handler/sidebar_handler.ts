
import { game } from 'game'
import { GameState } from 'game/api'

import { GameMessage, GameMessageType } from 'message/game_message'
import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { ui } from 'ui'
import { InfoType, KeyType, UiMode } from 'ui/api'
import { Html } from 'ui/html'
import { Handler, HandlerBase } from 'ui/handler'
import { HandlerType } from 'ui/handler/api'
import { RulesDialogWrapper } from 'ui/wrapper/dialog/rules_dialog_wrapper'
import { ScoreboardWrapper } from 'ui/wrapper/scoreboard_wrapper'

export class SidebarHandler extends HandlerBase implements Handler {

	private static readonly _width = "25%";
	private static readonly _hideWidth = "35%";

	private _gameInfoElm : HTMLElement;
	private _rules : RulesDialogWrapper;
	private _scoreboardElm : HTMLElement;
	private _scoreboard : ScoreboardWrapper;
	private _stickyShow : boolean;

	constructor() {
		super(HandlerType.SIDEBAR);

		this._gameInfoElm = Html.elm(Html.divGameInfo);
		this._scoreboardElm = Html.elm(Html.divScoreboard);
		this._rules = new RulesDialogWrapper();
		this._scoreboard = new ScoreboardWrapper();
		this._stickyShow = false;

		this._gameInfoElm.appendChild(this._rules.elm());
		this._scoreboardElm.appendChild(this._scoreboard.elm());
	}

	override onPlayerInitialized() : void {
		super.onPlayerInitialized();

		document.addEventListener("keyup", (e : any) => {
			if (e.keyCode !== settings.keyCode(KeyType.SCOREBOARD)) return;

			this.hideRules();
			if (!this._stickyShow) {
				this.hideScore();
			}

			e.preventDefault();
		});

		document.addEventListener("keydown", (e : any) => {
			if (e.keyCode !== settings.keyCode(KeyType.SCOREBOARD)) return;

			this.showRules();
			this.showScore();
			e.preventDefault();
		});

		this._scoreboardElm.style.width = SidebarHandler._width;
		this._scoreboardElm.style.right = "-" + SidebarHandler._hideWidth;
		this._scoreboardElm.style.display = "block";
	}

	setGameState(state : GameState) : void {
		if (state === GameState.FINISH || state === GameState.VICTORY) {
			this.stickyShow();
		} else {
			this.hideScore();
			this.hideRules();
		}
	}

	addPlayer(id : number) : void {
		this._scoreboard.addPlayer(id);
	}
	highlightPlayer(id : number) : void {
		this._scoreboard.highlightPlayer(id)
	}
	removePlayer(id : number) : void {
		this._scoreboard.removePlayer(id);
	}
	setGameConfig(config : GameConfigMessage) : void {
		this._scoreboard.setGameConfig(config);
		this._rules.setGameConfig(config);
	}
	updateInfo(id : number, type : InfoType, value : number) : void {
		this._scoreboard.updateInfo(id, type, value);
	}
	clearInfo(id : number, type : InfoType) : void {
		this._scoreboard.clearInfo(id, type);
	}
	refreshColor() : void {
		this._scoreboard.refreshColor();
	}

	private showScore() : void {
		if (!game.initialized()) {
			return;
		}

		this._scoreboardElm.style.right = "0";
		this._scoreboard.onShow();
	}

	private showRules() : void {
		if (!game.initialized()) {
			return;
		}

		this._rules.show();
	}

	private stickyShow() : void {
		this.showScore();

		this._stickyShow = true;
	}

	private hideScore() : void {
		this._scoreboardElm.style.right = "-" + SidebarHandler._hideWidth;

		this._scoreboard.removeHighlights();
		this._stickyShow = false;
	}

	private hideRules() : void {
		this._rules.hide();
	}
}