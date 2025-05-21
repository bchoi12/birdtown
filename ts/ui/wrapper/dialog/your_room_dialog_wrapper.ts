
import { game } from 'game'

import { settings } from 'settings'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class YourRoomDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Your Room");
		this.shrink();
		this.important();

		let pageWrapper = this.addPage();
		pageWrapper.elm().textContent = "Cannot join this room since it's hosted on your machine!";

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});
	}
}