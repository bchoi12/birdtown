
import { game } from 'game'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class RematchDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Rematch");
		this.shrink();

		let pageWrapper = this.addPage();
		pageWrapper.elm().textContent = "Run it back with the exact same settings?"

		pageWrapper.setOnSubmit(() => {
			game.controller().rematch();
		});

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});

		let cancelButton = this.addCancelButton();
		cancelButton.addOnClick(() => {
			this.cancel();
		});
	}
}