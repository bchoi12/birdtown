
import { game } from 'game'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class QuitDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("Quit");
		this.shrink();

		let pageWrapper = this.addPage();

		if (game.isHost()) {
			pageWrapper.elm().textContent = "Are you sure?\r\n\r\nThis will end the game for all players."
		} else {
			pageWrapper.elm().textContent = "Are you sure?"			
		}

		pageWrapper.setOnSubmit(() => {
			window.location.replace(location.pathname);
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