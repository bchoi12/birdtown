
import { game } from 'game'

import { GameGlobals } from 'global/game_globals'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class VersionMismatchDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Version Mismatch");
		this.shrink();

		let pageWrapper = this.addPage();
		pageWrapper.elm().textContent = `You are running a different version of Birdtown than the host. Click OK to return to the login screen.\r\n\r\n` +
										`Host version: ${game.runner().hostVersion()}\r\n\r\nYour version: ${GameGlobals.version}`;

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			window.location.replace(location.pathname);
		});
	}
}