
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

import { ui } from 'ui'
import { TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

import { isElectron } from 'util/common'

export class ShareWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.setIcon(IconType.SHARE);

		this.addOnClick(() => {
			navigator.clipboard.writeText(this.getURL());
			ui.showTooltip(TooltipType.COPIED_URL, {
				ttl: 2000,
			})
		});
	}

	private getURL() : string {
		if (isElectron()) {
			return "https://birdtown.net/?room=" + game.netcode().room();
		}

		const url = new URL(window.location.href);
		url.searchParams.set(UiGlobals.roomParam, game.netcode().room());
		return url.toString();
	}
}