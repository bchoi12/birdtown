
import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { IconType } from 'ui/common/icon'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'

export class ResetSettingsWrapper extends ButtonWrapper {

	constructor() {
		super();

		this.setIcon(IconType.RESET_SETTINGS);

		this.addOnClick(() => {
			ui.pushDialog(DialogType.RESET_SETTINGS);
		});
	}
}