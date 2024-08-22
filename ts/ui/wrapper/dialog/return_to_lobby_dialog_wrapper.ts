
import { game } from 'game'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class ReturnToLobbyDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.titleElm().textContent = "Quit Game";

		let pageWrapper = this.addPage();

		pageWrapper.elm().textContent = "Are you sure? This will end the current game and all players will return to the lobby."

		pageWrapper.setOnSubmit(() => {
			game.controller().returnToLobby();
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