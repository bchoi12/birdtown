
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { StatusType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

import { settings } from 'settings'

export class LowestSpecWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.setIcon(IconType.LOWEST_SPEC);

		this.addOnClick(() => {
			settings.lowestSpec();
			ui.disableStatus(StatusType.DEGRADED);
			ui.refreshSettings();
		});
	}
}