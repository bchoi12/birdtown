
import { game } from 'game'

import { ui } from 'ui'
import { DialogType, TooltipType } from 'ui/api'
import { Html } from 'ui/html'
import { ButtonWrapper } from 'ui/wrapper/button_wrapper'
import { DialogWrapper } from 'ui/wrapper/dialog_wrapper'
import { PageWrapper } from 'ui/wrapper/page_wrapper'

export class RematchDialogWrapper extends DialogWrapper {

	private _failed : boolean;

	constructor() {
		super();

		this._failed = false;

		this.setTitle("Rematch");
		this.shrink();

		let pageWrapper = this.addPage();
		pageWrapper.elm().textContent = "Run it back with the exact same settings?"

		let okButton = this.addOKButton();
		okButton.addOnClick(() => {
			if (!this._failed) {
				const success = game.controller().rematch();

				if (!success) {
					this.addFailurePage();
					this._failed = true;
				}					
			}
		
			this.nextPage();				
		});

		let cancelButton = this.addCancelButton();
		cancelButton.addOnClick(() => {
			this.cancel();
		});
	}

	private addFailurePage() : void {
		let pageWrapper = this.addPage();
		pageWrapper.elm().textContent = "Failed to start the rematch. This is likely due to players changing.\r\n\r\nYou can still start a game manually."
	}
}