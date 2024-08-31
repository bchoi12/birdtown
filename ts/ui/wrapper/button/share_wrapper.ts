
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ShareWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.setIcon(IconType.SHARE);

		this.addOnClick(() => {
			navigator.clipboard.writeText(window.location.href + "?" + UiGlobals.roomParam + "=" + game.netcode().room());
			ui.showTooltip(TooltipType.COPIED_URL, {
				ttl: 2000,
			})
		});
	}
}