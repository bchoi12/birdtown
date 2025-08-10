
import { game } from 'game'
import { GameState } from 'game/api'
import { WinConditionType } from 'game/system/api'
import { Tablet } from 'game/system/tablet'

import { GameConfigMessage } from 'message/game_config_message'

import { settings } from 'settings'

import { InfoType, KeyType } from 'ui/api'
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
			this._infoWrappers.get(id).refresh();
			return;
		}

		let wrapper = new InfoWrapper(id);
		this._infoWrappers.set(id, wrapper);
		this._containerElm.appendChild(wrapper.elm());

		this.showInfos(id, game.controller().config());
		this.sort();
	}

	highlightPlayer(id : number) : void {
		if (!this._infoWrappers.has(id)) {
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
			this.showInfos(id, config);
		});

		this.sort();
	}

	private showInfos(id : number, config : GameConfigMessage) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		wrapper.hideAll();

		Tablet.infoTypes(config.getWinConditionOr(WinConditionType.NONE)).forEach((type : InfoType) => {
			wrapper.show(type);
		});
		this.sort();
	}

	updateInfo(id : number, type : InfoType, value : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		wrapper.update(type, value);

		if (Tablet.infoTypes(game.controller().config().getWinConditionOr(WinConditionType.NONE)).has(type)) {
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

	refreshColor() : void {
		this._infoWrappers.forEach((wrapper : InfoWrapper) => {
			wrapper.refreshColor();
		});
	}

	onShow() : void {
		this._keyElm.textContent = KeyNames.get(settings.keyCode(KeyType.SCOREBOARD));
		this.sort();
	}

	sort() : void {
		switch (game.controller().config().getWinConditionOr(WinConditionType.NONE)) {
		case WinConditionType.NONE:
			this._infoWrappers.forEach((wrapper : InfoWrapper, id : number) => {
				let team = 0;
				if (game.tablets().hasTablet(id)) {
					team = game.tablet(id).team();
				}

				wrapper.elm().style.order = "" + (100 * team + wrapper.orderDesc(InfoType.WINS));
			});
			break;
		case WinConditionType.LIVES:
		case WinConditionType.TEAM_LIVES:
			this._infoWrappers.forEach((wrapper : InfoWrapper, id : number) => {
				let team = 0;
				if (game.tablets().hasTablet(id)) {
					team = game.tablet(id).team();
				}

				wrapper.elm().style.order = "" + (100 * team + wrapper.orderDesc(InfoType.LIVES));
			});
			break;
		default:
			this._infoWrappers.forEach((wrapper : InfoWrapper, id : number) => {
				let team = 0;
				if (game.tablets().hasTablet(id)) {
					team = game.tablet(id).team();
				}

				wrapper.elm().style.order = "" + (100 * team + wrapper.orderDesc(InfoType.SCORE));
			});
		}
	}
}