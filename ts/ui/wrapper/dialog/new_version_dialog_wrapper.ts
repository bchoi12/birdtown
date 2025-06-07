
import { game } from 'game'

import { ui } from 'ui'
import { DialogType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class NewVersionDialogWrapper extends DialogWrapper {

	constructor() {
		super();

		this.setTitle("New Version");
		this.shrink();
		this.important();

		let pageWrapper = this.addPage();

		const windows = `<kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>`;
		const mac = `<kbd>⌘</kbd> + <kbd>Shift</kbd> + <kbd>R</kbd>`;
		pageWrapper.elm().innerHTML = `A new version of Birdtown is available! Please reload your game.<br><br>Windows/Linux<br>${windows}<br><br>Mac<br>${mac}`

		let cancelButton = this.addCancelButton("Close");
		cancelButton.addOnClick(() => {
			this.cancel();
			this.hide();
		});
	}
}