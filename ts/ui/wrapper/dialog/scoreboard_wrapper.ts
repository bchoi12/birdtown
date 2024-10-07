
import { game } from 'game'
import { GameMode, GameState } from 'game/api'
import { Tablet } from 'game/system/tablet'

import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { InfoType } from 'ui/api'
import { KeyNames } from 'ui/common/key_names'
import { Html, HtmlWrapper } from 'ui/html'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardWrapper extends HtmlWrapper<HTMLElement> {

	private _titleElm : HTMLElement;
	private _keyElm : HTMLElement;
	private _containerElm : HTMLElement;
	private _infoWrappers : Map<number, InfoWrapper>;

	private _highlighted : Set<number>;

	constructor() {
		super(Html.div());

		let titleContainer = Html.div();
		titleContainer.classList.add(Html.classScoreboardTitle);

		this._titleElm = Html.span();
		this._titleElm.textContent = "Scoreboard";
		titleContainer.appendChild(this._titleElm);

		this._keyElm = Html.kbd();
		this._keyElm.style.float = "right";
		this._keyElm.style.marginRight = "0.5em";
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

		this.updateInfos(game.controller().gameMode(), id);
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

	setGameConfig(config : GameConfigMessage) : void {
		this._infoWrappers.forEach((wrapper : InfoWrapper, id : number) => {
			this.updateInfos(config.type(), id);
		});

		this.sort();
	}

	private updateInfos(mode : GameMode, id : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		wrapper.hideAll();

		Tablet.infoTypes(mode).forEach((type : InfoType) => {
			wrapper.show(type);
		});
	}

	updateInfo(id : number, type : InfoType, value : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		wrapper.update(type, value);

		wrapper.show(type);
		this.sort();
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
				wrapper.elm().style.order = "" + wrapper.orderDesc(InfoType.SCORE);
			});
		}
	}
}