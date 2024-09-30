
import { ui } from 'ui'
import { InfoType } from 'ui/api'
import { IconType } from 'ui/common/icon'
import { Html, HtmlWrapper } from 'ui/html'
import { IconWrapper } from 'ui/wrapper/icon_wrapper'
import { NameWrapper } from 'ui/wrapper/name_wrapper'

export class InfoWrapper extends HtmlWrapper<HTMLElement> {

	public static readonly _maxOrderValue = 999;

	private _nameWrapper : NameWrapper;
	private _iconWrappers : Map<InfoType, IconWrapper>;

	// For sorting
	private _values : Map<InfoType, number>; 

	constructor(clientId : number) {
		super(Html.div());

		this.elm().classList.add(Html.classInfo);

		this._nameWrapper = new NameWrapper();
		this._nameWrapper.setClientId(clientId);
		this._nameWrapper.elm().style.width = "100%";
		this.elm().appendChild(this._nameWrapper.elm());

		this._iconWrappers = new Map();
		this._values = new Map();
	}

	add(type : InfoType) : IconWrapper {
		if (this._iconWrappers.has(type)) {
			console.error("Warning: skipping add since %s already exists", InfoType[type]);
			return;
		}

		let wrapper = new IconWrapper();
		wrapper.elm().style.flex = "1";
		this._iconWrappers.set(type, wrapper);
		this.elm().appendChild(wrapper.elm());
		return wrapper;
	}
	update(type : InfoType, value : number) : void {
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
	clear(type : InfoType) : void {
		if (!this._iconWrappers.has(type)) {
			return;
		}

		this.elm().removeChild(this._iconWrappers.get(type).elm());
		this._iconWrappers.delete(type);
		this._values.delete(type);
	}

	orderDesc(type : InfoType) : number {
		return this._values.has(type) ? -this._values.get(type) : InfoWrapper._maxOrderValue;
	}

	orderAsc(type : InfoType) : number {
		return this._values.has(type) ? this._values.get(type) : InfoWrapper._maxOrderValue;
	}

	private setKills(kills : number) : void {
		if (!this._iconWrappers.has(InfoType.KILLS)) {
			let wrapper = this.add(InfoType.KILLS);
			wrapper.setIcon(IconType.SKILLET);
		}

		let wrapper = this._iconWrappers.get(InfoType.KILLS);
		wrapper.setText("" + kills);
	}

	private setDeaths(deaths : number) : void {
		if (!this._iconWrappers.has(InfoType.DEATHS)) {
			let wrapper = this.add(InfoType.DEATHS);
			wrapper.setIcon(IconType.SKULL);
		}

		let wrapper = this._iconWrappers.get(InfoType.DEATHS);
		wrapper.setText("" + deaths);
	}

	private setLives(lives : number) : void {
		if (!this._iconWrappers.has(InfoType.LIVES)) {
			this.add(InfoType.LIVES);
		}

		let wrapper = this._iconWrappers.get(InfoType.LIVES);
		wrapper.setIconN(IconType.BIRD, lives);
	}

	private setVictories(victories : number) : void {
		if (!this._iconWrappers.has(InfoType.VICTORIES)) {
			this.add(InfoType.VICTORIES);
		}

		let wrapper = this._iconWrappers.get(InfoType.VICTORIES);
		wrapper.setIconN(IconType.TROPHY, victories);
	}

	private setScore(score : number) : void {
		if (!this._iconWrappers.has(InfoType.SCORE)) {
			this.add(InfoType.SCORE);
		}

		let wrapper = this._iconWrappers.get(InfoType.SCORE);
		wrapper.setText(score + " pts");
	}
}