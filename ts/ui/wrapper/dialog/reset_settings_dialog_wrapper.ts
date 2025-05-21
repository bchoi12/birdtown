
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class ResetSettingsDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Reset Settings");
		this.shrink();
		this.important();

		let pageWrapper = this.addPage();
		pageWrapper.elm().textContent = "Are you sure you want to reset ALL settings?";

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			settings.reset();
			ui.refreshSettings();
			this.nextPage();
		});

		let cancelButton = this.addCancelButton();
		cancelButton.addOnClick(() => {
			this.cancel();
		});
	}
}