
import { game } from 'game'

import { ui } from 'ui'
import { InfoType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { InfoBlockWrapper } from 'ui/wrapper/info_block_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'

export class InfoWrapper extends HtmlWrapper<HTMLElement> {

	private static readonly _maxOrderValue = 999;
	private static readonly _types = new Array(
		// Top right (oneof)
		InfoType.LIVES, InfoType.SCORE,
		// Bottom left
		InfoType.VICTORIES,
		// Bottom right (backwards)
		InfoType.DEATHS, InfoType.KILLS,
	);


	private _mainElm : HTMLElement;
	private _secondaryElm : HTMLElement;
	private _nameWrapper : NameWrapper;
	private _blocks : Map<InfoType, InfoBlockWrapper>;

	// For sorting
	private _values : Map<InfoType, number>; 

	constructor(clientId : number) {
		super(Html.div());

		this.elm().classList.add(Html.classInfo);

		this._mainElm = Html.div();
		this._mainElm.classList.add(Html.classInfoMain);
		this.elm().appendChild(this._mainElm);

		this._secondaryElm = Html.div();
		this._secondaryElm.classList.add(Html.classInfoSecondary);
		this._secondaryElm.style.fontSize = "0.7em";
		this.elm().appendChild(this._secondaryElm);

		this._nameWrapper = new NameWrapper();
		this._nameWrapper.setClientId(clientId);
		this._nameWrapper.elm().style.float = "left";
		this._mainElm.appendChild(this._nameWrapper.elm());

		this._blocks = new Map();
		this._values = new Map();

		InfoWrapper._types.forEach((type : InfoType) => {
			this.add(type);
		});
	}

	private add(type : InfoType) : InfoBlockWrapper {
		if (this._blocks.has(type)) {
			console.error("Warning: skipping add since %s already exists", InfoType[type]);
			return;
		}

		let wrapper = new InfoBlockWrapper();

		switch (type) {
		case InfoType.KILLS:
			wrapper.setIcon(IconType.SKILLET);
			wrapper.setText("0");
			wrapper.elm().style.float = "right";
			this._secondaryElm.appendChild(wrapper.elm());
			break;
		case InfoType.DEATHS:
			wrapper.setIcon(IconType.SKULL);
			wrapper.setText("0");
			wrapper.elm().style.float = "right";
			this._secondaryElm.appendChild(wrapper.elm());
			break;			
		case InfoType.LIVES:
			wrapper.elm().style.float = "right";
			this._mainElm.appendChild(wrapper.elm());
			break;
		case InfoType.SCORE:
			wrapper.setText("0 pts");
			wrapper.elm().style.float = "right";
			this._mainElm.appendChild(wrapper.elm());
			break;
		case InfoType.VICTORIES:
			wrapper.elm().style.float = "left";
			this._secondaryElm.appendChild(wrapper.elm());
			break;
		default:
			console.error("Error: cannot add", InfoType[type]);
			return;
		}

		this._blocks.set(type, wrapper);
	}

	show(type : InfoType) : void {
		if (!this._blocks.has(type)) {
			console.error("Error: cannot show missing block for", InfoType[type]);
			return;
		}

		this._blocks.get(type).show();

		if (!this._values.has(type)) {
			this.update(type, 0);
		}
	}
	update(type : InfoType, value : number) : void {
		if (!this._blocks.has(type)) {
			console.error("Error: cannot update missing block for", InfoType[type]);
			return;
		}

		this._values.set(type, value);

		switch (type) {
		case InfoType.KILLS:
			this.setKills(value);
			break;
		case InfoType.DEATHS:
			this.setDeaths(value);
			break;
		case InfoType.LIVES:
			this.setLives(value);
			break;
		case InfoType.SCORE:
			this.setScore(value);
			break;
		case InfoType.VICTORIES:
			this.setVictories(value);
			break;
		default:
			console.error("Error: missing handling for", InfoType[type]);
		}
	}

	highlight() : void { this.elm().classList.add(Html.classInfoHighlight); }
	removeHighlight() : void { this.elm().classList.remove(Html.classInfoHighlight); }

	refreshColor() : void { this._nameWrapper.refreshColor(); }

	hide(type : InfoType) : void {
		if (!this._blocks.has(type)) {
			return;
		}

		let wrapper = this._blocks.get(type);
		wrapper.hide();
		this._values.delete(type);
	}
	hideAll() : void {
		this._blocks.forEach((wrapper : InfoBlockWrapper, type : InfoType) => {
			this.hide(type);
		});
	}

	orderDesc(type : InfoType) : number {
		return this._values.has(type) ? -this._values.get(type) : InfoWrapper._maxOrderValue;
	}

	orderAsc(type : InfoType) : number {
		return this._values.has(type) ? this._values.get(type) : InfoWrapper._maxOrderValue;
	}

	private setKills(kills : number) : void {
		let wrapper = this._blocks.get(InfoType.KILLS);
		wrapper.setText("" + kills);
	}

	private setDeaths(deaths : number) : void {
		let wrapper = this._blocks.get(InfoType.DEATHS);
		wrapper.setText("" + deaths);
	}

	private setLives(lives : number) : void {
		let wrapper = this._blocks.get(InfoType.LIVES);

		if (lives === 0) {
			wrapper.setIcon(IconType.SKULL);
		} else {
			wrapper.setIconN(IconType.BIRD, lives);
		}
	}

	private setVictories(victories : number) : void {
		let wrapper = this._blocks.get(InfoType.VICTORIES);

		const config = game.controller().config();

		if (config.hasVictories()) {
			wrapper.setIconFraction(IconType.TROPHY, victories, config.getVictories());
		} else {
			wrapper.setIconN(IconType.TROPHY, victories);
		}
	}

	private setScore(score : number) : void {
		let wrapper = this._blocks.get(InfoType.SCORE);
		wrapper.setText(score + " pts");
	}
}