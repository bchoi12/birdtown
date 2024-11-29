
import { game } from 'game'

import { UiGlobals } from 'global/ui_globals'

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
        pageWrapper.elm().textContent = `Lost connection with the host. Click OK to try reconnecting.`;

		pageWrapper.setOnSubmit(() => {
			const url = new URL(window.location.href);
			url.searchParams.set(UiGlobals.roomParam, game.netcode().room());
			window.location.replace(url.toString());
		});

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			this.nextPage();
		});
	}
}