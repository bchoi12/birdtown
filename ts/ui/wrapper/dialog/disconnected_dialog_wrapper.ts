
import { game } from 'game'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class DisconnectedDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Disconnected");
		this.shrink();

		let pageWrapper = this.addPage();
        pageWrapper.elm().textContent = `Lost connection with the host. Please click OK to return to the login menu.`;

		pageWrapper.setOnSubmit(() => {
			window.location.replace(location.pathname);
		});

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});
	}
}