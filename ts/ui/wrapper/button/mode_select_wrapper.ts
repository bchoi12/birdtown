
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
	private _selected : boolean;

	constructor() {
		super();

		this._minPlayers = 0;
		this._maxPlayers = 9999;
		this._minRecommended = new Optional();
		this._maxRecommended = new Optional();

		this._valid = false;
		this._recommended = false;
		this._selected = false;
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

	override select() : boolean {
		super.select();

		if (this._selected) {
			return false;
		}

		this._selected = true;
		this.updateHTML();

		return true;
	}

	override unselect() : boolean {
		super.unselect();

		if (!this._selected) {
			return false;
		}

		this._selected = false;
		this.updateHTML();
		return true;
	}

	private setValid(valid : boolean) : void {
		if (this._valid === valid) {
			return;
		}

		this._valid = valid;

		this.updateHTML();
	}

	private setRecommended(recommended : boolean) : void {
		if (this._recommended === recommended) {
			return;
		}

		this._recommended = recommended;

		this.updateHTML();
	}

	private updateHTML() : void {
		if (this._valid) {
			this.elm().classList.remove(Html.classModeSelectInvalid);
		} else {
			this.elm().classList.add(Html.classModeSelectInvalid);
		}

		if (this._selected) {
			this.setIcon(IconType.CHECK);
		} else if (this._valid && this._recommended) {
			this.setIcon(IconType.STAR);
		} else {
			this.clearIcon();
		}
	}
}