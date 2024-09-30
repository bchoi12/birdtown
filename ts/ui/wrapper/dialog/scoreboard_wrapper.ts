
import { game } from 'game'
import { GameState, GameMode } from 'game/api'
import { PlayerState } from 'game/system/player_state'

import { InfoType } from 'ui/api'
import { Html, HtmlWrapper } from 'ui/html'
import { InfoWrapper } from 'ui/wrapper/info_wrapper'

export class ScoreboardWrapper extends HtmlWrapper<HTMLElement> {

	private _infoWrappers : Map<number, InfoWrapper>;

	constructor() {
		super(Html.div());

		this._infoWrappers = new Map();

		this.elm().classList.add(Html.classScoreboardContainer);
	}

	addPlayer(id : number) : void {
		if (this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = new InfoWrapper(id);
		this._infoWrappers.set(id, wrapper);
		this.elm().appendChild(wrapper.elm());

		this.sort();
	}

	removePlayer(id : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		let wrapper = this._infoWrappers.get(id);
		this.elm().removeChild(wrapper.elm());
		this._infoWrappers.delete(id);
	}

	updatePlayers() : void {
		this._infoWrappers.forEach((wrapper : InfoWrapper, id : number) => {
			this.removePlayer(id);
		});

		game.playerStates().executeIf((playerState : PlayerState) => {
			this.addPlayer(playerState.clientId());
		}, (playerState : PlayerState) => {
			return playerState.isPlaying();
		});

		this.sort();
	}

	updateInfo(id : number, type : InfoType, value : number) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		this._infoWrappers.get(id).update(type, value);
		this.sort();
	}

	clearInfo(id : number, type : InfoType) : void {
		if (!this._infoWrappers.has(id)) {
			return;
		}

		this._infoWrappers.get(id).clear(type);
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