
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonSelectWrapper } from 'ui/wrapper/button/button_select_wrapper'

import { Optional } from 'util/optional'

export class ModeSelectWrapper extends ButtonSelectWrapper {

	private _minPlayers : number;
	private _maxPlayers : number;
	private _minRecommended : Optional<number>;
	private _maxRecommended : Optional<number>;

	private _valid : boolean;
	private _recommended : boolean;

	constructor() {
		super();

		this._minPlayers = 0;
		this._maxPlayers = 9999;
		this._minRecommended = new Optional();
		this._maxRecommended = new Optional();

		this._valid = false;
		this._recommended = false;
		this.setValid(true);

		this.elm().classList.add(Html.classModeSelect);
	}

	setNumPlayers(players : number) : void {
		if (players < this._minPlayers) {
			this.setValid(false);
		} else {
			this.setValid(true);
		}

		if (players > this._maxPlayers) {
			this.setRecommended(false);
		} else if (this._minRecommended.has() && players < this._minRecommended.get()) {
			this.setRecommended(false);
		} else if (this._maxRecommended.has() && players > this._maxRecommended.get()) {
			this.setRecommended(false);
		} else if (this._minRecommended.has() || this._maxRecommended.has()) {
			this.setRecommended(true);
		}
	}
	setMinPlayers(min : number) : void { this._minPlayers = min; }
	setMaxPlayers(max : number) : void { this._maxPlayers = max; }
	setMinRecommended(min : number) : void { this._minRecommended.set(min); }
	setMaxRecommended(max : number) : void { this._maxRecommended.set(max); }

	override select() : void {
		super.select();

		if (this._valid) {
			this.setIcon(IconType.CHECK);
		}
	}

	override unselect() : void {
		super.unselect();

		if (this._recommended) {
			this.setIcon(IconType.STAR);
		} else {
			this.clearIcon();
		}
	}

	private setValid(valid : boolean) : void {
		if (this._valid === valid) {
			return;
		}

		if (valid) {
			this.elm().classList.remove(Html.classModeSelectInvalid);
		} else {
			this.elm().classList.add(Html.classModeSelectInvalid);
			this.setRecommended(false);
		}

		this._valid = valid;
	}

	private setRecommended(recommended : boolean) : void {
		if (this._recommended === recommended) {
			return;
		}

		if (recommended) {
			this.setIcon(IconType.STAR);
		} else {
			this.clearIcon();
		}

		this._recommended = recommended;
	}
}