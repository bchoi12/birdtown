
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

import { settings } from 'settings'

export class ResetGraphicsWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.setIcon(IconType.RESET_SETTINGS);

		this.addOnClick(() => {
			settings.recommendedGraphics();
			ui.refreshSettings();
		});
	}
}