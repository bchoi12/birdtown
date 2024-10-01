
import { game } from 'game'
import { GameState, GameMode } from 'game/api'
import { PlayerState } from 'game/system/player_state'

import { settings } from 'settings'

import { InfoType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { Html, HtmlWrapper } from 'ui/html'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _defaultTypes = new Set([InfoType.SCORE, InfoType.VICTORIES, InfoType.KILLS, InfoType.DEATHS]);
	private static readonly _modeTypes = new Map<GameMode, Set<InfoType>>([
		[GameMode.SURVIVAL, new Set([InfoType.LIVES, InfoType.VICTORIES, InfoType.KILLS, InfoType.DEATHS])],
	]);

	private _titleElm : HTMLElement;
	private _keyElm : HTMLElement;
	private _containerElm : HTMLElement;
	private _infoWrappers : Map<number, InfoWrapper>;

	private _highlighted : Set<number>;

	constructor() {
		super(Html.div());

		let titleContainer = Html.span();
		titleContainer.classList.add(Html.classScoreboardTitle);

		this._titleElm = Html.span();
		this._titleElm.textContent = "Scoreboard";
		titleContainer.appendChild(this._titleElm);

		this._keyElm = Html.kbd();
		this._keyElm.style.float = "right";
		titleContainer.appendChild(this._keyElm);
		this.elm().appendChild(titleContainer);

		this._containerElm = Html.div();
		this._containerElm.classList.add(Html.classScoreboardContainer);
		this.elm().appendChild(this._containerElm);

		this._infoWrappers = new Map();

		this._highlighted = new Set();
	}

	addPlayer(id : number) : void {
		if (this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = new InfoWrapper(id);
		this._infoWrappers.set(id, wrapper);
		this._containerElm.appendChild(wrapper.elm());

		this.updateInfos(id);
		this.sort();
	}

	highlightPlayer(id : number) : void {
		if (!this._infoWrappers.has(id)) {
			this.removeHighlights();
			return;
		}

		this._infoWrappers.get(id).highlight();
		this._highlighted.add(id);
	}
	removeHighlights() : void {
		this._highlighted.forEach((id : number) => {
			if (this._infoWrappers.has(id)) {
				this._infoWrappers.get(id).removeHighlight();
			}
		})
	}

	removePlayer(id : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		this._containerElm.removeChild(wrapper.elm());
		this._infoWrappers.delete(id);
	}

	setGameMode(mode : GameMode) : void {
		this._infoWrappers.forEach((wrapper : InfoWrapper, id : number) => {
			this.updateInfos(id);
		});

		this.sort();
	}

	private updateInfos(id : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		wrapper.hideAll();

		this.modeTypes().forEach((type : InfoType) => {
			wrapper.show(type);
		});
	}
	private modeTypes() : Set<InfoType> {
		const mode = game.controller().gameMode();
		return ScoreboardWrapper._modeTypes.has(mode)
			? ScoreboardWrapper._modeTypes.get(mode) 
			: ScoreboardWrapper._defaultTypes;
	}

	updateInfo(id : number, type : InfoType, value : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		wrapper.update(type, value);

		if (this.modeTypes().has(type)) {
			wrapper.show(type);
			this.sort();
		}
	}

	clearInfo(id : number, type : InfoType) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		this._infoWrappers.get(id).hide(type);
	}

	onShow() : void {
		this._keyElm.textContent = KeyNames.get(settings.scoreboardKeyCode);
	}

	sort() : void {
		if (game.controller().gameState() === GameState.FREE) {
			return;
		}

		switch (game.controller().gameMode()) {
		case GameMode.SURVIVAL:
			this._infoWrappers.forEach((wrapper : InfoWrapper) => {
				wrapper.elm().style.order = "" + wrapper.orderDesc(InfoType.LIVES);
			});
			break;
		default:
			this._infoWrappers.forEach((wrapper : InfoWrapper) => {
				wrapper.elm().style.order = "" + wrapper.orderAsc(InfoType.SCORE);
			});
		}
	}
}