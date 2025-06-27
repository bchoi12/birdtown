
import { IconType } from 'ui/common/icon'
import { Html } from 'ui/html'
import { ButtonSelectWrapper } from 'ui/wrapper/button/button_select_wrapper'

import { Optional } from 'util/optional'

export class EquipSelectWrapper extends ButtonSelectWrapper {

	private _invalid : boolean;
	private _recommended : boolean;

	constructor() {
		super();

		this._invalid = false;
		this._recommended = false;

		this.elm().classList.add(Html.classEquipSelect);
	}

	protected override canSelect() : boolean { return !this._invalid; }

	setInvalid(invalid : boolean) : void {
		if (invalid) {
			this.elm().classList.add(Html.classEquipSelectInvalid);
		} else {
			this.elm().classList.remove(Html.classEquipSelectInvalid);
		}

		this._invalid = invalid;
	}

	setRecommended(recommended : boolean) : void {
		if (recommended) {
			this.setIcon(IconType.STAR);
		}

		this._recommended = recommended;
	}
}