
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { StatusType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

import { settings } from 'settings'

export class LowSpecWrapper extends ButtonWrapper {

	private _canHighlight : boolean;

	constructor() {
		super();

		this._canHighlight = true;

		this.setIcon(IconType.LOW_SPEC);

		this.addOnClick(() => {
			settings.lowSpec();
			ui.disableStatus(StatusType.DEGRADED);
			ui.refreshSettings();

			this.elm().classList.remove(Html.classHighlight);
			this._canHighlight = false;
		});
	}

	highlight() : void {
		if (!this._canHighlight) {
			return;
		}

		this.elm().classList.add(Html.classHighlight);
	}
}