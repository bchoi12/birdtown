
import { game } from 'game'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ShareWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.setIcon(IconType.SHARE);

		this.addOnClick(() => {
			navigator.clipboard.writeText(ui.getInviteLink()).then(() => {
				ui.showTooltip(TooltipType.COPIED_URL, {
					ttl: 2000,
				});
			}, () => {
				ui.pushDialog(DialogType.FAILED_COPY);
			});
		});
	}
}